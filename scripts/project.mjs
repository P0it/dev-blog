// 실험실 프로젝트 원고를 Supabase projects 에 적재한다.
//
// 다른 레포의 Claude 세션이 /portfolio 스킬로 만든 portfolio.md 를
// 이 레포 projects/<slug>.md 로 옮긴 뒤 push 한다.
//
// 사용법:
//   npm run project -- push projects/<slug>.md
//   npm run project -- pull <slug> [projects/<slug>.md]
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

const HOSTS = ["vercel", "cloudflare", "local", "none"];

// 아주 좁은 YAML 만 읽는다 — 문자열, [a, b] 배열, 주석. draft.mjs 와 같은 수준.
function parseFrontmatter(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (!m) throw new Error("프런트매터가 없다 (--- 로 시작해야 한다)");
  const meta = {};
  for (const line of m[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf(":");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    v = v.replace(/\s+#.*$/, "").trim(); // 줄 끝 주석
    if (/^\[.*\]$/.test(v)) {
      meta[k] = v
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      meta[k] = v.replace(/^["']|["']$/g, "");
    }
  }
  return { meta, body: raw.slice(m[0].length).trim() };
}

function toFrontmatter(row) {
  const lines = [
    `slug: ${row.slug}`,
    `name: ${row.name}`,
    `tagline: ${row.tagline ?? ""}`,
    `year: "${row.year}"`,
    `logo_emoji: ${row.logo_emoji ?? ""}`,
    `logo_bg: "${row.logo_bg ?? ""}"`,
    `stack: [${(row.stack ?? []).join(", ")}]`,
    `url: ${row.url ?? ""}`,
    `host: ${row.host ?? "none"}`,
    `status: ${row.status ?? ""}`,
    `capture: true`,
  ];
  return `---\n${lines.join("\n")}\n---\n\n${row.body_md ?? ""}\n`;
}

async function push(file) {
  if (!file) throw new Error("파일 경로가 없다");
  const { meta, body } = parseFrontmatter(readFileSync(file, "utf8"));

  for (const k of ["slug", "name", "tagline", "year", "logo_emoji", "logo_bg"]) {
    if (!meta[k]) throw new Error(`필수 필드 누락: ${k}`);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(meta.slug)) {
    throw new Error(`slug 는 ASCII 케밥이어야 한다: ${meta.slug}`);
  }
  if (meta.url && !/^https?:\/\//.test(meta.url)) {
    throw new Error(`url 은 스킴을 포함한 절대 URL 이어야 한다: ${meta.url}`);
  }
  if (meta.host && !HOSTS.includes(meta.host)) {
    throw new Error(`host 는 ${HOSTS.join(" | ")} 중 하나여야 한다: ${meta.host}`);
  }
  if (meta.tagline.length > 40) {
    console.warn(`⚠ tagline 이 ${meta.tagline.length}자다. 카드에서 두 줄로 잘린다.`);
  }

  // sort_order 는 기존 값을 지킨다. 새 프로젝트면 맨 뒤로 보낸다.
  const { data: existing } = await sb
    .from("projects")
    .select("sort_order")
    .eq("slug", meta.slug)
    .maybeSingle();
  let sortOrder = existing?.sort_order;
  if (sortOrder === undefined || sortOrder === null) {
    const { data: last } = await sb
      .from("projects")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (last?.sort_order ?? 0) + 1;
  }

  const row = {
    slug: meta.slug,
    name: meta.name,
    year: String(meta.year),
    tagline: meta.tagline,
    logo_emoji: meta.logo_emoji,
    logo_bg: meta.logo_bg,
    status: meta.status ?? "",
    stack: Array.isArray(meta.stack) ? meta.stack : [],
    url: meta.url || null,
    host: meta.host || "none",
    body_md: body,
    sort_order: sortOrder,
  };

  const { error } = await sb.from("projects").upsert(row, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✓ ${meta.slug} 적재 완료 (${body.length}자)`);
  console.log(`  확인: /lab/${meta.slug}`);
}

async function pull(slug, file) {
  if (!slug) throw new Error("slug 가 없다");
  const { data, error } = await sb.from("projects").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`없는 slug: ${slug}`);
  const out = file ?? `projects/${slug}.md`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, toFrontmatter(data), "utf8");
  console.log(`✓ ${out} 로 내려받음`);
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === "push") await push(rest[0]);
  else if (cmd === "pull") await pull(rest[0], rest[1]);
  else {
    console.error("사용법: npm run project -- push <file.md> | pull <slug> [file]");
    process.exit(1);
  }
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}
