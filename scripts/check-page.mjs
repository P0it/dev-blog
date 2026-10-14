// HTML 페이지 글 점검 — auto-drafts/posts/<slug>.html 을 dev 서버의 /internal/page/<slug> 로 열어
// 데스크톱(1440)·모바일(390) 전체 화면을 찍고, 가로 넘침과 스크립트 오류를 출력한다.
//   npm run check:page -- <slug> <outdir> [--dark] [--act "<찍기 전 실행할 js>"]
// 넘침이나 오류가 있으면 종료 코드 1 — 자동 학습 글은 이걸 통과해야 발행된다(auto-draft-ingest.yml).
// 전제: npm run dev (기본 http://localhost:3000, PAGE_BASE 로 바꿀 수 있다)
// 호흡 점검(POSTING.md 5-6) — 스크립트가 그린 뒤의 DOM 으로 잰다(데스크톱·라이트 한 번만).
//   그림 = 160×100 이상인 svg·canvas, 또는 data-figure 를 단 요소. 표·버튼·카드는 그림이 아니다
//   · 첫 화면(첫 h2 섹션까지)에 그림이 있다 — 대표 인터랙션
//   · 그림이 있는 섹션이 전체 섹션의 절반 이상 — 섹션마다 강제하지는 않는다(억지 그림 방지)
//   · 단락(p·li) 하나는 한글 LIMITS.para 자 이하
//   · 그림 없이 글만 이어지는 구간은 한글 LIMITS.run 자 이하. 그림이나 h2 를 만나면 끊는다
//     (접힌 <details> 안은 세지 않는다)
//   · SVG 그림 속 글자는 화면에서 10~28px(글자 상자 높이). 데스크톱에서 너무 크면 max-width, 모바일에서 너무 작으면 글자를 키운다
//   · 읽기 축 하나(POSTING 5-2): 읽는 글(그림·접힌 상자 밖의 h1·h2·p·li·summary)과 그림이 모두 같은 왼쪽 시작선에서
//     출발하고, 글 폭은 LIMITS.textMax 이하. 스크롤리텔링의 고정 그림([data-sticky-figure] 안)과 화면 끝까지 닿는 띠는 제외
import { chromium } from "playwright";
const LIMITS = { para: 220, run: 650, figShare: 0.5, textMax: 720, svgTextMax: 28, svgTextMin: 10 };
function rhythm(L) {
  const root = document.querySelector(".post-page");
  const ko = (t) => (t.match(/[가-힣]/g) || []).length;
  const isFig = (el) => {
    if (el.hasAttribute("data-figure")) return true;
    if (el.tagName !== "svg" && el.tagName !== "CANVAS") return false;
    const b = el.getBoundingClientRect();
    return b.width >= 160 && b.height >= 100;
  };
  const figsIn = (node) => [...node.querySelectorAll("svg, canvas, [data-figure]")].filter((e) => isFig(e) && !e.parentElement.closest("[data-figure]"));
  const hidden = (el) => !!el.closest("details:not([open])") && !el.matches("summary") && !el.closest("summary");
  const problems = [];
  const secs = [...root.querySelectorAll("section")].filter((s) => !s.parentElement.closest("section") && s.querySelector("h2"));
  const all = figsIn(root);
  const withFig = secs.filter((s) => figsIn(s).length).length;
  if (secs.length && withFig / secs.length < L.figShare) problems.push(`그림 있는 섹션이 ${withFig}/${secs.length} — 절반 이상이어야 한다`);
  // 첫 화면: 두 번째 h2 섹션보다 앞에 그림이 하나 있어야 한다
  const second = secs[1];
  const early = all.some((e) => !second || second.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING);
  if (!early) problems.push("첫 화면(첫 섹션까지)에 그림이 없다");
  // 읽기 축 — 글은 고정된 글 열 하나로 흐르고 그림도 같은 시작선에서 출발한다(2026-10-14 사용자 지시).
  // 시작선은 h1 의 왼쪽이다. 4px 넘게 벗어나거나 글 폭이 textMax 를 넘으면 잡는다.
  const vw = window.innerWidth;
  const h1 = root.querySelector("h1");
  const axisL = h1 ? h1.getBoundingClientRect().left : root.getBoundingClientRect().left;
  const skip = (e) => e.closest("[data-figure], [data-sticky-figure], svg, pre, .pg-code, button, nav, table") || hidden(e);
  const reads = [...root.querySelectorAll("h1, h2, p, li, summary")].filter((e) => !skip(e) && !e.parentElement.closest("p, li") && e.getBoundingClientRect().height > 0);
  const off = [];
  for (const e of reads) {
    const r = e.getBoundingClientRect();
    if (Math.abs(r.left - axisL) > 4 && !e.closest("ol, ul")?.parentElement?.closest("li")) {
      const li = e.closest("ol, ul");
      const lr = li ? li.getBoundingClientRect().left : r.left;
      if (Math.abs(lr - axisL) > 4) off.push(`글이 시작선(${Math.round(axisL)}px)에서 벗어남(${Math.round(lr)}px): "${e.textContent.trim().slice(0, 18)}"`);
    }
    if (r.width > L.textMax + 1) off.push(`글 폭 ${Math.round(r.width)}px > ${L.textMax}: "${e.textContent.trim().slice(0, 18)}"`);
  }
  for (const e of all) {
    if (e.closest("[data-sticky-figure]")) continue;
    const r = e.getBoundingClientRect();
    if (r.width >= vw - 20) continue;
    if (Math.abs(r.left - axisL) > 4) off.push(`그림이 시작선(${Math.round(axisL)}px)에서 벗어남(${Math.round(r.left)}px): "${(e.closest("section")?.querySelector("h2")?.textContent || "히어로").trim().slice(0, 18)}"`);
  }
  problems.push(...[...new Set(off)].slice(0, 12));
  if (off.length > 12) problems.push(`…시작선 위반 ${off.length - 12}건 더`);
  // SVG 그림 속 글자는 화면에서 본문과 비슷한 크기여야 한다. viewBox 그림이 넓은 칸에서 늘어나면 글자도 같이 커진다
  for (const svg of all.filter((e) => e.tagName === "svg")) {
    const sizes = [...svg.querySelectorAll("text")].map((t) => t.getBoundingClientRect().height).filter((h) => h > 0);
    if (!sizes.length) continue;
    const big = Math.max(...sizes), small = Math.min(...sizes);
    const sec = svg.closest("section")?.querySelector("h2")?.textContent.trim().slice(0, 20) || "히어로";
    if (big > L.svgTextMax) problems.push(`그림 속 글자가 너무 큼(${Math.round(big)}px): "${sec}" — SVG 에 max-width 를 준다`);
    if (small < L.svgTextMin) problems.push(`그림 속 글자가 너무 작음(${Math.round(small)}px): "${sec}"`);
  }
  // 문서 순서로 훑으며 그림이나 h2 를 만나면 글 구간을 끊는다
  let run = 0, maxRun = 0, runStart = "", maxPara = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  for (let el = walker.currentNode; el; el = walker.nextNode()) {
    if ((el.matches("svg, canvas, [data-figure]") && isFig(el)) || el.matches("h2")) { run = 0; continue; }
    if (el.closest("svg, [data-figure]") || hidden(el)) continue;
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
  return { sections: secs.length, withFig, offAxis: off.length, figures: all.length, maxPara, maxRun, problems };
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
    console.log(`rhythm: 섹션 ${r.sections}(그림 있는 섹션 ${r.withFig}, 시작선 위반 ${r.offAxis}) · 그림 ${r.figures} · 가장 긴 단락 ${r.maxPara}자 · 그림 없이 이어진 최대 ${r.maxRun}자`);
    if (r.problems.length) { bad = true; r.problems.forEach((x) => console.log("  ✗ " + x)); }
  }
  if (name === "mob" && !dark) {
    // 모바일에서는 SVG 가 좁아지며 글자가 작아진다 — 가장 작은 글자만 본다
    const tiny = await p.evaluate((min) => [...document.querySelectorAll(".post-page svg")].flatMap((svg) => {
      const b = svg.getBoundingClientRect();
      if (b.width < 160 || b.height < 100) return [];
      const hs = [...svg.querySelectorAll("text")].map((t) => t.getBoundingClientRect().height).filter((h) => h > 0);
      const m = hs.length ? Math.min(...hs) : 99;
      return m < min ? [`모바일에서 그림 속 글자가 너무 작음(${Math.round(m)}px): "${(svg.closest("section")?.querySelector("h2")?.textContent || "히어로").trim().slice(0, 20)}"`] : [];
    }), LIMITS.svgTextMin);
    if (tiny.length) { bad = true; tiny.forEach((x) => console.log("  ✗ " + x)); }
  }
  await p.screenshot({ path: `${out}/${slug}-${name}${dark ? "-dark" : ""}.png`, fullPage: true });
  if (ov > 0 || errs.length) bad = true;
  console.log(name, "hOverflow:", ov, "errors:", errs.length ? errs : "none");
  await ctx.close();
}
await b.close();
if (bad) process.exitCode = 1;
