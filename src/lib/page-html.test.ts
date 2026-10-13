import { test } from "node:test";
import assert from "node:assert/strict";
import { isPageBody, pageText, lockScripts } from "./page-html.ts";

test("첫 줄 표시가 있어야 페이지 글", () => {
  assert.equal(isPageBody("<!-- page -->\n<section>hi</section>"), true);
  assert.equal(isPageBody("\n  <!-- page -->\n<div/>"), true);
  assert.equal(isPageBody("> 요약\n\n## 제목"), false);
  assert.equal(isPageBody("<u>밑줄</u> 마크다운"), false);
  assert.equal(isPageBody(null), false);
});

test("평문은 style·script·svg·태그를 빼고 엔티티를 푼다", () => {
  const html = `<!-- page --><style>.a{color:red}</style><h1>제목 &amp; 부제</h1>
<svg><text>그림</text></svg><p>본문&nbsp;글</p><script>x()</script>`;
  assert.equal(pageText(html), "제목 & 부제 본문 글");
});

test("lockScripts — 원래 type 은 편집기 전용 속성에 보관하고, 글이 쓰는 data-type 은 건드리지 않는다", () => {
  const html = '<script data-type="cfg">a()</script><script type="module">b()</script>';
  const locked = lockScripts(html);
  assert.equal(
    locked,
    '<script type="text/post-page" data-type="cfg">a()</script><script type="text/post-page" data-pve-type="module">b()</script>',
  );
});
