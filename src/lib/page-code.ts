// HTML 페이지 글의 코드 블록을 에디터처럼 그린다(POSTING.md 5-7).
//
// 원고에는 아래처럼만 쓴다. 색은 서버에서 Shiki(VS Code 와 같은 문법 엔진)가 칠한다.
//   <pre data-title="agent.py" data-hl="3,5-6"><code class="language-python">…</code></pre>
//   data-title  파일 이름 탭(없으면 언어 이름만)
//   data-hl     강조할 줄(1부터, 쉼표·범위)
//   data-start  첫 줄 번호(발췌한 코드라 10번째 줄부터 보여 줄 때)
// 테마는 One Dark Pro 하나로, 사이트 라이트·다크와 무관하게 늘 어두운 에디터 창이다(2026-10-14 사용자 선택).
// 코드 안의 ①~⑳ 은 해설 목록과 짝을 맞추는 표지라 둥근 배지로 바꾼다.
import { codeToHtml } from "shiki";
import { parseFragment } from "parse5";

// 코드 블록 모양 — 코드가 있는 글에만 한 번 넣는다. 색은 globals.css 의 --code-* 토큰.
const STYLE = `<style data-pg-code>
.post-page .pg-code {
  margin: 28px 0; border: 1px solid var(--code-border); border-radius: 12px; overflow: hidden;
  background: var(--code-bg); box-shadow: var(--code-shadow); color: var(--code-fg);
}
.post-page .pg-code-head {
  display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 8px 0 84px;
  background: var(--code-dots), var(--code-head-bg); background-repeat: no-repeat;
  border-bottom: 1px solid var(--code-border); font-family: var(--font-mono); font-size: 12px;
}
.post-page .pg-code-file {
  display: flex; align-items: center; height: 26px; padding: 0 12px; border-radius: 6px;
  background: rgba(255, 255, 255, 0.07); color: var(--code-head-fg); white-space: nowrap;
}
.post-page .pg-code-lang { color: var(--code-line-no); }
.post-page .pg-code-copy {
  margin-left: auto; font: inherit; font-size: 12px; color: var(--code-head-fg); background: none; border: 0;
  padding: 4px 10px; border-radius: 6px; cursor: pointer;
}
.post-page .pg-code-copy:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
.post-page .pg-code pre {
  margin: 0; padding: 16px 0; overflow-x: auto; background: transparent !important;
  font-family: var(--font-mono); font-size: 13.5px; line-height: 1.75; tab-size: 4;
  /* 코드 글꼴이 != 를 ≠ 로 이어 그리면 처음 보는 사람이 그대로 옮겨 치다 막힌다 */
  font-variant-ligatures: none;
}
.post-page .pg-code pre code { font-family: inherit; font-size: inherit; background: none; padding: 0; color: inherit; }
/* One Dark Pro 는 주석·매개변수를 기울이는데, 한글은 기울임 글꼴이 없어 찌그러져 보인다 */
.post-page .pg-code pre span { font-style: normal !important; }
.post-page .pg-code .line { display: inline-block; min-width: 100%; padding-right: 20px; box-sizing: border-box; }
.post-page .pg-code .line::before {
  content: attr(data-ln); display: inline-block; width: 3ch; margin: 0 16px 0 12px; text-align: right;
  color: var(--code-line-no); user-select: none;
}
.post-page .pg-code .line[data-hl] { background: var(--code-hl); box-shadow: inset 3px 0 0 var(--code-hl-bar); }
@media (max-width: 640px) {
  .post-page .pg-code pre { font-size: 12.5px; }
}
/* 가로로 밀지 않고 줄을 접는다 — 처음엔 좁은 화면만 접었는데, 넓은 화면에서도 가로 스크롤이 거슬린다는 지적으로 모든 폭에 적용(2026-11-14).
   이어지는 줄은 그 줄의 코드 들여쓰기(--pg-i)보다 2칸 더 들여써서 구조가 무너져 보이지 않게 한다 */
@media all {
  .post-page .pg-code .line { --pg-hang: min(calc((var(--pg-i, 0) + 2) * 1ch), 16ch); position: relative; display: inline-block; vertical-align: top; width: 100%; min-width: 0; white-space: pre-wrap; overflow-wrap: anywhere; padding-left: calc(3ch + 28px + var(--pg-hang)); text-indent: calc(var(--pg-hang) * -1); }
  /* 번호를 글 흐름에서 빼야 긴 토큰이 번호만 남기고 다음 줄로 밀리지 않는다 */
  .post-page .pg-code .line::before { position: absolute; left: 0; top: 0; text-indent: 0; }
}
/* 해설 표지 ①② — 코드 안 배지와 해설 목록(ol.pg-code-notes)이 같은 모양 */
.post-page .pg-code .pg-code-mark, .post-page ol.pg-code-notes > li::before {
  display: inline-grid; place-items: center; width: 1.45em; height: 1.45em; border-radius: 50%;
  background: var(--mint-600); color: #fff !important; font-family: var(--font-sans); font-size: 0.75em; font-weight: 700;
  vertical-align: 0.1em;
  /* 좁은 화면의 .line 음수 text-indent 를 물려받으면 숫자가 줄번호 칸으로 밀려난다 */
  text-indent: 0;
}
.post-page ol.pg-code-notes { list-style: none; counter-reset: pgc; padding: 0; margin: 4px 0 28px; }
.post-page ol.pg-code-notes > li { counter-increment: pgc; position: relative; padding-left: 2.1em; margin: 10px 0; line-height: 1.7; }
.post-page ol.pg-code-notes > li::before { content: counter(pgc); position: absolute; left: 0; top: 0.2em; font-size: 0.8em; }
/* 코드 | 해설을 좌우로 두지 않는다 — 코드 아래에 해설(POSTING 5-7, 2026-11-14). 글마다 짠 grid 를 이기려고 !important.
   폭은 끝없이 넓히지 않는다: 코드 860px(한 줄 80칸 남짓), 해설은 한 단 760px — 넓으면 줄이 길어 읽기 힘들다(사용자 지적).
   글 열과 같은 왼쪽 선에 맞춘다 */
.post-page [data-pg-stack] { display: flex !important; flex-direction: column; align-items: stretch !important; gap: 18px !important; max-width: 860px !important; margin-left: 0 !important; margin-right: auto !important; }
.post-page [data-pg-stack] > :has(ol.pg-code-notes), .post-page [data-pg-stack] > ol.pg-code-notes { max-width: 760px !important; }
.post-page [data-pg-stack] > * { position: static !important; width: auto !important; max-width: none !important; min-width: 0; margin-left: 0 !important; margin-right: 0 !important; }
/* 원고에서 해설을 코드보다 앞에 적은 글도 해설이 맨 아래로 간다 */
.post-page [data-pg-stack] > :has(ol.pg-code-notes), .post-page [data-pg-stack] > ol.pg-code-notes { order: 1; }
.post-page [data-pg-stack] ol.pg-code-notes { margin-top: 6px; }
/* 코드 아래 터미널 칸(글마다 짠 pre)도 가로로 밀지 않고 접는다 */
.post-page [data-pg-stack] pre:not(.shiki) { white-space: pre-wrap !important; overflow-wrap: anywhere; overflow-x: hidden; }
</style>`;

