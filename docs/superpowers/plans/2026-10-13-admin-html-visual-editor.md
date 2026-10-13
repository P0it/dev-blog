# 어드민 HTML 비주얼 편집기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HTML 페이지 글(`<!-- page -->`)을 어드민에서 블록(최상위 section) 단위로 화면에서 고치고(글자·순서·복제·삭제·HTML), 블록 하나를 로컬 워커 AI 에게 다시 쓰게 한다.

**Architecture:** 본문 문자열이 유일한 진실이다. `src/lib/page-blocks.ts` 의 순수 함수가 문자열 → DOMParser(스크립트 비실행) → 조작 → 문자열로 블록 연산을 한다. 편집 캔버스는 스크립트를 잠근 HTML 을 그리고, 글자 수정 후엔 캔버스 DOM 을 직렬화·정리해 되돌린다. 블록 AI 는 `ai_jobs` 에 `block_revise` 행을 넣고 워커가 `result_html` 에만 결과를 쓴다(`posts` 미변경). 편집기가 폴링해 비교 후 수락한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase, `@dnd-kit/sortable`(기존), `linkedom`(신규 dev), `node --test`, Playwright(기존).

**Spec:** `docs/superpowers/specs/2026-10-13-admin-html-visual-editor-design.md`

## Global Constraints

- 블록 = 조상 중에 `section` 이 없는 `section`. 이동은 같은 부모 안의 형제 블록끼리만.
- 편집하지 않았으면 원래 본문 문자열을 그대로 저장한다(편집기는 실제 변경 때만 `onChange` 를 부른다).
- `<style>`·`<script>` 는 편집 대상이 아니며 저장본에 그대로 남는다. 캔버스에서 스크립트는 절대 실행되지 않는다.
- 워커의 `block_revise` 는 `posts` 를 쓰지 않는다. 결과는 `ai_jobs.result_html` 에만.
- 마크다운 글의 편집기 동작은 바꾸지 않는다.
- 커밋 메시지에 Co-Authored-By·AI attribution 금지(CLAUDE.md). 기능 단위로 검증 후 커밋·푸시(`main` 직접).
- 마이그레이션은 Supabase Dashboard → SQL Editor 에서 수동 실행하는 레포 관례를 따른다.

## Review Focus

1. 텍스트에 `&`, `<`, `&nbsp;` 가 든 문단을 고친 뒤 저장 → 엔티티가 깨지지 않고 공개 화면에 같은 글자로 보여야 한다. (Task 1 테스트 `엔티티 왕복`)
2. 스크립트가 글자를 채우는 요소(`[data-tp-blank]` 등)를 클릭 → 편집이 시작되지 않아야 한다. (Task 1 테스트 `editableTarget 훅 제외`)
3. 블록 AI 요청 뒤 결과가 오기 전에 다른 블록을 옮김 → 수락 시 원래 그 블록이 바뀌어야 하고, 원래 블록이 사라졌으면 적용을 거부해야 한다. (Task 1 테스트 `findBlockIndex`)
4. 캔버스를 그리고 직렬화하는 과정에서 `<script type="module">` 같은 원래 type 이 보존돼야 한다. (Task 1 테스트 `잠금·해제 왕복`)
5. 블록이 없는 HTML 글(섹션 없이 div 만) → 편집기가 깨지지 않고 원본 HTML textarea 로 떨어져야 한다. (Task 1 테스트 `블록 없음` + Task 3 분기)

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/lib/page-blocks.ts` (신규) | 블록 모델 순수 함수: 목록·이동·복제·삭제·교체·캔버스 주석/정리·스크립트 훅·편집 가능 판정 |
| `src/lib/page-blocks.test.ts` (신규) | 위 함수 단위 테스트 (linkedom DOMParser) |
| `src/components/admin/PageVisualEditor.tsx` (신규) | 편집/미리보기 탭, 블록 목록(dnd), 캔버스, 블록 툴바, 글자 수정, 되돌리기, HTML 보기, 블록 AI 흐름 |
| `src/components/admin/BlockAiCompare.tsx` (신규) | AI 결과 전/후 비교·훅 경고·수락/거절 모달 |
| `src/components/admin/PostEditor.tsx` (수정) | `isPageBody` 면 메타 영역 + `PageVisualEditor` 레이아웃, 페이지 글은 상단 "AI 개선" 숨김 |
| `src/app/admin/editor/block-actions.ts` (신규) | 서버 액션 `requestBlockRevise` / `getBlockJob` / `cancelBlockJob` |
| `db/migrations/0016_ai_jobs_block_revise.sql` (신규) | type 제약에 `block_revise`, 컬럼 `block_html`·`result_html` |
| `scripts/ai-worker.mjs` (수정) | `block_revise` 분기·프롬프트, `result_html` 저장 |
| `src/lib/queries.ts` (수정) | 글 목록 AI 상태에서 `block_revise` 제외 |
| `POSTING.md`, `docs/ai-worker-setup.md` (수정) | 규약·워커 문서 |

---

### Task 1: 블록 모델 순수 함수

**Files:**
- Create: `src/lib/page-blocks.ts`
- Test: `src/lib/page-blocks.test.ts`
- Modify: `package.json` (devDependency `linkedom`)

**Interfaces:**
- Consumes: 없음 (전역 `DOMParser` — 브라우저 기본, 테스트에선 linkedom 주입)
- Produces (모두 `body: string` = `<!-- page -->` 포함 본문):
  - `type BlockInfo = { index: number; label: string; parentKey: number }`
  - `listBlocks(body: string): BlockInfo[]`
  - `blockHtml(body: string, index: number): string`
  - `moveBlock(body: string, index: number, dir: -1 | 1): string | null`
  - `moveBlockTo(body: string, from: number, to: number): string | null`
  - `duplicateBlock(body: string, index: number): string`
  - `removeBlock(body: string, index: number): string`
  - `replaceBlock(body: string, index: number, html: string): string` (section 하나가 아니면 throw)
  - `findBlockIndex(body: string, html: string, hint: number): number` (없으면 -1)
  - `annotateForCanvas(body: string): string` / `cleanCanvasHtml(html: string): string`
  - `scriptHooks(body: string): string[]`, `missingHooks(before: string, after: string, hooks: string[]): string[]`
  - `isHookElement(el: Element, hooks: string[]): boolean`, `editableTarget(start: Element, hooks: string[]): Element | null`
  - 상수 `TEXT_TAGS`, `INERT_SCRIPT = "text/post-page"`

- [ ] **Step 1: linkedom 설치**

Run: `npm i -D linkedom`
Expected: `package.json` devDependencies 에 `linkedom` 추가.

- [ ] **Step 2: 실패하는 테스트 작성** — `src/lib/page-blocks.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { DOMParser } from "linkedom";
import { pageText } from "./page-html.ts";
import {
  listBlocks, blockHtml, moveBlock, moveBlockTo, duplicateBlock, removeBlock,
  replaceBlock, findBlockIndex, annotateForCanvas, cleanCanvasHtml,
  scriptHooks, missingHooks, editableTarget,
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
  assert.equal(moveBlock(SAMPLE, 2, 1), null);  // 끝
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
  assert.equal(pageText(moved), pageText(SAMPLE));
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
    assert.equal(pageText(round), pageText(body), f);
  }
});
```

- [ ] **Step 3: 실패 확인**

Run: `npm test`
Expected: `page-blocks.test.ts` 가 `Cannot find module ... page-blocks.ts` 로 FAIL.

- [ ] **Step 4: 구현** — `src/lib/page-blocks.ts`

```ts
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

