// Claude Code 직접 경로 — 워커 큐 없이 글 초안을 바로 Supabase posts 에 적재.
//
// 어드민 UI 경로(어드민 → ai_jobs 큐 → 로컬 워커 → claude CLI)의 대안이다.
// 사용자가 Claude Code 세션에 URL 을 주고 초안/개선을 요청하면, 그 세션이
// 곧 작성자다 — WebFetch/yt-dlp 로 원문을 읽고 POSTING.md 규약대로 글을 써서
// 이 스크립트로 posts 에 바로 넣는다. ai_jobs·워커·CLI 스폰을 거치지 않는다.
//
// 사용법:
//   npm run draft -- push <file.md>       프런트매터+본문 .md 를 posts 에 upsert
//   npm run draft -- pull <slug> [file]   기존 글을 .md 로 내려받기(개선용)
//   옵션: --force   발행된 글의 본문을 갱신할 때 필수(실수 방지)
//
// .md 파일 형식 — 맨 위 YAML 풍 프런트매터 + 그 아래 본문(body_md):
//   ---
//   title: (필수) 한국어 독자용 제목
//   slug: (선택) 없으면 title 을 slugify. 개선 시에는 대상 글의 slug.
//   tags: [A, B]            (선택)
//   category: claude        (선택) categories.slug — 없는 값이면 무시
//   cover_image: https://…  (선택)
//   thumb_kind: f           (선택) 없으면 slug 해시로 자동
//   reading_min: 8분        (선택) 없으면 본문 분량에서 산출
//   source_url: https://…   (선택) 기록용 — posts 컬럼 아님, 본문 참고자료에 직접 적는다
//   source_date: 2026-05-20 (선택) 원문(인용/번역 대상) 작성·업로드 일자. 발행일을 이보다
//                             앞으로 잡으려 하면 에디터에서 경고가 뜬다(YYYY-MM-DD)
//   ---
//   > 요약 인용구…
//   ## 헤드라인…
//
// 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (.env.local)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// --- 파생 헬퍼 (src/lib 의 에디터 로직과 동일하게 유지) ------------------

// 제목 → slug. src/app/admin/editor/actions.ts 의 slugify 와 동일.
function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// slug → 카드 썸네일 패턴(a~l). src/lib/thumb.ts 와 동일.
const THUMB_KINDS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
function thumbKindFromSlug(slug) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return THUMB_KINDS[h % THUMB_KINDS.length];
}

// 인라인 마크다운 제거 — 요약을 카드/메타용 평문으로. src/lib/markdown.ts 와 동일.
function stripInline(s) {
  return s
    .replace(/`[^`\n]*`/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

// 본문 첫 `>` 블록쿼트 → excerpt. src/lib/markdown.ts 의 deriveExcerpt 와 동일.
function deriveExcerpt(md) {
  if (!md) return "";
  const collected = [];
  let started = false;
  let inFence = false;
  for (const raw of md.split("\n")) {
    if (/^```/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^>/.test(raw)) {
      started = true;
      collected.push(raw.replace(/^>\s?/, "").trim());
    } else if (started) {
      break;
    }
  }
  return stripInline(collected.filter(Boolean).join(" ")).replace(/\s+/g, " ").trim();
}

