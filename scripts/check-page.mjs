// HTML 페이지 글 점검 — auto-drafts/posts/<slug>.html 을 dev 서버의 /internal/page/<slug> 로 열어
// 데스크톱(1440)·모바일(390) 전체 화면을 찍고, 가로 넘침과 스크립트 오류를 출력한다.
//   npm run check:page -- <slug> <outdir> [--dark] [--act "<찍기 전 실행할 js>"]
// 넘침이나 오류가 있으면 종료 코드 1 — 자동 학습 글은 이걸 통과해야 발행된다(auto-draft-ingest.yml).
// 전제: npm run dev (기본 http://localhost:3000, PAGE_BASE 로 바꿀 수 있다)
import { chromium } from "playwright";
const [slug, out] = process.argv.slice(2);
const dark = process.argv.includes("--dark");
const ai = process.argv.indexOf("--act"); const act = ai > 0 ? process.argv[ai + 1] : null;
const b = await chromium.launch();
let bad = false;
for (const [name, vw, vh, mobile] of [["desk", 1440, 900, false], ["mob", 390, 844, true]]) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, colorScheme: dark ? "dark" : "light" });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()); });
  if (dark) await p.addInitScript(() => { try { localStorage.setItem("theme", "dark"); } catch {} });
  await p.goto(`${process.env.PAGE_BASE || "http://localhost:3000"}/internal/page/${slug}`, { waitUntil: "networkidle", timeout: 120000 });
  if (dark) await p.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await p.waitForTimeout(1200);
  if (act) { await p.evaluate(act); await p.waitForTimeout(2500); }
  // 스크롤 트리거 애니메이션이 모두 끝난 상태로 찍기 위해 끝까지 훑는다
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(60); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await p.screenshot({ path: `${out}/${slug}-${name}${dark ? "-dark" : ""}.png`, fullPage: true });
  if (ov > 0 || errs.length) bad = true;
  console.log(name, "hOverflow:", ov, "errors:", errs.length ? errs : "none");
  await ctx.close();
}
await b.close();
if (bad) process.exitCode = 1;
