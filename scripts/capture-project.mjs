// 배포된 프로젝트 화면을 찍어 project-media 에 올리고 DB 를 갱신한다.
//
//   npm run capture:project <slug>          히어로 썸네일 한 장
//   npm run capture:project <slug> --demo   위→아래 스크롤 8초 영상
//
// 히어로는 정지 화면이다. 움직이는 배경은 제목을 읽는 데 방해가 된다.
// 영상은 본문 `## 시연` 에 들어간다 — --demo 가 찍어 올린 뒤 URL 을 찍어 주면
// 그 값을 원고의 `**영상**` 줄에 붙인다. hero_poster 는 건드리지 않는다.
//
// 전제: npx playwright install chromium
// 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY

import { readFileSync, existsSync, rmSync, readdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "project-media";
// 1440 이 아니라 1152 다. 이 그림은 실험실 판 안에서 보이고, 글씨가 읽히느냐는
// *찍은 폭 대비 판 폭*으로 정해진다 — 1440 으로 찍으면 목록 판(812px)에서 56% 로
// 줄어 본문이 9px 이 된다. 1152 는 흔한 반응형 경계를 모두 비켜 가는 데스크탑 폭이다.
const VIEWPORT = { width: 1152, height: 720 };
const SCROLL_MS = 8000;
const demoMode = process.argv.includes("--demo");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

const slug = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
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

  const outDir = demoMode ? mkdtempSync(join(tmpdir(), `cap-${slug}-`)) : null;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: demoMode ? 1 : 2,
    ...(outDir ? { recordVideo: { dir: outDir, size: VIEWPORT } } : {}),
  });
  const page = await ctx.newPage();

  console.log(`· 여는 중: ${target}`);
  await page.goto(target, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  if (!demoMode) {
    const shot = await page.screenshot({ type: "png" });
    await ctx.close();
    await browser.close();

    const posterUrl = await upload(`${slug}/poster-${Date.now()}.png`, shot, "image/png");
    const { error: upErr } = await sb
      .from("projects")
      .update({ hero_poster: posterUrl })
      .eq("slug", slug);
    if (upErr) throw upErr;

    console.log(`✓ ${slug} 썸네일 갱신`);
    console.log(`  ${posterUrl}`);
    return;
  }

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
  const mediaUrl = await upload(
    `${slug}/demo-scroll-${Date.now()}.webm`,
    readFileSync(join(outDir, video)),
    "video/webm",
  );
  rmSync(outDir, { recursive: true, force: true });

  console.log(`✓ ${slug} 시연 영상 업로드`);
  console.log(`  ${mediaUrl}`);
  console.log(`  원고의 ## 시연 아래에 \`**영상** <위 URL>\` 로 붙인다.`);
}

run().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