// 본문 분량 → "N분". src/lib/markdown.ts 의 deriveReadingMin 와 동일.
function deriveReadingMin(md) {
  if (!md) return "";
  const text = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]*`/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-]/g, "")
    .replace(/\s+/g, "");
  const chars = text.length;
  if (chars === 0) return "";
  return `${Math.max(1, Math.round(chars / 450))}분`;
}

// --- 프런트매터 파싱/직렬화 -------------------------------------------

function unquote(s) {
  if (s == null) return s;
  const t = String(s).trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))
    return t.slice(1, -1);
  return t;
}

function parseTags(raw) {
  if (!raw) return [];
  let s = String(raw).trim();
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  return s
    .split(",")
    .map((x) => unquote(x))
    .filter(Boolean);
}

// 맨 위 ---...--- 블록만 프런트매터로 본다. 본문 안의 --- 나 ``` 펜스는 건드리지 않는다.
function parseFrontmatter(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") {
    return { data: {}, body: text.replace(/\r\n/g, "\n") };
  }
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      endIdx = i;
      break;
    }
  }
  if (endIdx < 0) throw new Error("프런트매터를 닫는 --- 줄이 없습니다");

  const data = {};
  for (const line of lines.slice(1, endIdx)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf(":");
    if (idx < 0) continue;
    data[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  const body = lines.slice(endIdx + 1).join("\n").replace(/^\n+/, "");
  return { data, body };
}

function serializeFrontmatter(post) {
  return [
    "---",
    `title: ${post.title}`,
    `slug: ${post.slug}`,
    `status: ${post.status}`,
    `tags: [${(post.tags ?? []).join(", ")}]`,
    `category: ${post.category_slug ?? ""}`,
    `cover_image: ${post.cover_image ?? ""}`,
    `thumb_kind: ${post.thumb_kind ?? ""}`,
    `reading_min: ${post.reading_min ?? ""}`,
    `source_date: ${post.source_date ?? ""}`,
    "---",
    "",
  ].join("\n");
}

// --- push: .md → posts upsert ----------------------------------------

async function push(file, force) {
  const { data: fm, body } = parseFrontmatter(readFileSync(file, "utf8"));
  const title = unquote(fm.title);
  if (!title) throw new Error("프런트매터에 title 이 필요합니다");
  if (!body.trim()) throw new Error("본문(body_md)이 비어 있습니다");

  const slug = unquote(fm.slug) || slugify(title);
  if (!slug) throw new Error("slug 를 만들 수 없습니다 — 프런트매터에 slug 를 직접 지정하세요");

  const { data: existing, error: exErr } = await sb
    .from("posts")
    .select("slug,status")
    .eq("slug", slug)
    .maybeSingle();
  if (exErr) throw exErr;

  if (existing && existing.status === "published" && !force) {
    throw new Error(
      `'${slug}' 는 이미 발행된 글입니다. 본문을 덮어쓰려면 --force 를 붙이세요.`,
    );
  }

  // category 검증 — 없는 slug 면 전체 실패 대신 경고 후 무시(FK 위반 방지).
  let categorySlug = unquote(fm.category) || null;
  if (categorySlug) {
    const { data: cat } = await sb
      .from("categories")
      .select("slug")
      .eq("slug", categorySlug)
      .maybeSingle();
    if (!cat) {
      console.warn(`⚠ category '${categorySlug}' 가 categories 에 없어 무시합니다.`);
      categorySlug = null;
    }
  }

  // 콘텐츠 필드만 — status/published_at/is_featured/series 는 건드리지 않아
  // 기존 글의 발행 상태·추천·시리즈 설정이 보존된다(에디터 update 와 동일 원칙).
  const content = {
    title,
    excerpt: deriveExcerpt(body) || null,
    body_md: body,
    tags: parseTags(fm.tags),
    category_slug: categorySlug,
    cover_image: unquote(fm.cover_image) || null,
    thumb_kind: unquote(fm.thumb_kind) || thumbKindFromSlug(slug),
    reading_min: unquote(fm.reading_min) || deriveReadingMin(body) || null,
    source_date: unquote(fm.source_date) || null,
  };

  if (existing) {
    const { error } = await sb.from("posts").update(content).eq("slug", slug);
    if (error) throw error;
    console.log(`✓ 기존 글 갱신 — ${slug} (status 유지: ${existing.status})`);
    if (existing.status === "published")
      console.log("  발행글 — 공개 페이지 캐시는 즉시 갱신 안 됨(어드민 에디터 저장 또는 재배포 필요).");
  } else {
    const { error } = await sb
      .from("posts")
      .insert({ ...content, slug, status: "draft", is_featured: false });
    if (error) throw error;
    console.log(`✓ 신규 초안 생성 — ${slug}`);
  }
  console.log(`  편집/검토: /admin/editor?slug=${slug}`);
}

// --- pull: posts → .md (개선용으로 내려받기) --------------------------

async function pull(slug, outFile) {
  const { data: post, error } = await sb
    .from("posts")
    .select("slug,title,body_md,tags,category_slug,cover_image,thumb_kind,reading_min,source_date,status")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!post) throw new Error(`'${slug}' 글을 찾을 수 없습니다`);

  const out = outFile || join("drafts", `${slug}.md`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, serializeFrontmatter(post) + (post.body_md ?? ""), "utf8");

  console.log(`✓ ${slug} → ${out}`);
  console.log(
    `  파일을 고친 뒤: npm run draft -- push ${out}` +
      (post.status === "published" ? " --force" : ""),
  );
}

// --- 엔트리 ----------------------------------------------------------

function usage() {
  console.log(`사용법:
  npm run draft -- push <file.md>      .md(프런트매터+본문)를 posts 에 upsert
  npm run draft -- pull <slug> [file]  기존 글을 .md 로 내려받기(개선용)
  옵션: --force   발행된 글의 본문을 갱신할 때 필수`);
}

async function main() {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const args = argv.filter((a) => a !== "--force");
  const [cmd, a1, a2] = args;

  if (cmd === "push" && a1) await push(a1, force);
  else if (cmd === "pull" && a1) await pull(a1, a2);
  else {
    usage();
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("실패:", e?.message ?? e);
  process.exit(1);
});
