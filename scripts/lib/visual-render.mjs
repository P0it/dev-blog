// Playwright(Chromium)로 /internal/visual 라우트를 열어 카드 PNG를 굽는다.
// playwright는 지연 import — 미설치 시에도 워커 자체는 기동하고,
// 시각자료 렌더만 블록 단위로 실패 처리된다.

let chromiumPromise = null;
let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    if (!chromiumPromise) {
      chromiumPromise = import("playwright").then((m) => m.chromium);
    }
    const chromium = await chromiumPromise;
    browserPromise = chromium.launch();
  }
  return browserPromise;
}

/** 워커 종료 시 호출 — Chromium 프로세스를 정리한다. */
export async function closeBrowser() {
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      await browser.close();
    } catch {
      /* 이미 닫혔으면 무시 */
    }
    browserPromise = null;
  }
}

/**
 * 시각자료 하나를 PNG 버퍼로 렌더한다.
 * 카탈로그는 `spec`(JSON 직렬화), illustration 은 `data`(raw SVG 문자열)를 넘긴다.
 * @param {{ baseUrl: string, pattern: string, spec?: object, data?: string,
 *           token?: string, theme?: "light"|"dark" }} args
 * @returns {Promise<Buffer>}
 */
export async function renderVisual({ baseUrl, pattern, spec, data, token, theme = "light" }) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
    colorScheme: theme === "dark" ? "dark" : "light",
  });
  const page = await context.newPage();
  try {
    const payload = data ?? JSON.stringify(spec);
    const encoded = Buffer.from(payload, "utf-8").toString("base64url");
    const params = new URLSearchParams({ data: encoded });
    if (token) params.set("t", token);
    const url = `${baseUrl}/internal/visual/${pattern}?${params.toString()}`;

    await page.goto(url, { waitUntil: "load", timeout: 30_000 });
    const root = await page.waitForSelector("[data-visual-root]", {
      timeout: 10_000,
    });
    // 웹폰트 로드 완료까지 대기 후 잠깐 안정화 → 레이아웃 흔들림 방지
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(120);

    return await root.screenshot({ omitBackground: true, type: "png" });
  } finally {
    await context.close();
  }
}
