// 실험실 포트폴리오 원고를 /humanize 로 윤문할 때 쓰는 앞뒤 손질.
// `##` 제목·구조도·화면 이름·칩 라벨은 렌더러가 글자 그대로 읽으므로, 문장만 [[줄번호]] 표지로
// 뽑았다가 검사를 통과한 줄만 같은 자리에 되돌린다. 한글 5,000자를 넘으면 조각으로 나눈다.
//
//   node scripts/humanize-project.mjs extract <portfolio.md> <작업폴더>
//     → <작업폴더>/<slug>-N/01_input.txt (humanize-monolith 에 주고 같은 폴더 final.md 로 받는다)
//   node scripts/humanize-project.mjs apply <portfolio.md> <작업폴더>
//
// 숫자·영어 토큰이 달라졌거나 줄이 빠졌거나 `~죠` 가 생긴 줄은 원문을 유지하고 찍어 준다.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { basename, join } from "node:path";

const [cmd, file, work] = process.argv.slice(2);
if (!["extract", "apply"].includes(cmd) || !file || !work) {
  console.error("사용법: humanize-project.mjs extract|apply <portfolio.md> <작업폴더>");
  process.exit(1);
}

// 값이 칩·링크·경로이거나 형식을 파서가 읽는 줄. 통째로 잠근다.
const LOCKED = /^\*\*(파일|영상|이미지|링크|아이콘|방식|갱신|붙인 것|갈라짐)\*\*/;
// 이 섹션의 `###` 은 문장이 아니라 이름이다 (구조는 다이어그램 노드와 글자가 같아야 한다).
const NAME_TITLES = new Set(["화면", "데이터와 API", "구조"]);
const LIMIT = 4800;

const ko = (s) => (s.match(/[가-힣]/g) || []).length;
const raw = readFileSync(file, "utf8").replace(/\r/g, "");
const lines = raw.split("\n");
const slug =
  raw.match(/^---\n[\s\S]*?^slug:\s*(\S+)/m)?.[1] ??
  (basename(file) === "portfolio.md" ? basename(join(file, "..")) : basename(file, ".md"));

function collect() {
  const items = [];
  let sec = "";
  let fence = false;
  let i = 0;
  if (lines[0] === "---") {
    i = lines.indexOf("---", 1) + 1;
  }
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (/^```/.test(l)) { fence = !fence; continue; }
    if (fence) continue;
    if (l.startsWith("## ")) { sec = l.slice(3).trim(); continue; }
    if (!ko(l) || LOCKED.test(l)) continue;
    if (l.startsWith("### ")) {
      if (!NAME_TITLES.has(sec)) items.push({ i, prefix: "### ", text: l.slice(4), sec });
      continue;
    }
    let m = l.match(/^(\*\*[^*]+\*\*\s+)(.*)$/);
    if (m && ko(m[2])) { items.push({ i, prefix: m[1], text: m[2], sec, label: m[1].replace(/\*/g, "").trim() }); continue; }
    m = l.match(/^(- )(.*)$/);
    if (m) { items.push({ i, prefix: m[1], text: m[2], sec }); continue; }
    items.push({ i, prefix: "", text: l, sec });
  }
  return items;
}

const items = collect();

if (cmd === "extract") {
  const chunks = [[]];
  let n = 0;
  for (const it of items) {
    if (n + ko(it.text) > LIMIT) { chunks.push([]); n = 0; }
    chunks.at(-1).push(it);
    n += ko(it.text);
  }
  chunks.forEach((c, ci) => {
    const dir = join(work, `${slug}-${ci}`);
    mkdirSync(dir, { recursive: true });
    let out = "";
    let cur = null;
    for (const it of c) {
      if (it.sec !== cur) { out += `@@ ${it.sec} @@\n\n`; cur = it.sec; }
      out += `[[${it.i}]]${it.label ? ` ${it.label} |` : ""} ${it.text}\n\n`;
    }
    writeFileSync(join(dir, "01_input.txt"), out);
    console.log(`${dir}/01_input.txt  ${c.length}줄 한글 ${c.reduce((a, b) => a + ko(b.text), 0)}자`);
  });
  process.exit(0);
}

const sorted = (a) => [...a].sort().join(" ");
const digits = (s) => sorted(s.match(/\d+(?:[.,]\d+)*/g) || []);
const latin = (s) => sorted(s.match(/[A-Za-z][A-Za-z0-9._+/:-]*/g) || []);
const quotes = (s) => (s.match(/"/g) || []).length;

function reject(it, text) {
  if (digits(it.text) !== digits(text)) return "숫자";
  if (latin(it.text) !== latin(text)) return "영어 토큰";
  if (quotes(it.text) !== quotes(text)) return "따옴표";
  if (/죠[.?!\s]|죠$/.test(text) && !/죠[.?!\s]|죠$/.test(it.text)) return "~죠";
  const r = text.length / it.text.length;
  if (it.text.length >= 20 && (r < 0.5 || r > 1.5)) return "길이";
  if (it.label === "설명" && !/니다\.?$/.test(text) && /니다\.?$/.test(it.text)) return "설명 어미";
  if (it.label === "설명" && text.length > 40 && text.length > it.text.length) return "설명 길이";
  return null;
}

const got = new Map();
const dirs = readdirSync(work).filter((d) => d.startsWith(`${slug}-`) && /^[0-9]+$/.test(d.slice(slug.length + 1)));
if (!dirs.length) throw new Error(`${work} 에 ${slug}-N 폴더가 없다`);
for (const d of dirs) {
  const f = join(work, d, "final.md");
  if (!existsSync(f)) throw new Error(`윤문본이 없다: ${f}`);
  const s = readFileSync(f, "utf8").replace(/\r/g, "").replace(/<!--[\s\S]*?-->/g, "");
  for (const m of s.matchAll(/^\[\[(\d+)\]\] (.*)$/gm)) got.set(Number(m[1]), m[2].trim());
}

let changed = 0;
const kept = [];
for (const it of items) {
  let text = got.get(it.i);
  if (text === undefined) { kept.push([it.i, "줄 없음", it.text]); continue; }
  if (it.label) {
    const head = `${it.label} |`;
    if (!text.startsWith(head)) { kept.push([it.i, "라벨", it.text]); continue; }
    text = text.slice(head.length).trim();
  }
  if (text === it.text) continue;
  const why = reject(it, text);
  if (why) { kept.push([it.i, why, `${it.text}\n      → ${text}`]); continue; }
  lines[it.i] = it.prefix + text;
  changed++;
}
writeFileSync(file, lines.join("\n"));
console.log(`${slug}: ${items.length}줄 중 ${changed}줄 변경, 검사 탈락 ${kept.length}줄`);
for (const [i, why, t] of kept) console.log(`  [${i}] ${why}: ${t}`);