// 캔버스용: 스크립트를 잠그고(type 보존은 data-type) 블록에 번호를 붙인다.
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
```

- [ ] **Step 5: 통과 확인**

Run: `npm test`
Expected: 기존 테스트 포함 전부 PASS. linkedom 이 `closest`/`matches`/`importNode` 중 하나를 지원하지 않아 실패하면, 구현을 바꾸지 말고 테스트 쪽에서 같은 API 를 가진 `happy-dom` 으로 교체해 재확인한다(브라우저 표준 API 만 쓰는 것이 원칙).

- [ ] **Step 6: 타입체크**

Run: `npx tsc --noEmit`
Expected: 오류 없음. `linkedom` 타입 문제면 테스트 파일의 import 를 `// @ts-expect-error` 없이 `as any` 캐스팅으로 해결한다.

- [ ] **Step 7: 커밋**

```bash
git add package.json package-lock.json src/lib/page-blocks.ts src/lib/page-blocks.test.ts
git commit -m "HTML 페이지 글 블록 모델: 최상위 section 목록·같은 부모 안 이동·복제·삭제·교체, 캔버스용 스크립트 잠금/해제, 스크립트 훅 추출·빠진 훅 검사, 글자 편집 대상 판정과 단위 테스트(견본 3편 왕복)"
git push
```

---

### Task 2: 블록 AI 백엔드 (마이그레이션·서버 액션·워커)

**Files:**
- Create: `db/migrations/0016_ai_jobs_block_revise.sql`
- Create: `src/app/admin/editor/block-actions.ts`
- Modify: `scripts/ai-worker.mjs` (`processJob`, 프롬프트 함수 추가)
- Modify: `src/lib/queries.ts:767-772` (글 목록 AI 상태 쿼리)

**Interfaces:**
- Consumes: 없음
- Produces:
  - `requestBlockRevise(input: { slug: string; blockHtml: string; instruction: string }): Promise<{ id: number }>`
  - `type BlockJob = { status: "pending" | "processing" | "done" | "error"; resultHtml: string | null; message: string | null }`
  - `getBlockJob(id: number): Promise<BlockJob>`
  - `cancelBlockJob(id: number): Promise<void>`

- [ ] **Step 1: 마이그레이션 작성** — `db/migrations/0016_ai_jobs_block_revise.sql`

```sql
-- 어드민 비주얼 편집기의 블록 단위 AI 수정
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run
--
-- block_revise 는 글 전체가 아니라 HTML 페이지 글의 section 하나를 다시 쓴다.
-- 워커는 결과를 posts 에 쓰지 않고 result_html 에만 담는다. 편집기에 저장 안 된
-- 변경이 있을 수 있어서, 수락 여부는 편집기가 정한다.

alter table ai_jobs drop constraint if exists ai_jobs_type_check;
alter table ai_jobs
  add constraint ai_jobs_type_check
  check (type in ('draft_from_url', 'revise', 'block_revise'));

alter table ai_jobs add column if not exists block_html text;   -- 입력 블록
alter table ai_jobs add column if not exists result_html text;  -- 결과 블록
```

- [ ] **Step 2: 마이그레이션 적용 확인**

사용자에게 SQL Editor 실행을 요청한다(또는 Supabase MCP 가 인증돼 있으면 그걸로 실행). 적용 확인:

Run: `node --env-file=.env.local -e "import('@supabase/supabase-js').then(async({createClient})=>{const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY);const r=await sb.from('ai_jobs').select('id,block_html,result_html').limit(1);console.log(r.error?.message??'ok')})"`
Expected: `ok` (컬럼이 없으면 `column ai_jobs.block_html does not exist`).

- [ ] **Step 3: 서버 액션** — `src/app/admin/editor/block-actions.ts`