const BLOCK = /<pre\b([^>]*)>\s*<code\b([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi;
const attr = (s: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i").exec(s)?.[1];
const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
/** 줄 앞 공백 칸 수. 접힌 줄을 코드 들여쓰기에 맞춰 내어 쓰는 데 쓴다(탭은 4칸, pre 의 tab-size 와 같다) */
const indentOf = (line: string) => {
  const lead = /^[ \t]*/.exec(line)![0];
  return lead.length + (lead.split("\t").length - 1) * 3;
};

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
  const lines = code.split("\n");
  let html: string;
  try {
    html = await codeToHtml(code, {
      lang,
      // 사이트 테마와 무관하게 늘 One Dark Pro(마크다운 글 코드 블록과 같은 모양, src/app/globals.css 의 --code-* 토큰)
      theme: "one-dark-pro",
      transformers: [{
        line(node, n) {
          node.properties["data-ln"] = String(start + n - 1);
          if (hl.has(n)) node.properties["data-hl"] = "";
          const indent = indentOf(lines[n - 1] ?? "");
          if (indent) node.properties.style = `--pg-i:${indent}`;
        },
      }],
    });
  } catch {
    // 모르는 언어면 색 없이 그대로 둔다
    html = `<pre class="shiki"><code>${lines.map((l, i) => `<span class="line" data-ln="${start + i}"${indentOf(l) ? ` style="--pg-i:${indentOf(l)}"` : ""}>${esc(l)}</span>`).join("\n")}</code></pre>`;
  }
  html = html.replace(/[①-⑳]/g, (m) => `<span class="pg-code-mark" aria-label="${m}">${m.charCodeAt(0) - 0x245f}</span>`);
  const label = lang === "text" ? "" : lang;
  return `<figure class="pg-code" data-lang="${esc(lang)}"><figcaption class="pg-code-head">` +
    `<span class="pg-code-file">${esc(title || label || "code")}</span>` +
    (title && label ? `<span class="pg-code-lang">${esc(label)}</span>` : "") +
    `<button class="pg-code-copy" type="button" data-pg-copy aria-label="코드 복사">복사</button></figcaption>${html}</figure>`;
}

type P5Node = {
  nodeName: string;
  tagName?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: P5Node[];
  content?: P5Node;
  parentNode?: P5Node | null;
  sourceCodeLocation?: { startTag?: { startOffset: number } } | null;
};
const hasClass = (n: P5Node, c: string) =>
  !!n.attrs?.some((a) => a.name === "class" && a.value.split(/\s+/).includes(c));

/**
 * 해설 목록(ol.pg-code-notes)과 그 코드 블록을 함께 담은 가장 가까운 칸에 data-pg-stack 을 단다.
 * 글마다 코드 | 해설을 좌우로 놓으면 코드 칸이 좁아져 가로 스크롤이 생겼다(2026-11-14 사용자 지적).
 * 원고 46편을 고치지 않고 이 칸을 위아래로 쌓는다(STYLE 의 [data-pg-stack]). HTML 을 다시 직렬화하지 않고
 * 시작 태그 위치에 속성만 끼워 넣어 원문을 그대로 둔다.
 */
function markCodeStacks(html: string): string {
  if (!html.includes("pg-code-notes")) return html;
  const doc = parseFragment(html, { sourceCodeLocationInfo: true }) as unknown as P5Node;
  const codeAncestors = new Set<P5Node>();
  const notes: P5Node[] = [];
  const walk = (n: P5Node) => {
    if (n.tagName === "figure" && hasClass(n, "pg-code")) {
      for (let p = n.parentNode; p; p = p.parentNode) codeAncestors.add(p);
    }
    if (n.tagName === "ol" && hasClass(n, "pg-code-notes")) notes.push(n);
    n.childNodes?.forEach(walk);
  };
  walk(doc);
  const marks = new Set<number>();
  for (const ol of notes) {
    for (let p = ol.parentNode; p && p !== doc; p = p.parentNode) {
      if (!codeAncestors.has(p)) continue;
      const at = p.sourceCodeLocation?.startTag?.startOffset;
      if (at != null && p.tagName) marks.add(at + 1 + p.tagName.length);
      break;
    }
  }
  let out = html;
  for (const at of [...marks].sort((a, b) => b - a)) out = `${out.slice(0, at)} data-pg-stack${out.slice(at)}`;
  return out;
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
  let out = parts.join("");
  if (!out.includes('class="pg-code"')) return out;
  out = markCodeStacks(out);
  // 페이지 표지 바로 뒤에 한 번만 넣는다(표지가 없으면 맨 앞)
  return /<!-- page -->/.test(out) ? out.replace(/<!-- page -->/, (m) => `${m}\n${STYLE}`) : `${STYLE}\n${out}`;
}
