// 영상 글 캡처 — 소제목별 대표 장면을 후보로 뽑고, 고른 컷을 Supabase Storage 에 올린다.
//
// /draft 직접 경로에서만 쓴다(워커·CLI 경로 아님). 선별의 "눈"은 이 스크립트가
// 아니라 Claude Code 세션이다 — 세션이 candidates 가 뽑은 후보 이미지를 Read 로
// 직접 보고 유형(발표·인터뷰·데모)에 맞는 컷을 고르거나, 쓸 만한 게 없으면 건너뛴다.
//
// 사용법:
//   npm run capture -- candidates <video_url> <manifest.json> [옵션]
//       manifest.json = [{ "heading": "소제목", "t": "3:21" }, ...]
//       각 시점 주변 구간만 yt-dlp 로 받아 ffmpeg 로 후보 프레임을 뽑는다.
//       옵션: --window <초, 기본 8>   시점 앞뒤로 몇 초까지 후보를 볼지
//             --step <초, 기본 2>     후보 간격
//             --out <dir, 기본 drafts/_frames/<영상id>>
//       stdout 에 섹션별 후보 파일 목록(JSON)을 찍는다 — 세션이 이를 읽고 Read 한다.
//
//   npm run capture -- upload <image_file>
//       고른 컷 1장을 sharp 로 WebP 변환해 post-images 버킷에 올리고 public URL 을 찍는다.
//       (어드민 에디터 uploadImage 와 같은 버킷·경로·변환 규약)
//
// 전제: yt-dlp, ffmpeg 설치. 환경변수 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY.

import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// --- 공통 헬퍼 -------------------------------------------------------------

// "3:21" · "1:02:03" · "183" → 초. 소수도 허용.
function toSeconds(t) {
  const s = String(t).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  const parts = s.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) throw new Error(`시각 형식 오류: '${t}'`);
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

// 초 → "0h00m00s" 풍 파일명용 라벨(콜론 없이).
function stampLabel(sec) {
  const s = Math.max(0, Math.round(sec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}h${pad(mm)}m${pad(ss)}s` : `${mm}m${pad(ss)}s`;
}

function run(cmd, args) {
  return execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
}

// --- candidates: 시점별 후보 프레임 추출 -----------------------------------

function candidates(videoUrl, manifestPath, opts) {
  if (!videoUrl || !manifestPath) throw new Error("사용법: candidates <video_url> <manifest.json>");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(manifest) || manifest.length === 0)
    throw new Error("manifest 는 [{heading, t}, ...] 배열이어야 합니다");

  const window = opts.window ?? 8;
  const step = opts.step ?? 2;

  // 영상 id 로 출력 폴더를 잡아 재실행 시 섞이지 않게 한다.
  let videoId = "video";
  try {
    videoId = run("yt-dlp", ["--get-id", videoUrl]).trim() || videoId;
  } catch {
    /* id 못 구해도 진행 — 기본 폴더명 사용 */
  }
  const outDir = opts.out ?? join("drafts", "_frames", videoId);
  mkdirSync(outDir, { recursive: true });

  // 저해상도 전체를 yt-dlp 네이티브 다운로더로 한 번만 받아 둔다.
  //   구간별 `--download-sections` 는 다운로드를 ffmpeg 에 위임하는데,
  //   YouTube 가 ffmpeg 의 직접 요청을 심하게 throttle 하는 영상이 있어(16초 클립이
  //   150초로도 안 끝남) 캡처가 멈춘 것처럼 보인다. 네이티브 다운로더는 n-challenge 를
  //   풀어 정상 속도(10MiB/s+)로 받으므로, 전체를 한 번 받고 프레임은 로컬에서 뽑는다.
  //   avc(H.264) 를 우선해 ffmpeg 의 seek 가 빠르게 한다.
  const fullVideo = join(outDir, "_full.mp4");
  if (!existsSync(fullVideo)) {
    run("yt-dlp", [
      "-f", "bv*[height<=720][vcodec^=avc]/bv*[height<=720]/b[height<=720]/best",
      "-o", fullVideo,
      videoUrl,
    ]);
  }

  const sections = [];
  manifest.forEach((entry, i) => {
    const heading = entry.heading ?? `섹션 ${i + 1}`;
    const center = toSeconds(entry.t);
    const start = Math.max(0, center - window);
    const end = center + window;
    const secDir = join(outDir, `sec-${String(i + 1).padStart(2, "0")}`);
    mkdirSync(secDir, { recursive: true });

    // 받아 둔 전체 영상에서 시점 앞뒤(window) 를 step 간격으로 한 장씩 뽑는다.
    // -ss 를 -i 앞에 둬 빠른 seek. 절대 시각(absSec)으로 바로 캡처한다.
    const files = [];
    for (let absSec = start; absSec <= end + 0.001; absSec += step) {
      const file = join(secDir, `cand-${stampLabel(absSec)}.jpg`);
      try {
        run("ffmpeg", ["-y", "-ss", String(absSec), "-i", fullVideo, "-frames:v", "1", "-q:v", "3", file]);
        if (existsSync(file)) files.push(file);
      } catch {
        /* 영상 끝을 넘어선 시점은 ffmpeg 가 실패 — 무시 */
      }
    }

    sections.push({ index: i + 1, heading, t: entry.t, center_sec: center, candidates: files });
  });

  // 세션이 읽을 후보 목록. 사람이 보기 좋게 + 기계가 파싱하기 좋게.
  console.log(`✓ 후보 추출 완료 — ${outDir}`);
  for (const s of sections) {
    console.log(`\n[sec-${String(s.index).padStart(2, "0")}] ${s.heading} (t=${s.t})`);
    for (const f of s.candidates) console.log(`   ${f}`);
  }
  console.log("\n--- JSON ---");
  console.log(JSON.stringify(sections, null, 2));
}

// --- upload: 고른 컷 → post-images 버킷 ------------------------------------

async function upload(file) {
  if (!file) throw new Error("사용법: upload <image_file>");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");

  const { createClient } = await import("@supabase/supabase-js");
  const sharp = (await import("sharp")).default;

  // 어드민 uploadImage 와 동일 규약: 1600px 상한, WebP q90.
  const input = readFileSync(file);
  const body = await sharp(input)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();

  const stamp = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID().slice(0, 8);
  const path = `${stamp}/${id}.webp`;

  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await sb.storage
    .from("post-images")
    .upload(path, body, { contentType: "image/webp", upsert: false });
  if (error) throw error;

  const { data } = sb.storage.from("post-images").getPublicUrl(path);
  console.log(data.publicUrl);
}

// --- 엔트리 ----------------------------------------------------------------

function parseOpts(args) {
  const opts = {};
  const rest = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--window") opts.window = Number(args[++i]);
    else if (args[i] === "--step") opts.step = Number(args[++i]);
    else if (args[i] === "--out") opts.out = args[++i];
    else rest.push(args[i]);
  }
  return { opts, rest };
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  const { opts, rest } = parseOpts(args);

  if (cmd === "candidates") candidates(rest[0], rest[1], opts);
  else if (cmd === "upload") await upload(rest[0]);
  else {
    console.log(`사용법:
  npm run capture -- candidates <video_url> <manifest.json> [--window 8] [--step 2] [--out dir]
  npm run capture -- upload <image_file>`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("실패:", e?.message ?? e);
  process.exit(1);
});