```ts
"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

// 어드민 비주얼 편집기의 블록 AI 수정. 로컬 워커(npm run ai:worker)가 처리하고
// 결과는 ai_jobs.result_html 에만 남는다 — posts 는 편집기가 수락할 때만 바뀐다.

async function guard() {
  if (!(await isAdmin())) throw new Error("unauthorized");
}

export type BlockJob = {
  status: "pending" | "processing" | "done" | "error";
  resultHtml: string | null;
  message: string | null;
};

export async function requestBlockRevise(input: {
  slug: string;
  blockHtml: string;
  instruction: string;
}): Promise<{ id: number }> {
  await guard();
  const instruction = input.instruction.trim();
  if (!input.slug) throw new Error("저장된 글에서만 쓸 수 있습니다");
  if (!instruction) throw new Error("요청 내용을 적어 주세요");
  if (!/^\s*<section[\s>]/i.test(input.blockHtml)) throw new Error("블록 HTML 이 section 이 아닙니다");

  const { data, error } = await supabaseServer()
    .from("ai_jobs")
    .insert({
      type: "block_revise",
      post_slug: input.slug,
      instruction,
      block_html: input.blockHtml,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id as number };
}

export async function getBlockJob(id: number): Promise<BlockJob> {
  await guard();
  const { data, error } = await supabaseServer()
    .from("ai_jobs")
    .select("status,result,result_html")
    .eq("id", id)
    .eq("type", "block_revise")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("작업을 찾을 수 없습니다");
  return {
    status: data.status as BlockJob["status"],
    resultHtml: data.result_html ?? null,
    message: data.result ?? null,
  };
}

// 대기 중일 때만 취소한다. 이미 워커가 잡았으면 끝날 때까지 둔다.
export async function cancelBlockJob(id: number): Promise<void> {
  await guard();
  const { error } = await supabaseServer()
    .from("ai_jobs")
    .update({ status: "error", result: "취소", finished_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw error;
}
```

- [ ] **Step 4: 워커 — 프롬프트 함수 추가** (`scripts/ai-worker.mjs`, `revisePrompt` 아래)

```js
// POSTING.md 에서 블록 수정에 필요한 절만: 2-4 퇴고 점검표, 5장 HTML 페이지 글.
function postingSection(startHeading, endHeading) {
  const s = POSTING.indexOf(startHeading);
  if (s < 0) return "";
  const e = endHeading ? POSTING.indexOf(endHeading, s + startHeading.length) : -1;
  return POSTING.slice(s, e < 0 ? undefined : e);
}

function blockRevisePrompt(job) {
  return `당신은 한국어 기술 블로그의 편집자입니다. HTML 페이지 글에서 <section> 블록 하나만 고칩니다.

[문체 규약 — POSTING.md 발췌]
${postingSection("## 2-4.", "## 3.")}
${postingSection("## 5. HTML 페이지 글")}

[지킬 것]
- 결과는 <section> 요소 하나입니다. 블록 밖 내용은 만들지 않습니다.
- 원래 블록에 있는 class·id·data-* 속성은 요청이 따로 말하지 않는 한 그대로 둡니다.
  글의 스크립트가 이 속성으로 요소를 찾기 때문에, 바뀌면 인터랙션이 끊어집니다.
- <style>·<script> 는 넣지 않습니다. 스타일은 기존 클래스를 씁니다.
- AI·LLM 업계 용어는 영어·음차로 둡니다(청크·리랭킹 등).
- 요청에 없는 사실은 만들지 않습니다.

[요청]
${job.instruction ?? ""}

[원래 블록]
${job.block_html ?? ""}

결과는 다른 텍스트 없이 JSON 객체 하나만 출력하세요:
{"html":"<section ...>...</section>"}`;
}
```

- [ ] **Step 5: 워커 — `processJob` 분기**

`processJob` 의 `try {` 바로 다음, `let prompt;` 앞에 넣는다:

```js
    if (job.type === "block_revise") {
      if (!job.block_html) throw new Error("block_html 누락");
      const parsed = extractJson(await callClaude(blockRevisePrompt(job)));
      if (typeof parsed.html !== "string" || !/^\s*<section[\s>]/i.test(parsed.html)) {
        throw new Error("결과가 <section> HTML 이 아님");
      }
      await sb
        .from("ai_jobs")
        .update({ status: "done", finished_at: nowIso(), result_html: parsed.html, result: "블록 수정 완료" })
        .eq("id", job.id);
      console.log(`✓ job#${job.id} done (block)`);
      return;
    }
```

`extractJson` 은 첫 `{` ~ 마지막 `}` 를 잘라 파싱하므로 HTML 안의 중괄호에도 동작한다.

- [ ] **Step 6: 글 목록 AI 상태에서 블록 작업 제외** — `src/lib/queries.ts` `getAllPostsForAdmin` 의 ai_jobs 쿼리

```ts
    const { data: jobs, error: jErr } = await sb
      .from("ai_jobs")
      .select("post_slug,status,created_at")
      .neq("type", "block_revise")
      .order("created_at", { ascending: false });
