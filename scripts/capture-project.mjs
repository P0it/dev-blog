// 배포된 프로젝트 화면을 찍어 project-media 에 올리고 DB 를 갱신한다.
//
//   npm run capture:project <slug>
//
// 하는 일
//   1. projects/<slug>.md 의 capture 플래그와 url 을 읽는다 (없으면 DB 의 url)
//   2. Playwright 로 열어 대표 스크린샷 한 장
//   3. project-media 에 올리고 hero_poster 를 갱신
//
// 히어로는 정지 화면이다. 움직이는 배경은 제목을 읽는 데 방해가 되어 쓰지 않는다.
//
// 전제: npx playwright install chromium
// 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY

import { readFileSync, existsSync } from "node:fs";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "project-media";
const VIEWPORT = { width: 1440, height: 900 };

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

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  console.log(`· 여는 중: ${target}`);
  await page.goto(target, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  const shot = await page.screenshot({ type: "png" });
  await ctx.close();
  await browser.close();

  const posterUrl = await upload(`${slug}/poster-${Date.now()}.png`, shot, "image/png");

  const { error: upErr } = await sb
    .from("projects")
    .update({ hero_poster: posterUrl, hero_media: null })
    .eq("slug", slug);
  if (upErr) throw upErr;

  console.log(`✓ ${slug} 캡처 완료`);
  console.log(`  poster: ${posterUrl}`);
}

run().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
