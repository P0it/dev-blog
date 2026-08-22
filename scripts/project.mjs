// 포트폴리오 규약 .md → Supabase projects 적재.
//
// 다른 레포에서 /portfolio 로 뽑은 portfolio.md 를 이 레포 projects/<slug>.md 로
// 가져와 실험실(/lab)에 올린다. draft.mjs 와 같은 구조이고 대상 테이블만 projects 다.
//
// 사용법:
//   npm run project -- push <file.md>      프런트매터+본문을 projects 에 upsert
//   npm run project -- pull <slug> [file]  기존 프로젝트를 .md 로 내려받기
//
// 프런트매터 (docs/superpowers/specs/2026-08-22-lab-portfolio-design.md 1절):
//   slug, name, tagline, year, logo_emoji, logo_bg, stack, url, host, status, capture
//
// 주의 — 마이그레이션 0013 전이라 tagline/logo_emoji/logo_bg/status 를 담을 컬럼이
// 아직 없다. tagline 은 기존 description 컬럼으로 넣고, 나머지는 경고만 찍고 버린다.
// 0013 적용 후 이 매핑을 걷어낸다. capture 는 DB 컬럼이 아니라 항상 무시한다.
//
// 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (.env.local)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// 0013 적용 전까지 담을 곳이 없는 필드. 조용히 버리면 나중에 왜 안 뜨는지 헤맨다.
const PENDING_COLUMNS = ["logo_emoji", "logo_bg", "logo_url", "status", "hero_media", "hero_poster", "shots"];

function unquote(s) {
  const t = String(s ?? "").trim();
  if (t.length > 1 && ((t[0] === '"' && t.at(-1) === '"') || (t[0] === "'" && t.at(-1) === "'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseList(raw) {
  if (!raw) return [];
  let s = String(raw).trim();
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  return s.split(",").map((x) => unquote(x)).filter(Boolean);
}

// 맨 위 ---...--- 블록만 프런트매터로 본다. 본문의 --- 나 ``` 펜스는 건드리지 않는다.
function parseFrontmatter(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") return { data: {}, body: text.replace(/\r\n/g, "\n") };
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") { endIdx = i; break; }
  }
  if (endIdx < 0) throw new Error("프런트매터를 닫는 --- 줄이 없습니다");
  const data = {};
  for (const line of lines.slice(1, endIdx)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf(":");
    if (idx < 0) continue;
    // 값 뒤 주석(# ...)은 버린다. 규약 예시가 주석을 달고 있다.
    data[t.slice(0, idx).trim()] = t.slice(idx + 1).replace(/\s+#.*$/, "").trim();
  }
  return { data, body: lines.slice(endIdx + 1).join("\n").replace(/^\n+/, "") };
}

async function push(file) {
  if (!file) throw new Error("사용법: npm run project -- push <file.md>");
  const { data: fm, body } = parseFrontmatter(readFileSync(file, "utf8"));

  const slug = unquote(fm.slug);
  if (!slug) throw new Error("프런트매터에 slug 가 필요합니다");
  // 비ASCII 슬러그 금지 — 포스트와 같은 정적 prerender 404 이슈를 피한다.
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`slug '${slug}' 는 소문자/숫자/하이픈만 허용합니다`);

  const name = unquote(fm.name);
  if (!name) throw new Error("프런트매터에 name 이 필요합니다");
  if (!body.trim()) throw new Error("본문이 비어 있습니다");

  const projectUrl = unquote(fm.url);
  if (projectUrl && !/^https?:\/\//.test(projectUrl)) {
    throw new Error(`url 은 스킴을 포함한 절대 URL 이어야 합니다: '${projectUrl}'`);
  }

  const host = unquote(fm.host) || "none";
  if (!["vercel", "cloudflare", "local", "none"].includes(host)) {
    throw new Error(`host 는 vercel | cloudflare | local | none 중 하나여야 합니다: '${host}'`);
  }

  const dropped = PENDING_COLUMNS.filter((c) => fm[c] !== undefined);
  if (dropped.length) {
    console.warn(`⚠︎ 담을 컬럼이 없어 무시: ${dropped.join(", ")} (마이그레이션 0013 미적용)`);
  }

  const row = {
    slug,
    name,
    year: unquote(fm.year),
    description: unquote(fm.tagline), // 0013 전 임시 매핑
    stack: parseList(fm.stack),
    url: projectUrl,
    host,
    body_md: body,
  };

  const { data: existing } = await sb.from("projects").select("slug").eq("slug", slug).maybeSingle();
  const { error } = await sb.from("projects").upsert(row, { onConflict: "slug" });
  if (error) throw error;
  console.log(`${existing ? "갱신" : "신규"}: ${slug} — ${name} (본문 ${body.length}자)`);
  console.log(`확인: /lab/${slug}`);
}

async function pull(slug, file) {
  if (!slug) throw new Error("사용법: npm run project -- pull <slug> [file.md]");
  const { data, error } = await sb.from("projects").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`프로젝트를 찾을 수 없습니다: ${slug}`);

  const out = file || `projects/${slug}.md`;
  const fmLines = [
    "---",
    `slug: ${data.slug}`,
    `name: ${data.name}`,
    `tagline: ${data.description ?? ""}`,
    `year: "${data.year ?? ""}"`,
    `stack: [${(data.stack ?? []).join(", ")}]`,
    `url: ${data.url ?? ""}`,
    `host: ${data.host ?? "none"}`,
    "---",
    "",
  ];
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, fmLines.join("\n") + (data.body_md ?? ""), "utf8");
  console.log(`내려받음: ${out}`);
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === "push") await push(rest[0]);
  else if (cmd === "pull") await pull(rest[0], rest[1]);
  else {
    console.error("사용법:\n  npm run project -- push <file.md>\n  npm run project -- pull <slug> [file.md]");
    process.exit(1);
  }
} catch (e) {
  console.error(`실패: ${e.message}`);
  process.exit(1);
}