```

- [ ] **Step 7: 타입체크·빌드**

Run: `npx tsc --noEmit && node --check scripts/ai-worker.mjs`
Expected: 오류 없음.

- [ ] **Step 8: 실제 작업 1건으로 워커 확인** (Step 2 마이그레이션 적용 후)

임시 스크립트(스크래치패드)로 기존 draft 글 하나에 `block_revise` 행을 넣고 워커를 1회 실행한다.

```bash
node --env-file=.env.local -e "import('@supabase/supabase-js').then(async({createClient})=>{const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY);const {data:p}=await sb.from('posts').select('slug,updated_at').eq('status','draft').limit(1).single();const r=await sb.from('ai_jobs').insert({type:'block_revise',post_slug:p.slug,instruction:'첫 문단을 한 문장 더 짧게',block_html:'<section class=\"x\" data-k><h2>제목</h2><p>첫 문단입니다. 길게 늘어진 설명이 이어집니다.</p></section>',status:'pending'}).select('id').single();console.log(p.slug,p.updated_at,r.data.id)})"
npm run ai:worker
```

그 뒤 해당 job 의 `status='done'`, `result_html` 에 `<section class="x" data-k>` 가 남아 있는지, 그리고 그 글의 `posts.updated_at` 이 바뀌지 않았는지 조회해 확인한다. 확인 후 테스트 행은 삭제한다.

- [ ] **Step 9: 커밋**

```bash
git add db/migrations/0016_ai_jobs_block_revise.sql src/app/admin/editor/block-actions.ts scripts/ai-worker.mjs src/lib/queries.ts
git commit -m "블록 단위 AI 수정 백엔드: ai_jobs 에 block_revise 와 block_html·result_html, 요청·조회·취소 서버 액션, 워커는 section 하나만 다시 써 result_html 에만 담고 posts 는 건드리지 않음, 글 목록 AI 상태에서 블록 작업 제외"
git push
```

---

### Task 3: 비주얼 편집기 화면 (AI 제외)

**Files:**
- Create: `src/components/admin/PageVisualEditor.tsx`
- Modify: `src/components/admin/PostEditor.tsx`

**Interfaces:**
- Consumes: Task 1 의 `listBlocks, blockHtml, moveBlock, moveBlockTo, duplicateBlock, removeBlock, replaceBlock, annotateForCanvas, cleanCanvasHtml, scriptHooks, editableTarget`; `PageBody` (`src/components/post/PageBody.tsx`)
- Produces: `PageVisualEditor({ value, onChange, slug }: { value: string; onChange: (next: string) => void; slug: string | null })` — Task 4 가 이 파일에 AI 흐름을 더한다. 내부 `commit(next: string)` 은 되돌리기 스택에 쌓고 `onChange` 를 부른다.

- [ ] **Step 1: `PageVisualEditor.tsx` 작성**

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PageBody } from "@/components/post/PageBody";
import { Button } from "@/components/ui/Button";
import {
  listBlocks, blockHtml, moveBlock, moveBlockTo, duplicateBlock, removeBlock,
  replaceBlock, annotateForCanvas, cleanCanvasHtml, scriptHooks, editableTarget,
  type BlockInfo,
} from "@/lib/page-blocks";

// HTML 페이지 글 비주얼 편집기. 설계: docs/superpowers/specs/2026-10-13-admin-html-visual-editor-design.md
// 본문 문자열(value)이 유일한 진실이다. 편집 탭은 스크립트를 잠근 HTML 을 그리고
// 글자를 고치면 캔버스 DOM 을 직렬화·정리해 되돌린다. 실행 미리보기 탭만 스크립트를 돌린다.

type Toolbar = { index: number; top: number; left: number };

export function PageVisualEditor({
  value,
  onChange,
  slug,
}: {
  value: string;
  onChange: (next: string) => void;
  slug: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [toolbar, setToolbar] = useState<Toolbar | null>(null);
  const [htmlEdit, setHtmlEdit] = useState<{ index: number; text: string; error?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const history = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });

  // DOMParser 는 브라우저에만 있다 — 마운트 전엔 계산하지 않는다.
  const blocks: BlockInfo[] = useMemo(() => (mounted ? listBlocks(value) : []), [mounted, value]);
  const hooks = useMemo(() => (mounted ? scriptHooks(value) : []), [mounted, value]);
  const canvasHtml = useMemo(() => (mounted ? annotateForCanvas(value) : ""), [mounted, value]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const commit = useCallback(
    (next: string | null, failMsg?: string) => {
      if (next === null) {
        if (failMsg) setNotice(failMsg);
        return;
      }
      if (next === value) return;
      history.current.past.push(value);
      history.current.future = [];
      onChange(next);
    },
    [value, onChange],
  );

  const undo = useCallback(() => {
    const prev = history.current.past.pop();
    if (prev === undefined) return;
    history.current.future.push(value);
    onChange(prev);
  }, [value, onChange]);

  const redo = useCallback(() => {
    const next = history.current.future.pop();
    if (next === undefined) return;
    history.current.past.push(value);
    onChange(next);
  }, [value, onChange]);

  // 되돌리기 — 글자 편집 중(브라우저 기본 되돌리기)이나 입력칸에선 가로채지 않는다.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      const a = document.activeElement as HTMLElement | null;
      if (a && (a.isContentEditable || a.tagName === "INPUT" || a.tagName === "TEXTAREA")) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, redo]);

  // 글자 편집 확정 — 포커스가 빠질 때 캔버스 전체를 직렬화한다.
  const onFocusOut = (e: React.FocusEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (!el.hasAttribute("data-edit-text")) return;
    el.removeAttribute("contenteditable");
    el.removeAttribute("data-edit-text");
    if (canvasRef.current) commit(cleanCanvasHtml(canvasRef.current.innerHTML));
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const start = e.target as Element;
    if (start.closest("[data-edit-text]")) return;
    // 캔버스 안 링크·버튼·폼은 동작하지 않게 한다.
    if (start.closest("a,button,input,select,label,summary")) e.preventDefault();
    const el = editableTarget(start, hooks) as HTMLElement | null;
    if (!el) return;
    el.setAttribute("contenteditable", "true");
    el.setAttribute("data-edit-text", "");
    el.focus();
  };

  const onCanvasKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (!el.hasAttribute("data-edit-text")) return;
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      el.blur();
    }
  };

  // 붙여넣기는 순수 텍스트만 — 다른 페이지의 서식·태그가 섞이지 않게.
  const onCanvasPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest("[data-edit-text]")) return;
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain").replace(/\s+/g, " "));
  };

  const onCanvasMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const block = (e.target as Element).closest("[data-edit-block]");
    const wrap = wrapRef.current;
    if (!block || !wrap) return;
    const index = Number(block.getAttribute("data-edit-block"));
    if (toolbar?.index === index) return;
    const r = block.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    setToolbar({ index, top: r.top - w.top + wrap.scrollTop + 8, left: r.right - w.left + wrap.scrollLeft - 8 });
  };

  const scrollToBlock = (index: number) => {
    setTab("edit");
    requestAnimationFrame(() =>
      canvasRef.current
        ?.querySelector(`[data-edit-block="${index}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    commit(moveBlockTo(value, Number(e.active.id), Number(e.over.id)), "같은 영역 안에서만 옮길 수 있습니다");
  };

  const applyHtmlEdit = () => {
    if (!htmlEdit) return;
    try {
      commit(replaceBlock(value, htmlEdit.index, htmlEdit.text));
      setHtmlEdit(null);
    } catch (err) {
      setHtmlEdit({ ...htmlEdit, error: (err as Error).message });
    }
  };

  if (!mounted) return null;

  // 블록을 못 찾는 글은 원본 HTML 을 그대로 고친다.
  if (blocks.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        <div className="meta" style={{ padding: "12px 48px" }}>
          이 글은 블록(section) 구조를 찾지 못했습니다. 원본 HTML 을 직접 고칩니다.
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{ flex: 1, padding: "12px 48px", border: "none", outline: "none", resize: "none",
            fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, background: "var(--bg-base)", color: "var(--fg-strong)" }}
        />
      </div>
    );
  }

  const tb = toolbar && toolbar.index < blocks.length ? toolbar : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", height: "100%", minHeight: 0 }}>
      <style>{`
        .pve-canvas [data-edit-block]:hover { outline: 2px dashed var(--line-strong, var(--fg-neutral)); outline-offset: -2px; }
        .pve-canvas [data-edit-text] { outline: 2px solid var(--fg-strong); outline-offset: 2px; cursor: text; }
      `}</style>
      <aside style={{ borderRight: "1px solid var(--line-subtle)", overflow: "auto", padding: "12px 8px" }}>
        <div className="meta" style={{ fontSize: 12, padding: "0 8px 8px" }}>블록 {blocks.length}개 · 끌어서 순서 변경</div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={blocks.map((b) => String(b.index))} strategy={verticalListSortingStrategy}>
            {blocks.map((b) => (
              <BlockRow key={`${b.index}-${b.label}`} block={b} onClick={() => scrollToBlock(b.index)} />
            ))}
          </SortableContext>
        </DndContext>
      </aside>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 16px", borderBottom: "1px solid var(--line-subtle)" }}>
          <Button size="sm" variant={tab === "edit" ? "primary" : "ghost"} onClick={() => setTab("edit")}>편집</Button>
          <Button size="sm" variant={tab === "preview" ? "primary" : "ghost"} onClick={() => setTab("preview")}>실행 미리보기</Button>
          <span className="meta" style={{ fontSize: 12, marginLeft: 8 }}>
            {notice ?? (tab === "edit" ? "글자를 클릭해 고치고, Enter 로 확정 · Ctrl+Z 되돌리기" : "스크립트까지 실행한 실제 화면")}
          </span>
        </div>
        <div ref={wrapRef} style={{ position: "relative", overflow: "auto", flex: 1, background: "var(--bg-base)" }}
          onMouseLeave={() => setToolbar(null)}>
          {tab === "edit" ? (
            <>
              <div
                ref={canvasRef}
                className="post-page pve-canvas"
                onClick={onCanvasClick}
                onBlur={onFocusOut}
                onKeyDown={onCanvasKeyDown}
                onPaste={onCanvasPaste}
                onMouseMove={onCanvasMove}
                dangerouslySetInnerHTML={{ __html: canvasHtml }}
              />
              {tb && (
                <div
                  style={{ position: "absolute", top: tb.top, left: tb.left, transform: "translateX(-100%)", display: "flex", gap: 4,
                    padding: 4, background: "var(--bg-base)", border: "1px solid var(--line-subtle)", borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,.12)", zIndex: 5 }}
                >
                  <ToolBtn label="위로" onClick={() => commit(moveBlock(value, tb.index, -1), "같은 영역에서 맨 위입니다")}>↑</ToolBtn>
                  <ToolBtn label="아래로" onClick={() => commit(moveBlock(value, tb.index, 1), "같은 영역에서 맨 아래입니다")}>↓</ToolBtn>
                  <ToolBtn label="복제" onClick={() => commit(duplicateBlock(value, tb.index))}>⧉</ToolBtn>
                  <ToolBtn label="삭제" onClick={() => { commit(removeBlock(value, tb.index)); setToolbar(null); }}>🗑</ToolBtn>
                  <ToolBtn label="HTML 보기" onClick={() => setHtmlEdit({ index: tb.index, text: blockHtml(value, tb.index) })}>{"</>"}</ToolBtn>
                </div>
              )}
            </>
          ) : (
            <PageBody html={value} />
          )}
        </div>
      </div>
      {htmlEdit && (
        <div className="modal-scrim" onClick={() => setHtmlEdit(null)}>
          <div className="modal" style={{ padding: 24, width: "min(960px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>블록 HTML — {blocks[htmlEdit.index]?.label}</h3>
            <textarea
              value={htmlEdit.text}
              onChange={(e) => setHtmlEdit({ ...htmlEdit, text: e.target.value, error: undefined })}
              spellCheck={false}
              rows={20}
              style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.5, padding: 12,
                border: "1px solid var(--line-subtle)", borderRadius: 8, background: "var(--bg-subtle)", color: "var(--fg-strong)" }}
            />
            {htmlEdit.error && <div role="alert" style={{ color: "var(--danger, #d33)", fontSize: 13, marginTop: 8 }}>{htmlEdit.error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <Button variant="outline" size="sm" onClick={() => setHtmlEdit(null)}>취소</Button>
              <Button variant="primary" size="sm" onClick={applyHtmlEdit}>적용</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      style={{ minWidth: 30, height: 30, border: "none", borderRadius: 6, background: "transparent",
        color: "var(--fg-strong)", cursor: "pointer", fontSize: 14 }}>
      {children}
    </button>
  );
}

function BlockRow({ block, onClick }: { block: BlockInfo; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(block.index) });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} onClick={onClick}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1,
        padding: "8px 10px", borderRadius: 6, fontSize: 13, cursor: "grab", color: "var(--fg-strong)",
        display: "flex", gap: 8, alignItems: "center", userSelect: "none" }}>
      <span aria-hidden style={{ color: "var(--fg-alternative)" }}>≡</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.label}</span>
    </div>
  );
}
```

`slug` 는 Task 4 에서 AI 요청에 쓴다. 이 단계에서 미사용 인자 lint 경고가 나와도 그대로 둔다.

React 의 `onBlur` 는 자식의 focusout 도 버블링하므로 `onFocusOut` 이 편집 요소의 blur 를 받는다.

- [ ] **Step 2: `PostEditor.tsx` 분기**

1. import 추가:
```tsx
import { isPageBody } from "@/lib/page-html";
import { PageVisualEditor } from "@/components/admin/PageVisualEditor";
```
2. 상태 선언 아래에 (편집 중 마커를 지워도 모드가 흔들리지 않게 초기값 기준):
```tsx
  const isPage = useMemo(() => isPageBody(initial.bodyMd), [initial.bodyMd]);
