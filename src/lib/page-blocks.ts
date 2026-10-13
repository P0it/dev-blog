// HTML 페이지 글의 블록 편집(어드민 비주얼 편집기용). 규약은 POSTING.md 5장.
// 블록 = 조상 중에 section 이 없는 section. 이동은 같은 부모 안에서만 한다 —
// 2단 그리드 같은 래퍼 구조를 깨지 않기 위해서다.
//
// 모든 함수는 본문 문자열(<!-- page --> 포함)을 받아 새 문자열을 돌려준다.
// DOMParser 로 만든 문서는 스크립트가 돌지 않으므로, 글 스크립트가 바꾼 DOM 이
// 저장본에 섞일 일이 없다.

export const INERT_SCRIPT = "text/post-page";
export const TEXT_TAGS = "h1,h2,h3,h4,h5,h6,p,li,figcaption,td,th,blockquote,button,dt,dd,label,summary";

function parse(body: string): HTMLElement {
  // <body> 를 명시해야 맨 앞 <style> 이 head 로 옮겨지지 않는다.
  const doc = new DOMParser().parseFromString(`<!doctype html><html><head></head><body>${body}</body></html>`, "text/html");
  return doc.body;
}

const out = (root: HTMLElement) => root.innerHTML;

function blocks(root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll("section")).filter((s) => !s.parentElement?.closest("section"));
}

export type BlockInfo = { index: number; label: string; parentKey: number };

export function listBlocks(body: string): BlockInfo[] {
  const bs = blocks(parse(body));
  const parents: (Element | null)[] = [];
  return bs.map((el, index) => {
    const p = el.parentElement;
    let parentKey = parents.indexOf(p);
    if (parentKey < 0) parentKey = parents.push(p) - 1;
    const h = el.querySelector("h1,h2,h3,h4");
    const text = (h?.textContent ?? "").replace(/\s+/g, " ").trim();
    return { index, label: text ? text.slice(0, 40) : `블록 ${index + 1}`, parentKey };
  });
}

function at(root: HTMLElement, index: number): Element {
  const el = blocks(root)[index];
  if (!el) throw new Error(`블록 ${index} 이 없습니다`);
  return el;
}

export function blockHtml(body: string, index: number): string {
  return at(parse(body), index).outerHTML;
}

export function moveBlockTo(body: string, from: number, to: number): string | null {
  const root = parse(body);
  const bs = blocks(root);
  const el = bs[from], target = bs[to];
  if (!el || !target || el.parentElement !== target.parentElement) return null;
  if (from === to) return body;
  if (from < to) target.after(el);
  else target.before(el);
  return out(root);
}

export function moveBlock(body: string, index: number, dir: -1 | 1): string | null {
  return moveBlockTo(body, index, index + dir);
}

export function duplicateBlock(body: string, index: number): string {
  const root = parse(body);
  const el = at(root, index);
  el.after(el.cloneNode(true));
  return out(root);
}

export function removeBlock(body: string, index: number): string {
  const root = parse(body);
  at(root, index).remove();
  return out(root);
}

export function replaceBlock(body: string, index: number, html: string): string {
  const frag = parse(html);
  const els = Array.from(frag.children);
  if (els.length !== 1 || els[0].tagName.toLowerCase() !== "section") {
    throw new Error("블록 HTML 은 <section> 하나여야 합니다");
  }
  const root = parse(body);
  const el = at(root, index);
  el.replaceWith(root.ownerDocument.importNode(els[0], true));
  return out(root);
}

// AI 결과를 적용할 블록 찾기 — 요청 뒤에 블록이 옮겨졌을 수 있어 내용으로 찾는다.
export function findBlockIndex(body: string, html: string, hint: number): number {
  const all = blocks(parse(body)).map((b) => b.outerHTML);
  if (all[hint] === html) return hint;
  return all.indexOf(html);
}

