// HTML 페이지 글을 /humanize 로 윤문할 때 쓰는 앞뒤 손질.
// humanize 는 평문을 받으므로, 본문 HTML 에서 읽히는 문장만 [[id]] 표지로 뽑았다가
// 윤문본을 같은 자리에 되돌려 넣는다. 태그·${…}·엔티티가 달라진 블록은 원문을 유지한다.
//
//   npm run humanize:page -- extract <page.html> <work>/   → <work>/<slug>.md, <slug>.json
//   (humanize-monolith 에이전트에 <slug>.md 를 주고 <slug>.final.md 로 받는다)
//   npm run humanize:page -- apply   <page.html> <work>/   ← <work>/<slug>.final.md
//
// 뽑는 범위: 본문의 h1~h3·p·li·summary·em·small·button·label 안쪽, 스크립트 안의 한글 문자열.
// aria-label·a·span 단독 라벨처럼 여기서 빠지는 문구는 apply 뒤 직접 훑는다.
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const [cmd, src, work] = process.argv.slice(2);
if (!["extract", "apply"].includes(cmd) || !src || !work) {
  console.error("사용법: humanize-page.mjs extract|apply <page.html> <작업폴더>");
  process.exit(1);
}
const slug = basename(src).replace(/\.html?$/, "");
const mdf = join(work, `${slug}.md`), mapf = join(work, `${slug}.json`), finf = join(work, `${slug}.final.md`);

const split = (s) => {
  const styleEnd = s.indexOf("</style>"), scriptAt = s.indexOf("<script>", styleEnd);
  const at = scriptAt < 0 ? s.length : scriptAt;
  return [s.slice(0, styleEnd), s.slice(styleEnd, at), s.slice(at)];
};

if (cmd === "extract") {
  const [, html, js] = split(readFileSync(src, "utf8"));
  const items = [];
  const re = /<(h1|h2|h3|p|li|summary|em|small|button|label)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(html))) {
    if (!/[가-힣]/.test(m[2]) || /<(p|div|h\d|li|input)\b/.test(m[2])) continue;
    items.push({ id: "b" + items.length, kind: "html", orig: m[2] });
  }
  const sre = /(["'`])((?:(?!\1)[^\\\n]|\\.)*?[가-힣](?:(?!\1)[^\\\n]|\\.)*?)\1/g;
  while ((m = sre.exec(js))) {
    if (m[2].replace(/<[^>]+>|\$\{[^}]*\}/g, "").replace(/[^가-힣]/g, "").length < 6) continue;
    // 따옴표 짝이 어긋나 코드·주석을 문자열로 잘못 잡은 경우는 버린다
    if (/\/\/ |=>|;\s|\)\s*\{|\)\.\w+\(/.test(m[2].replace(/\$\{[^}]*\}/g, ""))) continue;
    items.push({ id: "s" + items.length, kind: "js", q: m[1], orig: m[2] });
  }
  writeFileSync(mapf, JSON.stringify(items, null, 1));
  writeFileSync(mdf, items.map((x) => `[[${x.id}]] ${x.orig.replace(/\s+/g, " ").trim()}`).join("\n\n") + "\n");
  console.log(`✓ ${items.length}개 블록 → ${mdf} (${statSync(mdf).size} bytes)`);
} else {
  let s = readFileSync(src, "utf8");
  const items = JSON.parse(readFileSync(mapf, "utf8"));
  const fin = readFileSync(finf, "utf8").replace(/<!--[\s\S]*?HUMANIZE-SUMMARY[\s\S]*$/, "");
  const out = {};
  for (const m of fin.matchAll(/\[\[(\w+)\]\]\s*([\s\S]*?)(?=\n\s*\[\[\w+\]\]|\s*$)/g)) out[m[1]] = m[2].replace(/\s+/g, " ").trim();
  const missing = items.filter((x) => !(x.id in out)).map((x) => x.id);
  if (missing.length) { console.error("✗ 윤문본에 없는 블록:", missing.join(",")); process.exit(1); }
  const marks = (t) => (t.match(/<[^>]+>|\$\{[^}]*\}|&\w+;/g) || []).join("|");
  let [head, html, js] = split(s);
  let hc = 0, jc = 0, changed = 0;
  const kept = [];
  for (const it of items) {
    const ok = marks(out[it.id]) === marks(it.orig);
    if (!ok) kept.push(it.id);
    // 공백만 정규화된 블록은 원문 그대로 둔다(줄바꿈·들여쓰기를 지키려고)
    const next = !ok || out[it.id] === it.orig.replace(/\s+/g, " ").trim() ? it.orig : out[it.id];
    if (it.kind === "html") {
      const i = html.indexOf(it.orig, hc);
      if (i < 0) throw new Error("본문에서 블록을 찾지 못함: " + it.id);
      html = html.slice(0, i) + next + html.slice(i + it.orig.length); hc = i + next.length;
    } else {
      const lit = it.q + it.orig + it.q, i = js.indexOf(lit, jc);
      if (i < 0) throw new Error("스크립트에서 문자열을 찾지 못함: " + it.id);
      const esc = it.q === "`" || next === it.orig ? next : next.replace(/\\?(["'])/g, (q, c) => (c === it.q ? "\\" + c : q));
      js = js.slice(0, i) + it.q + esc + it.q + js.slice(i + lit.length); jc = i + esc.length + 2;
    }
    if (next !== it.orig) changed++;
  }
  s = head + html + js;
  // 프런트매터 title 은 h1 과 같게 둔다
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(s);
  if (h1) s = s.replace(/^title: .*$/m, "title: " + h1[1].replace(/<[^>]+>/g, "").trim());
  writeFileSync(src, s);
  console.log(`✓ ${changed}/${items.length}개 블록 반영`);
  if (kept.length) console.log(`⚠ 태그·자리표시자가 달라져 원문을 유지한 블록: ${kept.join(", ")} — 직접 확인`);
  console.log("  다음: 위 범위 밖 문구(aria-label·data-* 속성·짧은 라벨)를 직접 훑고, npm run check:page 로 다시 확인");
}
