import { test } from "node:test";
import assert from "node:assert/strict";
import { highlightPageCode } from "./page-code.ts";

test("highlightPageCode — pre/code 를 에디터형 블록으로, 파일 탭·줄 번호·강조 줄·표지 배지", async () => {
  const html = '<p>앞</p><pre data-title="agent.py" data-hl="2" data-start="10"><code class="language-python">def f(x):\n    return x &lt; 3  # ①\n</code></pre><p>뒤</p>';
  const full = await highlightPageCode(html);
  assert.equal(full.match(/<style data-pg-code>/g)?.length, 1);
  const out = full.replace(/<style data-pg-code>[\s\S]*?<\/style>\n/, "");
  assert.match(out, /<figure class="pg-code" data-lang="python">/);
  assert.match(out, /<span class="pg-code-file">agent\.py<\/span><span class="pg-code-lang">python<\/span>/);
  assert.match(out, /data-ln="10"/);
  assert.match(out, /data-ln="11" data-hl=""|data-hl="" data-ln="11"/);
  assert.match(out, /<span class="pg-code-mark" aria-label="①">1<\/span>/);
  assert.match(out, /one-dark-pro/); // 사이트 테마와 무관한 단일 에디터 테마
  assert.match(out, /^<p>앞<\/p>/);
  assert.match(out, /<p>뒤<\/p>$/);
});

test("highlightPageCode — <script> 안의 pre 문자열과 코드 없는 글은 그대로 둔다", async () => {
  const s = '<p>x</p><script>el.innerHTML = "<pre><code>a</code></pre>";</script>';
  assert.equal(await highlightPageCode(s), s);
  assert.equal(await highlightPageCode("<p>그림만</p>"), "<p>그림만</p>");
});

test("highlightPageCode — 모르는 언어는 색 없이 줄 번호만", async () => {
  const out = await highlightPageCode('<pre><code class="language-nope-lang">a\nb</code></pre>');
  assert.match(out, /data-ln="1">a<\/span>/);
});

test("highlightPageCode — 들여쓴 줄에만 들여쓰기 칸 수를 남긴다(모바일에서 접힌 줄 내어쓰기)", async () => {
  const html = '<pre><code class="language-python">def f(x):\n    return x\n\treturn y</code></pre>';
  const out = await highlightPageCode(html);
  assert.match(out, /data-ln="2"[^>]*--pg-i:4|--pg-i:4[^>]*data-ln="2"/);
  assert.match(out, /data-ln="3"[^>]*--pg-i:4|--pg-i:4[^>]*data-ln="3"/);
  assert.doesNotMatch(out, /data-ln="1"[^>]*--pg-i|--pg-i[^>]*data-ln="1"/);
});

test("highlightPageCode — 코드와 해설 목록을 함께 담은 가장 가까운 칸에만 data-pg-stack 을 단다", async () => {
  const html = '<section><div class="wrap"><p>글</p><div class="cp"><div class="cp-code"><pre data-title="a.py"><code class="language-python">x = 1</code></pre></div>' +
    '<div class="side"><ol class="pg-code-notes"><li>①</li></ol></div></div></div></section><svg viewBox="0 0 10 10"><rect width="1" height="1"/></svg>';
  const out = (await highlightPageCode(html)).replace(/<style data-pg-code>[\s\S]*?<\/style>\n/, "");
  assert.match(out, /<div data-pg-stack class="cp">/);
  assert.equal(out.match(/data-pg-stack/g)?.length, 1);
  assert.match(out, /viewBox="0 0 10 10"/); // 원문을 다시 직렬화하지 않는다
});
