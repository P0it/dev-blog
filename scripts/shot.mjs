// 웹페이지(공식 문서·제품 UI)를 캡처해 글의 실제 이미지로 쓴다. 내려받을 그림이 없을 때
// 문서 페이지의 도표·파일 목록·리더보드 같은 화면을 잘라 오는 용도다.
// 결과 PNG 는 `npm run capture -- upload <png>` 로 올려 공개 URL 을 받는다.
//
//   npm run shot -- <url> <out.png> [옵션]
//     --w 1200 --h 900       뷰포트 (deviceScaleFactor 2 로 찍는다)
//     --wait 1500            로드 후 대기 ms (SPA·리더보드는 길게)
//     --sel <css>            요소 하나만
//     --clip x,y,w,h         CSS px 기준 영역
//     --scroll <y>           찍기 전 스크롤
//     --fill "<css>=><text>" 입력란 채우기 (토크나이저 같은 도구 페이지)
//     --js "<code>"          찍기 전 실행 (쿠키 배너·팝업 제거)
// 전제: npx playwright install chromium
import { chromium } from "playwright";
const a = process.argv.slice(2);
const url = a[0], out = a[1];
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const w = Number(opt("--w", 1200)), h = Number(opt("--h", 900));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(Number(opt("--wait", 1500)));
const fill = opt("--fill"); if (fill) { const i = fill.indexOf("=>"); await page.locator(fill.slice(0, i)).first().fill(fill.slice(i + 2)); await page.waitForTimeout(1500); }
const js = opt("--js"); if (js) { await page.evaluate(js); await page.waitForTimeout(800); }
const sy = opt("--scroll"); if (sy) { await page.evaluate((y) => window.scrollTo(0, y), Number(sy)); await page.waitForTimeout(500); }
const sel = opt("--sel"), clip = opt("--clip");
if (sel) { const el = page.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await el.screenshot({ path: out }); }
else if (clip) { const [x, y, cw, ch] = clip.split(",").map(Number); await page.screenshot({ path: out, clip: { x, y, width: cw, height: ch } }); }
else await page.screenshot({ path: out });
await browser.close();
console.log("saved", out);