```
3. 왼쪽 칼럼의 `<div style={{ padding: "20px 48px 0" }}> … </div>` (카테고리 행 + 제목 + 밑줄) 블록 전체를 `const metaHeader = ( … );` 로 꺼내 return 위에 두고, 원래 자리에는 `{metaHeader}` 를 둔다.
4. 상단 "AI 개선" 버튼 조건을 `initial.originalSlug && !isPage` 로 바꾸고, 신규 글 "URL로 초안" 은 `!initial.originalSlug` 일 때만 보이게 한다:
```tsx
        {initial.originalSlug ? (
          !isPage && (
            <Button variant="ghost" size="sm" onClick={() => setAiReviseOpen(true)} disabled={pending}>
              AI 개선
            </Button>
          )
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setAiDraftOpen(true)} disabled={pending}>
            URL로 초안
          </Button>
        )}
```
(페이지 글 전체 개선 워커는 마크다운용 프롬프트라 HTML 을 망가뜨린다. 전체 윤문은 Claude Code `/revise`.)
5. `</AdminTopbar>` 다음의 2단 그리드 `<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", … }}> … </div>` 를 아래로 감싼다:
```tsx
      {isPage ? (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", minHeight: 0 }}>
          {metaHeader}
          <div style={{ height: 1, background: "var(--line-subtle)", margin: "20px 0 0" }} />
          <div style={{ flex: 1, minHeight: 0 }}>
            <PageVisualEditor value={bodyMd} onChange={setBodyMd} slug={initial.originalSlug} />
          </div>
        </div>
      ) : (
        /* 기존 2단 그리드 그대로 */
      )}
```

