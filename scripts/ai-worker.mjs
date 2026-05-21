// 로컬 AI 워커 — Supabase ai_jobs 큐를 폴링해 claude CLI로 처리.
// 서버(Vercel)는 작업을 적재만 하고, 이 스크립트는 claude가 설치된
// 머신(예: 상시 켜진 Mac mini)에서 돈다. Supabase로 아웃바운드 접속만 하므로
// 포트포워딩/인바운드 불필요.
//
// 실행:
//   npm run ai:worker            # 한 번 비우고 종료
//   npm run ai:worker -- --watch # 상시 폴링 (launchd 서비스용)
//
// 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (.env.local)
// 선택: POLL_MS(기본 10000), JOB_TIMEOUT_MS(기본 600000),
//       CLAUDE_BIN(기본 "claude"), CLAUDE_ARGS(기본 아래 DEFAULT_CLAUDE_ARGS)

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { postProcessVisuals } from "./lib/post-process-visuals.mjs";
import { closeBrowser } from "./lib/visual-render.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const WATCH = process.argv.includes("--watch");
const POLL_MS = Number(process.env.POLL_MS ?? 10_000);
const JOB_TIMEOUT_MS = Number(process.env.JOB_TIMEOUT_MS ?? 600_000);
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? "claude";
// 무인 워커 — 모든 권한 체크 우회(WebFetch/Bash/yt-dlp 사용). 신뢰된 로컬 머신 전용.
// 다른 정책이 필요하면 CLAUDE_ARGS 환경변수로 덮어쓴다.
const DEFAULT_CLAUDE_ARGS = "-p --permission-mode bypassPermissions";
const CLAUDE_ARGS = (process.env.CLAUDE_ARGS ?? DEFAULT_CLAUDE_ARGS).split(/\s+/).filter(Boolean);

// 시각자료 렌더 — 이 머신에서 도는 Next.js 서버 주소. 워커가 Playwright로 접속한다.
const VISUAL_BASE_URL = (process.env.VISUAL_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const INTERNAL_VISUAL_TOKEN = process.env.INTERNAL_VISUAL_TOKEN ?? "";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const POSTING = readFileSync(join(ROOT, "POSTING.md"), "utf8");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();
const short = (s, n = 500) => (s && s.length > n ? s.slice(0, n) + "…" : s ?? null);

// claude CLI 호출 — 프롬프트는 stdin으로(긴 본문의 argv 한계 회피).
function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    // shell:true — Windows에서 claude가 .cmd 셈이라 PATH/PATHEXT 해석이 필요.
    // Mac/Linux도 /bin/sh -c 로 동일하게 동작. 프롬프트는 stdin으로만 전달하므로
    // argv에 사용자 입력이 없어 셸 인젝션 위험 없음.
    const child = spawn(CLAUDE_BIN, CLAUDE_ARGS, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
    });
    let out = "";
    let err = "";
    const t = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("claude CLI 타임아웃"));
    }, JOB_TIMEOUT_MS);
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(t);
      if (code !== 0) reject(new Error(`claude exit ${code}: ${err.slice(0, 800)}`));
      else resolve(out);
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

// 응답에서 첫 { ~ 마지막 } 사이를 JSON으로 파싱.
function extractJson(raw) {
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("claude 응답에 JSON이 없음");
  return JSON.parse(raw.slice(s, e + 1));
}

const JSON_CONTRACT = `결과는 다른 텍스트 없이 JSON 객체 하나만 출력하세요:
{"title":"...","excerpt":"...","body_md":"...","tags":["..."],"reading_min":"6분"}`;

function draftPrompt(job) {
  return `당신은 한국어 기술 블로그의 글 작성자입니다. 아래 작성 규약을 반드시 따르세요.

[작성 규약 — POSTING.md]
${POSTING}

[작업]
다음 URL의 내용을 읽고, 위 규약대로 한국 독자용 포스팅 글을 작성하세요.
- YouTube 링크면 Bash로 yt-dlp를 사용해 자막/스크립트를 추출하세요.
- 일반 글이면 WebFetch로 본문을 가져오세요.
- 원문을 충실히 번역·정리하되 개인 논평은 넣지 않습니다.
- 강연·인터뷰·발표 영상이면 규약 "발표자 소개" 절에 따라, 글 앞부분(요약
  다음)에 발표자가 누구이고 어떤 이력·업적이 있는지 소개하는 문단을 넣으세요.
- 원문에 과정·순서·구조·수치 같은 부분이 있어 시각자료로 독자 이해가 더
  잘되는 곳이면, 규약 "2-2. 시각자료 카탈로그" 절에 따라 \`\`\`visual 코드
  블록(JSON)을 본문에 보통 1개(많아야 2개) 끼워 넣으세요. 본문이 이미 설명한
  사실을 구조화하는 용도로만 쓰고, 새 사실·추측은 만들지 마세요.
- 개념·은유를 그림으로 보여주면 더 와닿는 곳은 규약 "\`\`\`illustration" 절의
  스타일 가이드대로 \`\`\`illustration 블록에 SVG를 직접 그려도 됩니다(글당 1개).
- 원문에 그림·사진·도표가 있고 핵심 자료라면 \`![설명](원문 이미지 URL)\`
  마크다운 이미지로 본문에 적극 가져오세요. 필요하면 HTML/CSS도 직접 써도
  됩니다.
- 말투는 규약 "2. 말투 · 본문 골격" 절을 따라 — 신문 보도체가 아니라
  독자에게 풀어 주는 따뜻한 설명체로 쓰세요(종결은 -습니다체 유지).
- 참고 자료(원문 링크)와 저작권 표기를 규약대로 본문 끝에 포함하세요.

URL: ${job.source_url}
${job.instruction ? `요청 메모: ${job.instruction}` : ""}

${JSON_CONTRACT}`;
}

