import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { DOMParser } from "linkedom";
import { pageText } from "./page-html.ts";
import {
  listBlocks, blockHtml, moveBlock, moveBlockTo, duplicateBlock, removeBlock,
  replaceBlock, findBlockIndex, annotateForCanvas, cleanCanvasHtml,
  scriptHooks, missingHooks, editableTarget, inContext,
} from "./page-blocks.ts";

(globalThis as any).DOMParser = DOMParser;

const SAMPLE = `<!-- page -->
<style>.post-page .a{color:red}</style>
<div class="wrap">
  <section class="hero"><h1>히어로</h1><p>A &amp; B&nbsp;C &lt;tag&gt;</p></section>
  <div class="grid">
    <section><h2>하나</h2><p>첫 문단</p><span data-x-out>0</span></section>
    <section><h2>둘</h2><section><h3>안쪽</h3></section></section>
  </div>
</div>
<script type="module">const r = postPage.root; r.querySelector("[data-x-out]").textContent = "1"; r.querySelectorAll(".hero");</script>`;

const labels = (b: string) => listBlocks(b).map((x) => x.label);

// linkedom 직렬화는 브라우저와 두 군데 다르다: nbsp 를 &#160; 로, 빈 svg 를 <svg … /> 로 쓴다.
// 편집기는 브라우저 직렬화를 쓰므로 비교 전에 브라우저 꼴로 맞춘다.
const browserish = (html: string) =>
  html.replace(/&#160;/g, "&nbsp;").replace(/<svg([^>]*?)\s*\/>/g, "<svg$1></svg>");
const text = (html: string) => pageText(browserish(html));

test("블록은 조상에 section 이 없는 section", () => {
  const bs = listBlocks(SAMPLE);
  assert.deepEqual(bs.map((b) => b.label), ["히어로", "하나", "둘"]);
  assert.notEqual(bs[0].parentKey, bs[1].parentKey);
  assert.equal(bs[1].parentKey, bs[2].parentKey);
});

test("블록 없음 → 빈 목록", () => {
  assert.deepEqual(listBlocks("<!-- page -->\n<div><p>x</p></div>"), []);
});

test("이동은 같은 부모 안에서만", () => {
  assert.deepEqual(labels(moveBlock(SAMPLE, 2, -1)!), ["히어로", "둘", "하나"]);
  assert.equal(moveBlock(SAMPLE, 1, -1), null); // 부모가 다른 히어로 쪽으로는 못 감
  assert.equal(moveBlock(SAMPLE, 2, 1), null); // 끝
  assert.deepEqual(labels(moveBlockTo(SAMPLE, 1, 2)!), ["히어로", "둘", "하나"]);
  assert.equal(moveBlockTo(SAMPLE, 0, 2), null);
});

test("복제·삭제·교체", () => {
  assert.deepEqual(labels(duplicateBlock(SAMPLE, 1)), ["히어로", "하나", "하나", "둘"]);
  assert.deepEqual(labels(removeBlock(SAMPLE, 0)), ["하나", "둘"]);
  const r = replaceBlock(SAMPLE, 1, "<section><h2>새것</h2></section>");
  assert.deepEqual(labels(r), ["히어로", "새것", "둘"]);
  assert.throws(() => replaceBlock(SAMPLE, 1, "<div>x</div>"), /section/);
  assert.throws(() => replaceBlock(SAMPLE, 1, "<section></section><section></section>"), /section/);
});

test("엔티티 왕복 — 연산 뒤에도 글자가 같다", () => {
  const moved = moveBlock(moveBlock(SAMPLE, 2, -1)!, 1, 1)!;
  assert.equal(text(moved), pageText(SAMPLE));
  assert.match(blockHtml(moved, 0), /A &amp; B/);
});

test("잠금·해제 왕복 — 스크립트 type 보존, 편집 표시 제거", () => {
  const canvas = annotateForCanvas(SAMPLE);
  assert.match(canvas, /type="text\/post-page"/);
  assert.match(canvas, /data-edit-block="2"/);
  const back = cleanCanvasHtml(canvas.replace("<p>첫 문단</p>", '<p contenteditable="true" data-edit-text="">고친 문단</p>'));
  assert.match(back, /<script type="module">/);
  assert.doesNotMatch(back, /data-edit-|contenteditable|text\/post-page/);
  assert.match(back, /<p>고친 문단<\/p>/);
});

test("findBlockIndex — 위치가 바뀌어도 내용으로 찾는다", () => {
  const original = blockHtml(SAMPLE, 1);
  const moved = moveBlock(SAMPLE, 2, -1)!;
  assert.equal(findBlockIndex(moved, original, 1), 2);
  assert.equal(findBlockIndex(removeBlock(SAMPLE, 1), original, 1), -1);
});

test("스크립트 훅 추출과 빠진 훅", () => {
  const hooks = scriptHooks(SAMPLE);
  assert.deepEqual(hooks, [".hero", "[data-x-out]"]);
  const before = blockHtml(SAMPLE, 1);
  assert.deepEqual(missingHooks(before, "<section><h2>하나</h2></section>", hooks), ["[data-x-out]"]);
  assert.deepEqual(missingHooks(before, before, hooks), []);
});

test("editableTarget 훅 제외 — 스크립트가 채우는 자리·svg·빈 요소는 편집하지 않는다", () => {
  const html = annotateForCanvas(SAMPLE.replace("<p>첫 문단</p>", '<p>첫 문단</p><svg><text>그림</text></svg><p></p><p class="out" data-x-out>0</p>'));
  const doc = new DOMParser().parseFromString(`<!doctype html><html><body>${html}</body></html>`, "text/html");
  const hooks = scriptHooks(SAMPLE);
  const ps = Array.from(doc.querySelectorAll("p")) as Element[];
  const first = ps.find((p) => p.textContent === "첫 문단")!;
  assert.equal(editableTarget(first, hooks), first);
  assert.equal(editableTarget(doc.querySelector("text") as Element, hooks), null);
  assert.equal(editableTarget(ps.find((p) => p.textContent === "")!, hooks), null);
  assert.equal(editableTarget(doc.querySelector("p[data-x-out]") as Element, hooks), null);
});

test("견본 원고 왕복 — 블록 수·훅·평문 동일", () => {
  const dir = path.join(process.cwd(), "auto-drafts", "posts");
  const files = readdirSync(dir).filter((f) => f.endsWith(".html"));
  assert.ok(files.length > 0);
  for (const f of files) {
    const body = readFileSync(path.join(dir, f), "utf8").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    const round = cleanCanvasHtml(annotateForCanvas(body));
    assert.equal(listBlocks(round).length, listBlocks(body).length, f);
    assert.ok(listBlocks(body).length > 0, f);
    assert.deepEqual(scriptHooks(round), scriptHooks(body), f);
    assert.equal(text(round), pageText(body), f);
  }
});

test("inContext — 블록 HTML 을 원래 조상 래퍼로 감싼다(글 CSS 가 래퍼 기준이라)", () => {
  const html = inContext(SAMPLE, 1, "<section><h2>새것</h2></section>");
  assert.equal(html, '<div class="wrap"><div class="grid"><section><h2>새것</h2></section></div></div>');
  assert.equal(inContext(SAMPLE, 99, "<section></section>"), "<section></section>");
});

test("editableTarget — 훅·입력 요소를 품은 요소는 편집하지 않는다(지우면 인터랙션이 끊김)", () => {
  const body = `<!-- page --><section><h2>제목</h2><label class="ctrl">청크 크기<input type="range" data-rg-size><output data-rg-sizeout></output></label><p>그냥 <b>문단</b></p></section>
<script>postPage.root.querySelector("[data-rg-size]"); postPage.root.querySelector("[data-rg-sizeout]");</script>`;
  const doc = new DOMParser().parseFromString(`<!doctype html><html><body>${annotateForCanvas(body)}</body></html>`, "text/html");
  const hooks = scriptHooks(body);
  assert.equal(editableTarget(doc.querySelector("output") as Element, hooks), null);
  assert.equal(editableTarget(doc.querySelector("label") as Element, hooks), null);
  const p = doc.querySelector("p") as Element;
  assert.equal(editableTarget(doc.querySelector("b") as Element, hooks), p);
  // 훅이 없어도 입력 요소를 품으면 편집하지 않는다
  assert.equal(editableTarget(doc.querySelector("label") as Element, []), null);
});
