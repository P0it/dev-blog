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
