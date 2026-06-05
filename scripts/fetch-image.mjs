// 외부(공식 문서·원본) 이미지를 내려받아 post-images 버킷에 재호스팅한다.
// 핫링크 깨짐·핫링크 차단을 피하려고 자체 스토리지에 올리고 공개 URL을 출력한다.
// 본문 마크다운에는 이 출력 URL을 ![](…) 으로 박고, 참고 자료에 원출처를 적는다.
//
// 실행:
//   npm run fetch:image -- <원본이미지 URL> [<URL2> …]
// 출력: 재호스팅된 공개 URL (소스 → 결과)을 한 줄씩.
//
// 에디터 uploadImage(actions.ts)와 같은 규약: GIF·SVG 는 원본 유지,
// 그 외 래스터는 sharp 로 폭 1600 webp(품질 82) 압축. 경로는 날짜/uuid.ext.

import crypto from "node:crypto";
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

async function run() {
  const urls = process.argv.slice(2).filter(Boolean);
  if (!urls.length) {
    console.error("사용법: npm run fetch:image -- <원본 URL> [<URL2> …]");
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