- [ ] **Step 3: 타입체크·테스트·빌드**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: 모두 통과.

- [ ] **Step 4: 실제 화면 점검 (Playwright)**

준비: 견본 한 편이 DB 에 draft 로 있어야 한다. 없으면 `npm run draft -- push auto-drafts/posts/self-attention-qkv.html`. `npm run dev` 를 백그라운드로 띄운다.

스크래치패드에 `check-editor.mjs` 를 만들어 실행한다(어드민 로그인은 `/admin/login` 에 `ADMIN_PASSWORD` 입력). 확인 항목:
1. `/admin/editor?slug=self-attention-qkv` 에 블록 목록이 `listBlocks` 결과 수(견본은 7개 안팎)만큼 보이고 마크다운 textarea 가 없다.
2. 두 번째 블록에 마우스 → 툴바 "아래로" 클릭 → 블록 목록 2·3번 라벨이 바뀐다.
3. 두 번째 블록의 첫 `p` 클릭 → 글자 추가 → Enter → 캔버스에 반영, Ctrl+Z 로 원복, Ctrl+Shift+Z 로 재적용.
4. "실행 미리보기" 탭에서 `pageerror` 이벤트 0건, 콘솔 error 0건.
5. "임시 저장" 후 DB 의 `body_md` 를 읽어 `data-edit-`·`contenteditable`·`text/post-page` 가 없고 `<script>` 개수가 원본과 같다.
6. 데스크톱 1440px 스크린샷을 남겨 사용자에게 보여 준다.

끝나면 원본으로 되돌린다(`npm run draft -- push auto-drafts/posts/self-attention-qkv.html`).

- [ ] **Step 5: 커밋**

```bash
git add src/components/admin/PageVisualEditor.tsx src/components/admin/PostEditor.tsx
git commit -m "어드민 HTML 비주얼 편집기: 페이지 글은 블록 목록(드래그 정렬)+편집 캔버스(스크립트 잠금, 글자 클릭 수정, 블록 툴바 이동·복제·삭제·HTML 보기)+실행 미리보기 탭, Ctrl+Z 되돌리기, 블록 없는 글은 원본 HTML 편집. 페이지 글에서는 마크다운용 전체 AI 개선 버튼을 숨김"
git push
```

---

### Task 4: 블록 AI 수정 화면

**Files:**
- Create: `src/components/admin/BlockAiCompare.tsx`
- Modify: `src/components/admin/PageVisualEditor.tsx`

**Interfaces:**
- Consumes: Task 2 의 `requestBlockRevise`, `getBlockJob`, `cancelBlockJob`, `BlockJob`; Task 1 의 `blockHtml`, `findBlockIndex`, `replaceBlock`, `missingHooks`; `AiReviseModal` (`src/components/admin/AiModals.tsx`)
- Produces: `BlockAiCompare({ before, after, missing, onAccept, onReject })`

