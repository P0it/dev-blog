// HTML 페이지 글의 코드 블록을 에디터처럼 그린다(POSTING.md 5-7).
//
// 원고에는 아래처럼만 쓴다. 색은 서버에서 Shiki(VS Code 와 같은 문법 엔진)가 칠한다.
//   <pre data-title="agent.py" data-hl="3,5-6"><code class="language-python">…</code></pre>
//   data-title  파일 이름 탭(없으면 언어 이름만)
//   data-hl     강조할 줄(1부터, 쉼표·범위)
//   data-start  첫 줄 번호(발췌한 코드라 10번째 줄부터 보여 줄 때)
// 라이트·다크 두 테마를 함께 칠해 두고, 사이트 테마에 따라 CSS 변수로 고른다(아래 STYLE).
// 코드 안의 ①~⑳ 은 해설 목록과 짝을 맞추는 표지라 둥근 배지로 바꾼다.
import { codeToHtml } from "shiki";

// 코드 블록 모양 — 코드가 있는 글에만 한 번 넣는다. 사이트 라이트/다크를 따라간다.
const STYLE = `<style data-pg-code>
.post-page .pg-code {
  --pgc-bg: #fbfbfc; --pgc-head: #f2f3f5; --pgc-line: var(--line-normal); --pgc-no: #a3a8b1;
  --pgc-hl: rgba(105, 197, 170, 0.14); --pgc-hl-bar: var(--mint-500);
  margin: 28px 0; border: 1px solid var(--pgc-line); border-radius: 12px; overflow: hidden;
  background: var(--pgc-bg); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
[data-theme="dark"] .post-page .pg-code {
  --pgc-bg: #22272e; --pgc-head: #1c2128; --pgc-line: rgba(255, 255, 255, 0.08); --pgc-no: #636e7b;
  --pgc-hl: rgba(105, 197, 170, 0.12);
}
.post-page .pg-code-head {
  display: flex; align-items: stretch; gap: 0; background: var(--pgc-head);
  border-bottom: 1px solid var(--pgc-line); font-family: var(--font-mono); font-size: 12px; min-height: 36px;
}
.post-page .pg-code-file {
  display: flex; align-items: center; padding: 0 16px; background: var(--pgc-bg); color: var(--fg-strong);
  border-right: 1px solid var(--pgc-line); box-shadow: inset 0 2px 0 var(--pgc-hl-bar); margin-bottom: -1px;
}
.post-page .pg-code-lang { display: flex; align-items: center; padding: 0 12px; color: var(--fg-alternative); }
.post-page .pg-code-copy {
  margin-left: auto; font: inherit; font-size: 12px; color: var(--fg-alternative); background: none; border: 0;
  padding: 0 14px; cursor: pointer;
}
.post-page .pg-code-copy:hover { color: var(--fg-strong); }
.post-page .pg-code pre {
  margin: 0; padding: 14px 0; overflow-x: auto; background: transparent !important;
  font-family: var(--font-mono); font-size: 13.5px; line-height: 1.75; tab-size: 4; font-variant-ligatures: none;
}
.post-page .pg-code pre code { font-family: inherit; font-size: inherit; background: none; padding: 0; }
.post-page .pg-code .line { display: inline-block; min-width: 100%; padding-right: 20px; box-sizing: border-box; }
.post-page .pg-code .line::before {
  content: attr(data-ln); display: inline-block; width: 3ch; margin: 0 16px 0 12px; text-align: right;
  color: var(--pgc-no); user-select: none;
}
.post-page .pg-code .line[data-hl] { background: var(--pgc-hl); box-shadow: inset 3px 0 0 var(--pgc-hl-bar); }
.post-page .pg-code pre, .post-page .pg-code pre span { color: var(--shiki-light); }
[data-theme="dark"] .post-page .pg-code pre, [data-theme="dark"] .post-page .pg-code pre span { color: var(--shiki-dark); }
/* 해설 표지 ①② — 코드 안 배지와 해설 목록(ol.pg-code-notes)이 같은 모양 */
.post-page .pg-code .pg-code-mark, .post-page ol.pg-code-notes > li::before {
  display: inline-grid; place-items: center; width: 1.45em; height: 1.45em; border-radius: 50%;
  background: var(--mint-600); color: #fff !important; font-family: var(--font-sans); font-size: 0.75em; font-weight: 700;
  vertical-align: 0.1em;
}
.post-page ol.pg-code-notes { list-style: none; counter-reset: pgc; padding: 0; margin: 4px 0 28px; }
.post-page ol.pg-code-notes > li { counter-increment: pgc; position: relative; padding-left: 2.1em; margin: 10px 0; line-height: 1.7; }
.post-page ol.pg-code-notes > li::before { content: counter(pgc); position: absolute; left: 0; top: 0.2em; font-size: 0.8em; }
</style>`;

