// HTML 페이지 글 점검 — auto-drafts/posts/<slug>.html 을 dev 서버의 /internal/page/<slug> 로 열어
// 데스크톱(1440)·모바일(390) 전체 화면을 찍고, 가로 넘침과 스크립트 오류를 출력한다.
//   npm run check:page -- <slug> <outdir> [--dark] [--act "<찍기 전 실행할 js>"]
// 넘침이나 오류가 있으면 종료 코드 1 — 자동 학습 글은 이걸 통과해야 발행된다(auto-draft-ingest.yml).
// 전제: npm run dev (기본 http://localhost:3000, PAGE_BASE 로 바꿀 수 있다)
// 호흡 점검(POSTING.md 5-6) — 스크립트가 그린 뒤의 DOM 으로 잰다(데스크톱·라이트 한 번만).
//   · 섹션(조상에 section 이 없는 section 중 h2 가 있는 것)마다 그린 그림이 하나 이상
//     그림 = 160×100 이상인 svg·canvas, 또는 data-figure 를 단 요소. 표·버튼·카드는 그림이 아니다
//     맺음·참고 섹션처럼 그림이 필요 없는 섹션은 data-text-only 로 빼되 글 하나에 두 개까지
//   · 단락(p·li) 하나는 한글 LIMITS.para 자 이하
//   · 그림 없이 글만 이어지는 구간은 한글 LIMITS.run 자 이하 (접힌 <details> 안은 세지 않는다)
import { chromium } from "playwright";
const LIMITS = { para: 220, run: 650, textOnly: 2 };
function rhythm(L) {
  const root = document.querySelector(".post-page");
  const ko = (t) => (t.match(/[가-힣]/g) || []).length;
  const isFig = (el) => {
    if (el.hasAttribute("data-figure")) return true;
    if (el.tagName !== "svg" && el.tagName !== "CANVAS" && el.tagName !== "svg".toUpperCase()) return false;
    const b = el.getBoundingClientRect();
    return b.width >= 160 && b.height >= 100;
  };
  const hidden = (el) => !!el.closest("details:not([open])") && !el.matches("summary") && !el.closest("summary");
  const problems = [];
  const secs = [...root.querySelectorAll("section")].filter((s) => !s.parentElement.closest("section") && s.querySelector("h2"));
  let textOnly = 0, figures = 0;
  for (const s of secs) {
    const h = s.querySelector("h2").textContent.trim().slice(0, 30);
    const n = [...s.querySelectorAll("svg, canvas, [data-figure]")].filter((e) => isFig(e) && !e.parentElement.closest("[data-figure]")).length;
    figures += n;
    if (s.hasAttribute("data-text-only")) { textOnly++; continue; }
    if (!n) problems.push(`그림 없는 섹션: "${h}"`);
  }
  if (textOnly > L.textOnly) problems.push(`data-text-only 섹션이 ${textOnly}개 (최대 ${L.textOnly})`);
  // 문서 순서로 훑으며 그림을 만나면 글 구간을 끊는다
  let run = 0, maxRun = 0, runStart = "", maxPara = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  for (let el = walker.currentNode; el; el = walker.nextNode()) {
    if (el.matches("svg, canvas, [data-figure]") && isFig(el)) { run = 0; continue; }
    if (el.closest("svg, [data-figure], [data-text-only]") || hidden(el)) continue;
    if (!el.matches("p, li")) continue;
    if (el.querySelector("p, li")) continue;
    const c = ko(el.textContent);
    if (c > maxPara) maxPara = c;
    if (c > L.para) problems.push(`긴 단락 ${c}자: "${el.textContent.trim().slice(0, 24)}…"`);
    if (!run) runStart = el.textContent.trim().slice(0, 24);
    run += c;
    if (run > maxRun) maxRun = run;
    if (run > L.run && run - c <= L.run) problems.push(`그림 없이 ${L.run}자를 넘는 글 구간: "${runStart}…" 부터`);
  }
  return { sections: secs.length, figures, maxPara, maxRun, problems };
}
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
  if (name === "desk" && !dark) {
    const r = await p.evaluate(rhythm, LIMITS);
    console.log(`rhythm: 섹션 ${r.sections} · 그림 ${r.figures} · 가장 긴 단락 ${r.maxPara}자 · 그림 없이 이어진 최대 ${r.maxRun}자`);
    if (r.problems.length) { bad = true; r.problems.forEach((x) => console.log("  ✗ " + x)); }
  }
  await p.screenshot({ path: `${out}/${slug}-${name}${dark ? "-dark" : ""}.png`, fullPage: true });
  if (ov > 0 || errs.length) bad = true;
  console.log(name, "hOverflow:", ov, "errors:", errs.length ? errs : "none");
  await ctx.close();
}
await b.close();
if (bad) process.exitCode = 1;
