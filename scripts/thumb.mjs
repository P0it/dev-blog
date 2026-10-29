// HTML 페이지 글 썸네일 — 글의 대표 그림을 1200×630 판에 캡처해 카드·OG 이미지로 쓴다.
//
//   npm run thumb -- <slug> [--no-upload] [--out <dir>] [--theme light|dark]
//
// 원고(auto-drafts/posts/<slug>.html)에서 data-thumb 를 단 요소를 찍는다. 없으면 첫 화면의 첫 그림.
// 썸네일로 보여 줄 상태가 따로 있으면 그 요소에 data-thumb-act="<js>" 를 단다 — el 이 그 요소다.
//   예: data-thumb-act="el.closest('.tp').querySelector('[data-tp-range]').value=1.6; …dispatchEvent(new Event('input'))"
// 제목은 넣지 않는다(카드가 제목을 따로 보여 준다). 배경은 페이지 배경색.
// 올리면 post-images 버킷 thumbs/ 에 JPEG 로 두고, 원고 프런트매터 cover_image 를 그 주소로 바꾼다.
// 전제: npm run dev (기본 http://localhost:3000, PAGE_BASE 로 변경). 업로드는 .env.local 의 Supabase 키.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const slug = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
if (!slug) { console.error("사용법: npm run thumb -- <slug> [--no-upload] [--out <dir>] [--theme light|dark]"); process.exit(1); }
const upload = !args.includes("--no-upload");
const outDir = opt("--out", join(tmpdir(), "post-thumbs"));
const theme = opt("--theme", "light");
const W = 1200, H = 630, PAD = 64;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: theme });
const p = await ctx.newPage();
if (theme === "dark") await p.addInitScript(() => { try { localStorage.setItem("theme", "dark"); } catch {} });
await p.goto(`${process.env.PAGE_BASE || "http://localhost:3000"}/internal/page/${slug}`, { waitUntil: "networkidle", timeout: 120000 });
if (theme === "dark") await p.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
await p.waitForTimeout(1200);

// 대표 그림을 고르고, 지정한 상태로 만든 뒤 화면에 들인다
const found = await p.evaluate(() => {
  const root = document.querySelector(".post-page");
  let el = root.querySelector("[data-thumb]");
  if (!el) {
    el = [...root.querySelectorAll("svg, canvas, [data-figure]")].find((e) => {
      const r = e.getBoundingClientRect();
      return r.width >= 240 && r.height >= 140;
    });
  }
  if (!el) return null;
  el.setAttribute("data-thumb-pick", "");
  // 그림이 화면보다 길면 스크롤하며 찍는데, 그때 사이트 머리글처럼 고정된 요소가 그림 위에 겹쳐 찍힌다
  for (const n of document.body.querySelectorAll("*")) {
    if (root.contains(n) || n.contains(root)) continue;
    const pos = getComputedStyle(n).position;
    if (pos === "fixed" || pos === "sticky") n.style.visibility = "hidden";
  }
  const act = el.getAttribute("data-thumb-act");
  if (act) new Function("el", act)(el);
  el.scrollIntoView({ block: "center" });
  return { bg: getComputedStyle(document.body).backgroundColor, marked: el.hasAttribute("data-thumb") };
});
if (!found) { console.error("✗ 찍을 그림이 없다 — 대표 그림에 data-thumb 를 단다"); process.exit(1); }
await p.waitForTimeout(1500);
const shot = await p.locator("[data-thumb-pick]").first().screenshot();

// 1200×630 판 가운데에 맞춰 넣는다
const comp = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await comp.setContent(`<html><body style="margin:0;width:${W}px;height:${H}px;background:${found.bg};display:grid;place-items:center">
  <img src="data:image/png;base64,${shot.toString("base64")}" style="max-width:${W - PAD * 2}px;max-height:${H - PAD * 2}px;object-fit:contain"></body></html>`);
await comp.waitForTimeout(300);
mkdirSync(outDir, { recursive: true });
const file = join(outDir, `${slug}${theme === "dark" ? "-dark" : ""}.jpg`);
writeFileSync(file, await comp.screenshot({ type: "jpeg", quality: 88 }));
await b.close();
console.log(`✓ ${file}${found.marked ? "" : "  (data-thumb 없음 — 첫 그림으로 대신 찍음)"}`);

if (upload) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) { console.error("✗ 업로드하려면 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 가 필요하다 (--no-upload 로 파일만)"); process.exit(1); }
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const path = `thumbs/${slug}-${Date.now().toString(36)}.jpg`;
  const { error } = await sb.storage.from("post-images").upload(path, readFileSync(file), { contentType: "image/jpeg", upsert: false, cacheControl: "31536000" });
  if (error) throw error;
  const pub = sb.storage.from("post-images").getPublicUrl(path).data.publicUrl;
  // 원고 프런트매터의 cover_image 를 바꾸거나 넣는다
  const src = join("auto-drafts", "posts", `${slug}.html`);
  let s = readFileSync(src, "utf8");
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(s);
  if (!fm) throw new Error("프런트매터가 없다: " + src);
  const body = /^cover_image:.*$/m.test(fm[1]) ? fm[1].replace(/^cover_image:.*$/m, `cover_image: ${pub}`) : `${fm[1]}\ncover_image: ${pub}`;
  s = s.replace(fm[1], body);
  writeFileSync(src, s);
  console.log(`✓ 올림 ${pub}\n✓ ${src} 의 cover_image 를 바꿨다 — npm run draft -- push ${src} 로 적재`);
}