function revisePrompt(job, post) {
  return `당신은 한국어 기술 블로그의 편집자입니다. 아래 작성 규약을 반드시 따르세요.

[작성 규약 — POSTING.md]
${POSTING}

[현재 글]
제목: ${post.title}
요약: ${post.excerpt ?? ""}
본문:
${post.body_md ?? ""}

[작업]
다음 피드백을 그대로 반영해 글을 다시 다듬으세요. 규약을 유지하세요.
피드백: ${job.instruction}

${JSON_CONTRACT}`;
}

async function applyResult(slug, parsed) {
  const patch = {};
  if (typeof parsed.title === "string" && parsed.title.trim()) patch.title = parsed.title.trim();
  if (typeof parsed.excerpt === "string") patch.excerpt = parsed.excerpt;
  if (typeof parsed.body_md === "string") patch.body_md = parsed.body_md;
  if (Array.isArray(parsed.tags)) patch.tags = parsed.tags.map(String);
  if (typeof parsed.reading_min === "string" && parsed.reading_min.trim())
    patch.reading_min = parsed.reading_min.trim();
  if (Object.keys(patch).length === 0) throw new Error("결과에 적용할 필드가 없음");
  const { error } = await sb.from("posts").update(patch).eq("slug", slug);
  if (error) throw error;
}

async function processJob(job) {
  console.log(`▶ job#${job.id} ${job.type} (${job.post_slug ?? "-"})`);
  await sb
    .from("ai_jobs")
    .update({ status: "processing", started_at: nowIso() })
    .eq("id", job.id);

  try {
    let prompt;
    if (job.type === "draft_from_url") {
      if (!job.source_url) throw new Error("source_url 누락");
      prompt = draftPrompt(job);
    } else if (job.type === "revise") {
      const { data: post, error } = await sb
        .from("posts")
        .select("title,excerpt,body_md")
        .eq("slug", job.post_slug)
        .maybeSingle();
      if (error) throw error;
      if (!post) throw new Error("대상 글을 찾을 수 없음");
      prompt = revisePrompt(job, post);
    } else {
      throw new Error(`알 수 없는 type: ${job.type}`);
    }

    const raw = await callClaude(prompt);
    const parsed = extractJson(raw);

    // 본문의 ```visual 블록을 PNG로 굽고 마크다운 이미지로 치환
    if (typeof parsed.body_md === "string" && parsed.body_md.includes("```visual")) {
      const { bodyMd, rendered, failed } = await postProcessVisuals(parsed.body_md, {
        supabase: sb,
        baseUrl: VISUAL_BASE_URL,
        token: INTERNAL_VISUAL_TOKEN,
        log: (m) => console.log(m),
      });
      parsed.body_md = bodyMd;
      console.log(`  시각자료: 성공 ${rendered} / 실패 ${failed}`);
    }

    await applyResult(job.post_slug, parsed);

    await sb
      .from("ai_jobs")
      .update({
        status: "done",
        finished_at: nowIso(),
        result: short(`완료: ${parsed.title ?? job.post_slug}`),
      })
      .eq("id", job.id);
    console.log(`✓ job#${job.id} done`);
  } catch (e) {
    await sb
      .from("ai_jobs")
      .update({
        status: "error",
        finished_at: nowIso(),
        result: short(`에러: ${e?.message ?? String(e)}`),
      })
      .eq("id", job.id);
    console.error(`✗ job#${job.id} error:`, e?.message ?? e);
  }
}

// status='done' 30일 경과분 정리 (DB 용량 무한증가 방지).
async function prune() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await sb
    .from("ai_jobs")
    .delete()
    .eq("status", "done")
    .lt("finished_at", cutoff);
  if (error) console.error("prune 실패:", error.message);
}

async function nextPending() {
  const { data, error } = await sb
    .from("ai_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function main() {
  console.log(`ai-worker 시작 (${WATCH ? "watch" : "1회"}, poll ${POLL_MS}ms)`);
  console.log(`  시각자료 렌더 대상: ${VISUAL_BASE_URL}`);
  await prune();
  for (;;) {
    let job = null;
    try {
      job = await nextPending();
    } catch (e) {
      console.error("폴링 실패:", e?.message ?? e);
    }
    if (job) {
      await processJob(job);
      continue; // 다음 job 즉시 처리
    }
    if (!WATCH) break;
    await sleep(POLL_MS);
  }
  await closeBrowser();
  console.log("ai-worker 종료");
}

process.on("SIGINT", async () => {
  console.log("\n중단 — 정리 중...");
  await closeBrowser();
  process.exit(0);
});

main().catch(async (e) => {
  console.error("❌ fatal", e);
  await closeBrowser();
  process.exit(1);
});
