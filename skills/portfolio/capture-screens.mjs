// 앱을 띄워 화면을 자동으로 찍는다. /portfolio 스킬이 다른 레포에서 실행한다.
//
// 결과는 원고 옆 폴더에 PNG 로 떨어지고, 그대로 붙여 넣을 `## 화면` 블록을 찍어 준다.
// 로고와 달리 화면은 레포에 없으므로, 이 스크립트가 만들어 내는 것이 유일한 소스다.
//
// 사용법 (레포 루트에서):
//   node ~/.claude/skills/portfolio/capture-screens.mjs \
//     --cmd "npm run dev" --base http://localhost:3000 \
//     / :홈 /posts:글목록 /admin:어드민
//
// 주요 옵션:
//   --cmd "<명령>"     앱을 직접 띄운다. 생략하면 이미 떠 있다고 보고 --base 로 붙는다
//   --base <url>       기준 주소 (기본 http://localhost:3000)
//   --out <dir>        저장 폴더 (기본 ./portfolio/screens)
//   --anchor <dir>     원고가 놓일 폴더 (기본 ./portfolio). 경로 계산 기준이다
//   --mobile           폰 뷰포트(390×844)로 찍는다. 기본은 1440×900
//   --full             페이지 전체를 세로로 이어 찍는다. 기본은 첫 화면만
//   --wait <ms>        각 화면에서 기다릴 시간 (기본 1200)
//   --auth <file>      playwright storageState JSON. 로그인 뒤 화면을 찍을 때
//   --dark             다크 모드로 찍는다
//
// 라우트는 `경로:이름` 으로 준다. 이름을 생략하면 경로에서 만든다.

import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { spawn } from "node:child_process";

// ── playwright 를 찾는다 ──────────────────────────────────────────────
// 1) 실행한 레포에 설치돼 있으면 그걸 쓴다
// 2) 없으면 이 스크립트가 사는 블로그 레포의 것을 빌린다 (심볼릭 링크라 실경로가 잡힌다)
async function loadChromium() {
  try {
    return (await import("playwright")).chromium;
  } catch {}
  try {
    const url = new URL("../../node_modules/playwright/index.js", import.meta.url);
    return (await import(url.href)).chromium;
  } catch {}
  console.error("playwright 를 찾지 못했다. 레포에서 한 번 설치해라:");
  console.error("  npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

// ── 인자 파싱 ────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
function opt(name, fallback = null) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
}
const flag = (name) => argv.includes(`--${name}`);

const cmd = opt("cmd");
const base = (opt("base", "http://localhost:3000") ?? "").replace(/\/+$/, "");
const outDir = resolve(opt("out", "./portfolio/screens"));
const waitMs = Number(opt("wait", "1200"));
const authFile = opt("auth");
const mobile = flag("mobile");
const fullPage = flag("full");
const dark = flag("dark");

// `--x 값` 을 걷어낸 나머지가 라우트다.
const routes = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    if (argv[i + 1] && !argv[i + 1].startsWith("--")) i++;
    continue;
  }
  const at = a.lastIndexOf(":");
  // `/posts:글목록` 은 가르고, `http://…` 나 `/` 는 그대로 둔다.
  const hasName = at > 0 && !a.slice(0, at).includes("//");
  const path = hasName ? a.slice(0, at) : a;
  const name = hasName ? a.slice(at + 1) : null;
  routes.push({ path, name });
}
if (!routes.length) {
  console.error("찍을 라우트를 하나 이상 줘라. 예: / :홈 /posts:글목록");
  process.exit(1);
}

const VIEWPORT = mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };

// 파일명은 ASCII 로 만든다. 한글 이름은 원고에만 쓰고 파일은 경로에서 딴다.
function fileFor(path, i) {
  const s = path.replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9/-]/g, "").replace(/\//g, "-");
  return `${String(i + 1).padStart(2, "0")}-${s || "home"}.png`;
}
function nameFor(r, i) {
  if (r.name) return r.name;
  const s = r.path.replace(/^\/+|\/+$/g, "");
  return s ? s.split("/").pop() : "홈";
}

// ── 앱 띄우기 ────────────────────────────────────────────────────────
let child = null;
async function boot() {
  if (!cmd) return;
  console.error(`· 앱 실행: ${cmd}`);
  child = spawn(cmd, { shell: true, stdio: "ignore", detached: process.platform !== "win32" });

  const deadline = Date.now() + Number(opt("ready-timeout", "60000"));
  while (Date.now() < deadline) {
    try {
      const r = await fetch(base, { signal: AbortSignal.timeout(2500) });
      if (r.status < 500) {
        console.error(`· 떴다: ${base}`);
        return;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${base} 가 시간 안에 뜨지 않았다. --cmd 나 --base 를 확인해라.`);
}

function shutdown() {
  if (!child) return;
  try {
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
    else process.kill(-child.pid, "SIGTERM");
  } catch {}
  child = null;
}

// ── 본작업 ───────────────────────────────────────────────────────────
async function run() {
  const chromium = await loadChromium();
  await boot();

  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: dark ? "dark" : "light",
    isMobile: mobile,
    hasTouch: mobile,
    ...(authFile && existsSync(authFile) ? { storageState: authFile } : {}),
  });
  const page = await ctx.newPage();

  const done = [];
  for (const [i, r] of routes.entries()) {
    const url = r.path.startsWith("http") ? r.path : `${base}${r.path.startsWith("/") ? "" : "/"}${r.path}`;
    const file = fileFor(r.path, i);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(waitMs);
      await page.screenshot({ path: join(outDir, file), fullPage });
      done.push({ file, name: nameFor(r, i), url });
      console.error(`  ✓ ${r.path} → ${file}`);
    } catch (e) {
      // 한 화면이 실패해도 나머지는 계속 찍는다. 비어 있는 것보다 몇 장이라도 낫다.
      console.error(`  ✗ ${r.path} — ${e.message.split("\n")[0]}`);
    }
  }

  await ctx.close();
  await browser.close();

  if (!done.length) {
    console.error("찍힌 화면이 없다.");
    process.exitCode = 1;
    return;
  }

  // 원고에 그대로 붙일 블록. 설명은 사람이 채운다 — 화면만 보고는 알 수 없다.
  // 경로는 항상 상대경로로 적는다 — 적재 스크립트가 원고 위치 기준으로 찾기 때문에
  // 절대경로를 적으면 다른 기계에서 그대로 깨진다.
  // 기준은 원고가 놓일 폴더다 (기본 ./portfolio, 그 안에 portfolio.md 가 들어간다).
  // 원고에서 본 경로라 `./screens/01-home.png` 처럼 한 단계 짧아진다.
  const anchorDir = resolve(opt("anchor", "./portfolio"));
  const rel = `./${relative(anchorDir, outDir).replace(/\\/g, "/") || "screens"}`;
  const md = [
    "## 화면",
    "",
    ...done.flatMap((d) => [`### ${d.name}`, "", `**파일** ${rel}/${d.file}`, "**설명** ", ""]),
  ].join("\n");

  writeFileSync(join(outDir, "_section.md"), md, "utf8");
  console.error(`\n· ${done.length} 장. ${outDir}`);
  console.error("· 아래를 원고에 붙이고 **설명** 을 채워라 (사본: screens/_section.md)\n");
  console.log(md);
}

try {
  await run();
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exitCode = 1;
} finally {
  shutdown();
}