- [ ] **Step 1: `BlockAiCompare.tsx`**

```tsx
"use client";

import { Button } from "@/components/ui/Button";

// 블록 AI 결과 비교. 글의 <style> 이 이미 문서에 있으므로 .post-page 안에 그리면 실제 모양으로 보인다.
// 스크립트 훅이 빠졌으면 경고하지만 수락은 막지 않는다(훅 추출이 정규식이라 놓치거나 과하게 잡을 수 있다).
export function BlockAiCompare({
  before,
  after,
  missing,
  onAccept,
  onReject,
}: {
  before: string;
  after: string;
  missing: string[];
  onAccept: () => void;
  onReject: () => void;
}) {
  const pane = (title: string, html: string) => (
    <div style={{ minWidth: 0 }}>
      <div className="meta" style={{ fontSize: 12, marginBottom: 6 }}>{title}</div>
      <div className="post-page" style={{ maxHeight: "60vh", overflow: "auto", border: "1px solid var(--line-subtle)", borderRadius: 8 }}
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
  return (
    <div className="modal-scrim" onClick={onReject}>
      <div className="modal" style={{ padding: 24, width: "min(1200px, 94vw)" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>AI 제안 비교</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {pane("지금", before)}
          {pane("AI 제안", after)}
        </div>
        {missing.length > 0 && (
          <div role="alert" style={{ color: "var(--danger, #d33)", fontSize: 13, marginTop: 12 }}>
            ⚠ 스크립트가 쓰는 표시가 빠졌습니다: {missing.join(", ")} — 수락하면 인터랙션이 멈출 수 있습니다. 실행 미리보기로 확인하세요.
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button variant="outline" size="sm" onClick={onReject}>버리기</Button>
          <Button variant="primary" size="sm" onClick={onAccept}>이 블록에 적용</Button>
        </div>
      </div>
    </div>
  );
}
```

비교 창의 HTML 은 `<section>` 하나이고 `<script>` 를 넣지 말라고 지시했다. 그래도 `dangerouslySetInnerHTML` 로 넣은 `<script>` 는 브라우저가 실행하지 않는다.

- [ ] **Step 2: `PageVisualEditor.tsx` 에 AI 흐름 추가**

import 추가:
```tsx
import { AiReviseModal } from "@/components/admin/AiModals";
import { BlockAiCompare } from "@/components/admin/BlockAiCompare";
import { requestBlockRevise, getBlockJob, cancelBlockJob } from "@/app/admin/editor/block-actions";
import { findBlockIndex, missingHooks } from "@/lib/page-blocks";
```

상태와 폴링 (컴포넌트 안, `history` 선언 아래):
```tsx
  type AiJob = { id: number; index: number; before: string; startedAt: number; status: string; after?: string };
  const [aiAsk, setAiAsk] = useState<number | null>(null); // 요청 창을 연 블록 번호
  const [aiBusy, setAiBusy] = useState(false);
  const [aiJob, setAiJob] = useState<AiJob | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!aiJob || aiJob.after) return;
    const t = setInterval(async () => {
      setNow(Date.now());
      try {
        const j = await getBlockJob(aiJob.id);
        if (j.status === "done" && j.resultHtml) setAiJob((cur) => (cur && cur.id === aiJob.id ? { ...cur, status: "done", after: j.resultHtml! } : cur));
        else if (j.status === "error") {
          setAiJob(null);
          setNotice(`AI 수정 실패: ${j.message ?? "알 수 없는 오류"}`);
        } else setAiJob((cur) => (cur && cur.id === aiJob.id ? { ...cur, status: j.status } : cur));
      } catch (err) {
        setAiJob(null);
        setNotice(`AI 상태 확인 실패: ${(err as Error).message}`);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [aiJob]);

  const askAi = async (instruction: string) => {
    if (aiAsk === null || !slug) return;
    setAiBusy(true);
    try {
      const before = blockHtml(value, aiAsk);
      const { id } = await requestBlockRevise({ slug, blockHtml: before, instruction });
      setAiJob({ id, index: aiAsk, before, startedAt: Date.now(), status: "pending" });
      setNow(Date.now());
      setAiAsk(null);
    } catch (err) {
      setNotice(`요청 실패: ${(err as Error).message}`);
    } finally {
      setAiBusy(false);
    }
  };

  const acceptAi = () => {
    if (!aiJob?.after) return;
    const idx = findBlockIndex(value, aiJob.before, aiJob.index);
    if (idx < 0) {
      setNotice("요청한 뒤 그 블록이 바뀌어 적용할 수 없습니다");
    } else {
      try {
        commit(replaceBlock(value, idx, aiJob.after));
      } catch (err) {
        setNotice(`적용 실패: ${(err as Error).message}`);
      }
    }
    setAiJob(null);
  };

  const cancelAi = async () => {
    if (!aiJob) return;
    try {
      await cancelBlockJob(aiJob.id);
    } catch {
      /* 이미 처리 중이면 결과만 버린다 */
    }
    setAiJob(null);
  };
```

툴바에 버튼 추가 (`HTML 보기` 앞). 저장 안 된 신규 글이거나 다른 AI 작업이 진행 중이면 비활성:
```tsx
                  <ToolBtn label={slug ? "AI 수정" : "저장 후 AI 수정"} disabled={!slug || !!aiJob}
                    onClick={() => setAiAsk(tb.index)}>✨</ToolBtn>
```
`ToolBtn` 에 `disabled?: boolean` 을 받아 `<button disabled={disabled} … style={{ …, opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer" }}>` 로 넘긴다.