const BLOCK = /<pre\b([^>]*)>\s*<code\b([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi;
const attr = (s: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i").exec(s)?.[1];
const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function lineSet(spec: string | undefined): Set<number> {
  const out = new Set<number>();
  for (const part of (spec || "").split(",")) {
    const [a, b] = part.trim().split("-").map(Number);
    if (!a) continue;
    for (let n = a; n <= (b || a); n++) out.add(n);
  }
  return out;
}

async function renderBlock(preAttrs: string, codeAttrs: string, raw: string): Promise<string> {
  const lang = /language-([\w+#-]+)/.exec(attr(codeAttrs, "class") || "")?.[1] || "text";
  const title = attr(preAttrs, "data-title");
  const hl = lineSet(attr(preAttrs, "data-hl"));
  const start = Number(attr(preAttrs, "data-start")) || 1;
  const code = decode(raw).replace(/^\n/, "").replace(/\n\s*$/, "");
  let html: string;
  try {
    html = await codeToHtml(code, {
      lang,
      themes: { light: "github-light", dark: "github-dark-dimmed" },
      defaultColor: false,
      transformers: [{
        line(node, n) {
          node.properties["data-ln"] = String(start + n - 1);
          if (hl.has(n)) node.properties["data-hl"] = "";
        },
      }],
    });
  } catch {
    // 모르는 언어면 색 없이 그대로 둔다
    html = `<pre class="shiki"><code>${code.split("\n").map((l, i) => `<span class="line" data-ln="${start + i}">${esc(l)}</span>`).join("\n")}</code></pre>`;
  }
  html = html.replace(/[①-⑳]/g, (m) => `<span class="pg-code-mark" aria-label="${m}">${m.charCodeAt(0) - 0x245f}</span>`);
  const label = lang === "text" ? "" : lang;
  return `<figure class="pg-code" data-lang="${esc(lang)}"><figcaption class="pg-code-head">` +
    `<span class="pg-code-file">${esc(title || label || "code")}</span>` +
    (title && label ? `<span class="pg-code-lang">${esc(label)}</span>` : "") +
    `<button class="pg-code-copy" type="button" data-pg-copy aria-label="코드 복사">복사</button></figcaption>${html}</figure>`;
}

/** 페이지 HTML 의 <pre><code> 를 에디터형 블록으로 바꾼다. <script>·<style> 안은 건드리지 않는다. */
export async function highlightPageCode(html: string): Promise<string> {
  if (!/<pre\b/i.test(html)) return html;
  const parts = html.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)/i);
  for (let i = 0; i < parts.length; i += 2) {
    const jobs: Promise<string>[] = [];
    parts[i].replace(BLOCK, (_m, p, c, raw) => { jobs.push(renderBlock(p, c, raw)); return _m; });
    if (!jobs.length) continue;
    const done = await Promise.all(jobs);
    let k = 0;
    parts[i] = parts[i].replace(BLOCK, () => done[k++]);
  }
  const out = parts.join("");
  if (!out.includes('class="pg-code"')) return out;
  // 페이지 표지 바로 뒤에 한 번만 넣는다(표지가 없으면 맨 앞)
  return /<!-- page -->/.test(out) ? out.replace(/<!-- page -->/, (m) => `${m}\n${STYLE}`) : `${STYLE}\n${out}`;
}
