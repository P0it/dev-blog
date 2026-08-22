// 배포된 프로젝트 화면을 찍어 project-media 에 올리고 DB 를 갱신한다.
//
//   npm run capture:project <slug>
//
// 하는 일
//   1. projects/<slug>.md 의 capture 플래그와 url 을 읽는다 (없으면 DB 의 url)
//   2. Playwright 로 열어 대표 스크린샷 한 장
//   3. 위에서 아래로 천천히 스크롤하며 8초 영상 한 편
//   4. project-media 에 올리고 hero_poster · hero_media 를 갱신
//
// 전제: npx playwright install chromium
// 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY

import { readFileSync, existsSync, rmSync, readdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "project-media";
const VIEWPORT = { width: 1440, height: 900 };
const SCROLL_MS = 8000;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

const slug = process.argv[2];
if (!slug) {
  console.error("사용법: npm run capture:project <slug>");
  process.exit(1);
}

// 원고에 capture: false 가 있으면 찍지 않는다. 원고가 없으면 DB 를 따른다.
function readManifest() {
  const file = `projects/${slug}.md`;
  if (!existsSync(file)) return {};
  const raw = readFileSync(file, "utf8");
  const m = /^---\n([\s\S]*?)\n---/.exec(raw);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    out[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .replace(/\s+#.*$/, "")
      .trim();
  }
  return out;
}

async function upload(path, body, contentType) {
  const { error } = await sb.storage.from(BUCKET).upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function run() {
  const meta = readManifest();
  if (meta.capture === "false") {
    console.log(`· ${slug} 는 capture: false 다. 건너뛴다.`);
    return;
  }

  const { data: row, error } = await sb
    .from("projects")
    .select("slug,url")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!row) throw new Error(`없는 slug: ${slug}`);

  const target = meta.url || row.url;
  if (!target) throw new Error(`${slug} 에 url 이 없다. 캡처할 대상이 없다.`);

  const outDir = mkdtempSync(join(tmpdir(), `cap-${slug}-`));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    recordVideo: { dir: outDir, size: VIEWPORT },
  });
  const page = await ctx.newPage();

  console.log(`· 여는 중: ${target}`);
  await page.goto(target, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  const shot = await page.screenshot({ type: "png" });

  // 위에서 아래로 천천히. 페이지가 짧으면 그 자리에 머문다.
  await page.evaluate(async (ms) => {
    const total = Math.max(0, document.body.scrollHeight - window.innerHeight);
    const start = performance.now();
    while (performance.now() - start < ms) {
      const t = (performance.now() - start) / ms;
      window.scrollTo(0, total * t);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, total);
  }, SCROLL_MS);
  await page.waitForTimeout(500);

  await ctx.close();
  await browser.close();

  const video = readdirSync(outDir).find((f) => f.endsWith(".webm"));
  if (!video) throw new Error("영상 파일이 생기지 않았다");

  const stamp = Date.now();
  const posterUrl = await upload(`${slug}/poster-${stamp}.png`, shot, "image/png");
  const mediaUrl = await upload(
    `${slug}/scroll-${stamp}.webm`,
    readFileSync(join(outDir, video)),
    "video/webm",
  );

  const { error: upErr } = await sb
    .from("projects")
    .update({ hero_poster: posterUrl, hero_media: mediaUrl })
    .eq("slug", slug);
  if (upErr) throw upErr;

  rmSync(outDir, { recursive: true, force: true });
  console.log(`✓ ${slug} 캡처 완료`);
  console.log(`  poster: ${posterUrl}`);
  console.log(`  media : ${mediaUrl}`);
}

run().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