// 블록 HTML 을 그 블록의 원래 조상 래퍼(빈 껍데기)로 감싼다. 글 CSS 가 `.post-page .sa p` 처럼
// 래퍼 기준으로 걸려 있어, section 만 떼어 그리면 실제 모양과 달라진다(AI 비교 창용).
export function inContext(body: string, index: number, html: string): string {
  const el = blocks(parse(body))[index];
  if (!el) return html;
  let out = html;
  for (let p = el.parentElement; p && p.tagName.toLowerCase() !== "body"; p = p.parentElement) {
    const shell = p.cloneNode(false) as Element;
    const tag = shell.outerHTML;
    const close = tag.lastIndexOf("</");
    out = close < 0 ? out : tag.slice(0, close) + out + tag.slice(close);
  }
  return out;
}

// 캔버스용: 스크립트를 잠그고(원래 type 은 data-type 에 보관) 블록에 번호를 붙인다.
export function annotateForCanvas(body: string): string {
  const root = parse(body);
  root.querySelectorAll("script").forEach((s) => {
    const type = s.getAttribute("type");
    if (type) s.setAttribute("data-type", type);
    s.setAttribute("type", INERT_SCRIPT);
  });
  blocks(root).forEach((el, i) => el.setAttribute("data-edit-block", String(i)));
  return out(root);
}

// 캔버스 DOM → 저장 본문. annotateForCanvas 와 글자 편집 표시를 걷어낸다.
export function cleanCanvasHtml(html: string): string {
  const root = parse(html);
  root.querySelectorAll(`script[type="${INERT_SCRIPT}"]`).forEach((s) => {
    const type = s.getAttribute("data-type");
    s.removeAttribute("data-type");
    if (type) s.setAttribute("type", type);
    else s.removeAttribute("type");
  });
  root.querySelectorAll("[data-edit-block]").forEach((el) => el.removeAttribute("data-edit-block"));
  root.querySelectorAll("[data-edit-text]").forEach((el) => {
    el.removeAttribute("data-edit-text");
    el.removeAttribute("contenteditable");
  });
  return out(root);
}

function safeQuery(root: ParentNode, sel: string): boolean {
  try {
    return !!root.querySelector(sel);
  } catch {
    return false;
  }
}

// 글 스크립트가 찾아 쓰는 요소의 선택자(data-* 속성·클래스·id). 본문에 실제로 있는 것만.
export function scriptHooks(body: string): string[] {
  const root = parse(body);
  const text = Array.from(root.querySelectorAll("script")).map((s) => s.textContent ?? "").join("\n");
  const found = new Set<string>();
  for (const m of text.matchAll(/\bdata-[a-z0-9-]+/g)) found.add(`[${m[0]}]`);
  for (const m of text.matchAll(/\bdataset\.([a-zA-Z0-9]+)/g)) {
    found.add(`[data-${m[1].replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}]`);
  }
  for (const m of text.matchAll(/getElementById\(\s*["'`]([\w-]+)["'`]/g)) found.add(`#${m[1]}`);
  for (const m of text.matchAll(/["'`]([^"'`\n]*)["'`]/g)) {
    for (const c of m[1].matchAll(/(?:^|[^\w-])([.#])([a-zA-Z_][\w-]*)/g)) found.add(c[1] + c[2]);
  }
  return Array.from(found).filter((sel) => safeQuery(root, sel)).sort();
}

export function missingHooks(before: string, after: string, hooks: string[]): string[] {
  const a = parse(before), b = parse(after);
  return hooks.filter((h) => safeQuery(a, h) && !safeQuery(b, h));
}

export function isHookElement(el: Element, hooks: string[]): boolean {
  return hooks.some((h) => {
    try {
      return el.matches(h);
    } catch {
      return false;
    }
  });
}

// 캔버스에서 클릭한 곳이 글자 편집 대상이면 그 요소, 아니면 null.
export function editableTarget(start: Element, hooks: string[]): Element | null {
  if (start.closest("svg")) return null;
  const el = start.closest(TEXT_TAGS);
  if (!el || !el.closest("[data-edit-block]")) return null;
  if (!(el.textContent ?? "").trim()) return null;
  if (isHookElement(el, hooks)) return null;
  return el;
}
