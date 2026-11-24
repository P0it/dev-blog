// HTML 페이지 글에 아이소메트릭 흐름 장면 엔진을 구워 넣는다. 원고의 <!--ISO--> 자리(또는 이미 구운
// <!--ISO:begin--> … <!--ISO:end--> 사이)를 scripts/iso-scene/engine.{css,js} 로 바꾼다.
//   npm run iso -- auto-drafts/posts/<slug>.html
// 글마다 구워 두므로 엔진을 고쳐도 이미 발행한 글은 그대로다. 고친 엔진을 쓰려면 그 원고를 다시 굽는다.
// 장면 적는 법·규약: POSTING.md 5-11, 만드는 절차: /scene.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = join(dirname(fileURLToPath(import.meta.url)), "iso-scene");
const page = process.argv[2];
if (!page) { console.error("사용법: npm run iso -- <page.html>"); process.exit(1); }
const html = readFileSync(page, "utf8");
// 자리표시는 한 줄에 혼자 있어야 한다 — 설명 주석 속 글자를 잘못 바꾸지 않게
const block = /^[ \t]*(?:<!--ISO-->|<!--ISO:begin-->[\s\S]*?<!--ISO:end-->)[ \t]*$/m;
if (!block.test(html)) { console.error("원고에 자리표시 줄(<!--ISO-->)이 없다 — 장면을 쓰는 <figure class=\"iso\"> 앞에 한 줄로 넣는다"); process.exit(1); }
const css = readFileSync(join(here, "engine.css"), "utf8").trim();
const js = readFileSync(join(here, "engine.js"), "utf8").trim();
const baked = `<!--ISO:begin-->\n<style>\n${css}\n</style>\n<script>\n${js}\n</script>\n<!--ISO:end-->`;
writeFileSync(page, html.replace(block, () => baked));
console.log(`✓ 아이소메트릭 장면 엔진 (${Math.round(baked.length / 1024)}KB) → ${page}`);
