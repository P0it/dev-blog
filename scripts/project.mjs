// 실험실 프로젝트 원고를 Supabase projects 에 적재한다.
//
// 다른 레포의 Claude 세션이 /portfolio 스킬로 만든 portfolio/ 폴더를
// 이 레포 projects/<slug>/ 로 통째로 옮긴 뒤 push 한다.
//
// 로고는 이미지(logo_file 또는 logo_url)만 쓴다. 이미지가 없으면 공개 화면이
// 프로젝트 이름 첫 글자를 카드에 넣는다. 이모지는 쓰지 않는다.
//
// 사용법:
//   npm run project -- push projects/<slug>/portfolio.md
//   npm run project -- pull <slug> [파일]
//
// 원고와 미디어(로고·화면·시연)는 projects/<slug>/ 한 폴더에 같이 둔다.
// `**파일**` 상대경로가 원고 기준이라, 다른 레포에서 만든 portfolio/ 폴더를
// 그대로 projects/<slug>/ 로 옮기면 경로를 고칠 필요가 없다.
//
// 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (.env.local)

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, rmSync } from "node:fs";
import { dirname, resolve, extname, basename, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const HOSTS = ["vercel", "cloudflare", "local", "none"];
const BUCKET = "project-media";

// 올릴 수 있는 형식. 버킷 allowedMimeTypes 와 맞춰 둔다.
const MIME = {
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

// 화면 녹화는 보통 폰에서 나온다. 아이폰은 .mov 로 저장하는데, QuickTime 컨테이너는
// 브라우저마다 재생이 갈린다 (안은 대개 H.264 라 내용물은 mp4 와 같다).
// ffmpeg 가 있으면 다시 인코딩하지 않고 컨테이너만 바꿔 끼운다 — 무손실이고 1 초쯤 걸린다.
// ffmpeg 가 없으면 .mov 그대로 올리고 경고만 남긴다. 적재를 막지는 않는다.
function rewrapMov(abs) {
  if (extname(abs).toLowerCase() !== ".mov") return { path: abs, tmp: null };

  const probe = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (probe.error) {
    console.warn(`  ! ${basename(abs)} 는 .mov 다. ffmpeg 가 없어 그대로 올린다.`);
    console.warn(`    브라우저에 따라 재생이 안 될 수 있다: ffmpeg -i in.mov -c copy out.mp4`);
    return { path: abs, tmp: null };
  }

  const out = join(tmpdir(), `lab-demo-${basename(abs, ".mov")}-${process.pid}.mp4`);
  const r = spawnSync("ffmpeg", ["-y", "-i", abs, "-c", "copy", "-movflags", "+faststart", out], {
    stdio: "ignore",
  });
  if (r.status !== 0 || !existsSync(out)) {
    console.warn(`  ! ${basename(abs)} 컨테이너 변환 실패 — .mov 그대로 올린다`);
    return { path: abs, tmp: null };
  }
  console.log(`  ↻ ${basename(abs)} → mp4 로 다시 담음 (무손실)`);
  return { path: out, tmp: out };
}

// 폰 녹화는 쉽게 커진다. 버킷에 올라가긴 하지만 상세 페이지가 무거워지므로 알린다.
function warnIfHeavy(abs) {
  const mb = statSync(abs).size / 1024 / 1024;
  if (mb <= 15) return;
  console.warn(`  ! ${basename(abs)} 가 ${mb.toFixed(1)}MB 다. 720p 로 줄이는 걸 권한다:`);
  console.warn(`    ffmpeg -i in.mp4 -vf scale=-2:720 -c:v libx264 -crf 26 -an out.mp4`);
}

// 로컬 파일 하나를 project-media 에 올리고 공개 URL 을 돌려준다.
async function uploadFile(abs, destPath) {
  const ext = extname(abs).toLowerCase();
  const mime = MIME[ext];
  if (!mime) {
    throw new Error(`지원하지 않는 형식: ${ext} (${Object.keys(MIME).join(" · ")} 만 된다)`);
  }
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(destPath, readFileSync(abs), { contentType: mime, upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(destPath);
  return data.publicUrl;
}

// 본문의 `**파일** ./demo.mp4` 줄을 찾아 올리고 `**영상** <url>` 로 바꾼다.
// 다른 레포 세션은 파일을 원고 옆에 두고 상대경로만 적으면 된다.
async function uploadBodyMedia(mdFile, body, slug) {
  const lines = body.split("\n");
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s*(?:\*\*파일\*\*|파일\s*[:：])\s*(\S+)\s*$/.exec(lines[i]);
    if (!m) continue;
    const rel = m[1];
    if (/^https?:\/\//.test(rel)) continue;
    const abs = resolve(dirname(mdFile), rel);
    if (!existsSync(abs)) throw new Error(`시연 파일을 찾을 수 없다: ${abs}`);

    // 아이폰 녹화(.mov)는 가능하면 mp4 컨테이너로 바꿔 끼운 뒤 올린다.
    const { path: src, tmp } = rewrapMov(abs);
    try {
      warnIfHeavy(src);
      const ext = extname(src).toLowerCase();
      const url = await uploadFile(src, `${slug}/demo-${++n}${ext}`);
      const label = /\.(mp4|webm|mov)$/i.test(ext) ? "영상" : "이미지";
      lines[i] = `**${label}** ${url}`;
      console.log(`  ↑ 시연 업로드: ${basename(abs)} → ${slug}/demo-${n}${ext}`);
    } finally {
      if (tmp) rmSync(tmp, { force: true });
    }
  }
  return lines.join("\n");
}

// 원고 옆에 둔 로고 파일을 project-media 에 올리고 공개 URL 을 돌려준다.
// 경로는 원고 파일 기준 상대경로다 (예: logo_file: ./logo.png).
async function uploadLogo(mdFile, rel, slug) {
  const abs = resolve(dirname(mdFile), rel);
  if (!existsSync(abs)) throw new Error(`logo_file 을 찾을 수 없다: ${abs}`);
  const ext = extname(abs).toLowerCase();
  const url = await uploadFile(abs, `${slug}/logo${ext}`);
  console.log(`  ↑ 로고 업로드: ${basename(abs)} → ${slug}/logo${ext}`);
  // 같은 경로에 덮어쓰므로 CDN 캐시를 우회할 쿼리를 붙인다.
  return `${url}?v=${Date.now()}`;
}

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
    `logo_bg: "${row.logo_bg ?? ""}"`,
    `logo_url: ${row.logo_url ?? ""}`,
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

  for (const k of ["slug", "name", "tagline", "year", "logo_bg"]) {
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
    .select("sort_order,visibility")
    .eq("slug", meta.slug)
    .maybeSingle();

  // 어드민 에디터가 source of truth 다. 이미 발행된 프로젝트를 파일로 덮으면
  // 어드민에서 고친 내용이 롤백된다. draft.mjs 와 같은 규칙으로 --force 를 요구한다.
  if (existing?.visibility === "published" && !force) {
    throw new Error(
      `${meta.slug} 는 이미 발행된 프로젝트다. 어드민에서 고친 내용을 덮어쓸 수 있다.\n` +
        `  그래도 덮으려면: npm run project -- push ${file} --force`,
    );
  }
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

  // 로고 이미지가 있으면 이모지보다 우선한다. 파일 경로가 있으면 올리고,
  // 이미 공개 URL 이면 그대로 쓴다.
  let logoUrl = meta.logo_url || null;
  if (meta.logo_file) logoUrl = await uploadLogo(file, meta.logo_file, meta.slug);

  // 시연 영상·이미지는 본문 안에서 로컬 경로로 들어온다. 올리고 URL 로 바꾼다.
  const bodyWithMedia = await uploadBodyMedia(file, body, meta.slug);

  const row = {
    slug: meta.slug,
    name: meta.name,
    year: String(meta.year),
    tagline: meta.tagline,
    logo_bg: meta.logo_bg,
    logo_url: logoUrl,
    status: meta.status ?? "",
    stack: Array.isArray(meta.stack) ? meta.stack : [],
    url: meta.url || null,
    host: meta.host || "none",
    body_md: bodyWithMedia,
    sort_order: sortOrder,
    // 신규는 draft 로 들어간다 — 어드민에서 확인하고 발행한다.
    // 기존 행은 키를 빼서 지금 노출 상태를 그대로 둔다.
    ...(existing ? {} : { visibility: "draft" }),
  };

  const { error } = await sb.from("projects").upsert(row, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✓ ${meta.slug} 적재 완료 (${bodyWithMedia.length}자)`);
  if (existing) console.log(`  확인: /lab/${meta.slug}`);
  else console.log(`  draft 로 들어갔다. 어드민에서 확인 후 발행: /admin/projects`);
}

async function pull(slug, file) {
  if (!slug) throw new Error("slug 가 없다");
  const { data, error } = await sb.from("projects").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`없는 slug: ${slug}`);
  // 미디어가 원고 옆에 붙어 다니므로 슬러그 폴더 하나에 모은다. push 와 같은 자리다.
  const out = file ?? `projects/${slug}/portfolio.md`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, toFrontmatter(data), "utf8");
  console.log(`✓ ${out} 로 내려받음`);
}

// 원고를 거치지 않고 파일 하나만 올리고 싶을 때. URL 을 찍어 주면 본문에 붙여 쓴다.
async function media(slug, path) {
  if (!slug || !path) throw new Error("사용법: media <slug> <file>");
  if (!existsSync(path)) throw new Error(`파일이 없다: ${path}`);
  const { path: src, tmp } = rewrapMov(resolve(path));
  try {
    warnIfHeavy(src);
    const ext = extname(src).toLowerCase();
    const url = await uploadFile(src, `${slug}/${basename(src, ext)}-${Date.now()}${ext}`);
    console.log(url);
  } finally {
    if (tmp) rmSync(tmp, { force: true });
  }
}

const argv = process.argv.slice(2);
const force = argv.includes("--force");
const [cmd, ...rest] = argv.filter((a) => a !== "--force");
try {
  if (cmd === "push") await push(rest[0]);
  else if (cmd === "pull") await pull(rest[0], rest[1]);
  else if (cmd === "media") await media(rest[0], rest[1]);
  else {
    console.error("사용법: npm run project -- push <file.md> | pull <slug> [file] | media <slug> <file>");
    process.exit(1);
  }
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}