탭 줄 안내문 오른쪽에 진행 표시 (`<span className="meta" …>` 다음):
```tsx
          {aiJob && !aiJob.after && (
            <span className="meta" style={{ fontSize: 12, marginLeft: "auto", display: "inline-flex", gap: 8, alignItems: "center" }}>
              <span className="ai-spinner" aria-hidden />
              {aiJob.status === "processing" ? "AI 가 블록을 고치는 중…" : "워커 대기 중…"}
              {aiJob.status === "pending" && now - aiJob.startedAt > 30_000 && " 워커가 꺼져 있을 수 있습니다. PC 에서 npm run ai:worker 를 실행하세요."}
              {aiJob.status === "pending" && <Button size="sm" variant="ghost" onClick={cancelAi}>취소</Button>}
            </span>
          )}
```

모달 렌더 (`htmlEdit` 모달 옆):
```tsx
      {aiAsk !== null && (
        <AiReviseModal
          busy={aiBusy}
          targetLabel={`블록: ${blocks[aiAsk]?.label ?? aiAsk + 1}`}
          onClose={() => setAiAsk(null)}
          onSubmit={askAi}
        />
      )}
      {aiJob?.after && (
        <BlockAiCompare
          before={aiJob.before}
          after={aiJob.after}
          missing={missingHooks(aiJob.before, aiJob.after, hooks)}
          onAccept={acceptAi}
          onReject={() => setAiJob(null)}
        />
      )}
```

- [ ] **Step 3: 타입체크·테스트·빌드**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: 모두 통과.

- [ ] **Step 4: 실제 흐름 확인**

`npm run dev` 와 `npm run ai:worker -- --watch` 를 백그라운드로 띄운다. Playwright 스크립트로:
1. `self-attention-qkv` 편집기에서 두 번째 블록 ✨ → "첫 문단을 한 문장으로 줄여줘" 요청.
2. 진행 표시가 뜨고, 워커 처리 후 비교 창이 뜬다(최대 5분 대기).
3. "이 블록에 적용" → 캔버스의 해당 블록 글자가 바뀌고, Ctrl+Z 로 되돌아간다.
4. 이 동안 DB `posts.updated_at` 이 (자동 저장 전까지) 바뀌지 않는다.
5. 워커를 끈 상태에서 요청 → 30초 뒤 안내 문구, "취소" → job `status='error'`, `result='취소'`.

스크린샷(진행 표시, 비교 창)을 사용자에게 보여 준다. 끝나면 원고를 원래대로 다시 push 한다.

- [ ] **Step 5: 커밋**

```bash
git add src/components/admin/BlockAiCompare.tsx src/components/admin/PageVisualEditor.tsx
git commit -m "블록 AI 수정 화면: 블록 툴바 ✨ 로 요청, 3초 폴링 진행 표시와 워커 미가동 안내·취소, 전/후 비교 창에서 스크립트 훅 누락 경고 후 수락하면 그 블록만 교체(되돌리기 가능)"
git push
```

---

### Task 5: 규약·워커 문서

**Files:**
- Modify: `POSTING.md` (5장 끝에 절 추가)
- Modify: `docs/ai-worker-setup.md`

- [ ] **Step 1: POSTING.md 5장 끝에 추가** (마지막 `### 5-N` 절 뒤, 다음 `## ` 앞)

```markdown
### 5-N. 어드민 비주얼 편집

어드민 편집기는 페이지 글을 블록 단위로 고친다(설계 `docs/superpowers/specs/2026-10-13-admin-html-visual-editor-design.md`).

- **블록 = 조상 중에 section 이 없는 `<section>`.** 블록 목록 이름은 그 안 첫 `h1~h4` 다. 편집기에서
  옮기고 지우고 AI 로 다시 쓰는 단위이므로, 한 덩어리로 다룰 내용은 section 하나에 담는다.
- **이동은 같은 부모 안에서만.** 2단 레이아웃처럼 래퍼가 다른 블록 사이로는 옮길 수 없다.
- **스크립트 훅은 `data-*` 속성으로 건다.** 편집기는 스크립트가 찾는 `data-*`·클래스·id 를 정규식으로
  뽑아, 그 요소는 글자 편집에서 빼고 AI 결과에서 빠지면 경고한다. 선택자를 문자열로 조합하면 못 잡는다.
- 스크립트가 글자를 채우는 요소는 비워 두거나 `data-*` 를 단다. 그래야 편집 대상에서 빠진다.
- 편집 캔버스는 스크립트를 돌리지 않는다. 인터랙션 확인은 "실행 미리보기" 탭에서 한다.
- 페이지 글 전체 윤문은 어드민 "AI 개선"(마크다운용)이 아니라 Claude Code `/revise` 로 한다.
```

`5-N` 은 실제 다음 번호로 바꾼다(`grep -n "^### 5-" POSTING.md`).

- [ ] **Step 2: `docs/ai-worker-setup.md` 에 작업 종류 추가**

작업 종류를 설명하는 곳(없으면 문서 끝)에:
```markdown
## block_revise — 어드민 비주얼 편집기의 블록 AI 수정

- 넣는 곳: 페이지 글 편집기 블록 툴바 ✨ (`src/app/admin/editor/block-actions.ts`)
- 입력: `block_html`(section 하나) + `instruction`
- 출력: `result_html` 에만 쓴다. **`posts` 는 건드리지 않는다** — 편집기가 비교 후 수락할 때 반영된다.
- 프롬프트: POSTING.md 2-4 점검표와 5장 발췌, class·id·data-* 유지 지시.
- 마이그레이션: `db/migrations/0016_ai_jobs_block_revise.sql`
```

- [ ] **Step 3: 확인과 커밋**

Run: `npm run lint:draft -- POSTING.md 2>/dev/null; git diff --stat`
Expected: 두 문서만 바뀐다.

```bash
git add POSTING.md docs/ai-worker-setup.md
git commit -m "비주얼 편집 규약: 블록=최상위 section, 같은 부모 안 이동, 스크립트 훅은 data-* 로, 페이지 글 전체 윤문은 /revise. 워커 문서에 block_revise"
git push
```
