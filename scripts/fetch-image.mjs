// 외부(공식 문서·원본) 이미지를 내려받아 post-images 버킷에 재호스팅한다.
// 핫링크 깨짐·핫링크 차단을 피하려고 자체 스토리지에 올리고 공개 URL을 출력한다.
// 본문 마크다운에는 이 출력 URL을 ![](…) 으로 박고, 참고 자료에 원출처를 적는다.
//
// 실행:
//   npm run fetch:image -- <원본이미지 URL> [<URL2> …]
//   npm run fetch:image -- --rewrite <file.md>
// 출력: 재호스팅된 공개 URL (소스 → 결과)을 한 줄씩.
//
// --rewrite 는 클라우드 루틴용이다. 샌드박스에는 Supabase 시크릿이 없고 egress 프록시가
// 많은 도메인을 막아 재호스팅을 못 한다. 그래서 루틴은 원본 이미지 URL 을
// `![설명](REHOST:https://…)` 마커로만 박아 두고, 시크릿을 쥔 GitHub Actions 가
// 이 모드로 마커를 실제 공개 URL 로 바꿔친다. 내려받기에 실패한 이미지는
// 그 줄을 통째로 지운다 — 깨진 이미지가 글에 남는 것보다 없는 편이 낫다.
//
// 에디터 uploadImage(actions.ts)와 같은 규약: GIF·SVG 는 원본 유지,
// 그 외 래스터는 sharp 로 폭 1600 webp(품질 82) 압축. 경로는 날짜/uuid.ext.

import crypto from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "post-images";
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

async function rehost(srcUrl) {
  const res = await fetch(srcUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (dev-blog rehost)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`fetch ${res.status} ${res.statusText} — ${srcUrl}`);
  const type = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (!type.startsWith("image/")) throw new Error(`이미지 아님(${type || "unknown"}) — ${srcUrl}`);

  const input = Buffer.from(await res.arrayBuffer());
  if (input.byteLength > 8 * 1024 * 1024) throw new Error(`8MB 초과 — ${srcUrl}`);

  const passthrough = type === "image/gif" || type === "image/svg+xml";
  let body, contentType, ext;
  if (passthrough) {
    body = input;
    contentType = type;
    ext = type === "image/gif" ? "gif" : "svg";
  } else {
    body = await sharp(input)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    contentType = "image/webp";
    ext = "webp";
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID().slice(0, 8);
  const path = `${stamp}/${id}.${ext}`;

  const { error } = await sb.storage.from(BUCKET).upload(path, body, { contentType, upsert: false });
  if (error) throw error;

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// `![설명](REHOST:<원본 URL>)` 마커를 실제 공개 URL 로 치환한다.
async function rewriteMarkers(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  // `![설명](REHOST:<URL>)` 본문 마커와 프런트매터 `cover_image: REHOST:<URL>` 둘 다 잡는다.
  const marker = /REHOST:([^\s)]+)/g;
  const resolved = new Map();
  let ok = 0, dropped = 0;

  const out = [];
  for (const line of lines) {
    const srcs = [...line.matchAll(marker)].map((m) => m[1]);
    if (!srcs.length) {
      out.push(line);
      continue;
    }
    let failed = false;
    for (const src of srcs) {
      if (resolved.has(src)) continue;
      try {
        const url = await rehost(src);
        resolved.set(src, url);
        console.log(`✓ ${src}
  → ${url}`);
        ok++;
      } catch (e) {
        console.error(`✗ ${src}
  ${e.message}`);
        failed = true;
      }
    }
    if (failed || srcs.some((s) => !resolved.has(s))) {
      console.error(`  ↳ 이미지 줄 삭제: ${line.slice(0, 80)}`);
      dropped++;
      continue;
    }
    out.push(line.replace(marker, (_, src) => resolved.get(src)));
  }

  writeFileSync(file, out.join("\n"), "utf8");
  console.log(`재호스팅 ${ok}건, 삭제 ${dropped}건 — ${file}`);
}

async function run() {
  const argv = process.argv.slice(2).filter(Boolean);
  const ri = argv.indexOf("--rewrite");
  if (ri !== -1) {
    const file = argv[ri + 1];
    if (!file) {
      console.error("사용법: npm run fetch:image -- --rewrite <file.md>");
      process.exit(1);
    }
    await rewriteMarkers(file);
    return;
  }
  const urls = argv;
  if (!urls.length) {
    console.error("사용법: npm run fetch:image -- <원본 URL> [<URL2> …]\n      npm run fetch:image -- --rewrite <file.md>");
    process.exit(1);
  }
  for (const src of urls) {
    try {
      const url = await rehost(src);
      console.log(`✓ ${src}\n  → ${url}`);
    } catch (e) {
      console.error(`✗ ${src}\n  ${e.message}`);
      process.exitCode = 1;
    }
  }
}

run().catch((e) => { console.error("❌", e); process.exit(1); });
