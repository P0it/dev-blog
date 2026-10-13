# 어드민 HTML 비주얼 편집기 설계

날짜: 2026-10-13
상태: 설계 승인, 구현 계획 전

## 목적

앞으로 글은 HTML 페이지 형식(`<!-- page -->`, POSTING.md 5장)이 기본이다. 어드민 편집기는
마크다운 textarea 라서 HTML 글을 고치려면 원고 파일을 직접 열어야 한다. 화면을 보면서 블록 단위로
글자를 고치고, 순서를 바꾸고, 블록 하나만 AI 에게 다시 쓰게 하는 편집기를 만든다.

## 전제

- 글은 `/study` 등 Claude Code 경로로 만든다. 어드민 편집기는 **만든 뒤 손보는 용도**다.
- 글의 `<style>`·`<script>` 는 편집 대상이 아니다. 그대로 보존한다.
- 마크다운 글은 남아 있으므로 기존 마크다운 편집기도 유지한다.
- 데스크톱 편집이 기준이다. 모바일 편집 최적화는 하지 않는다.

## 범위

포함
- 블록(section) 단위 이동·복제·삭제, 블록 목록 드래그 정렬
- 글자 요소 그 자리 수정
- 블록 원본 HTML 직접 수정(탈출구)
- 편집 / 실행 미리보기 탭
- 되돌리기·다시 하기
- 블록 단위 AI 수정 (로컬 워커 `block_revise`)

제외 (YAGNI)
- 새 블록 추가, 블록 템플릿 목록
- 스타일 패널(색·여백·글자 크기)
- 워커가 꺼져 있을 때 Anthropic API 로 대신 처리하는 경로
- GrapesJS 등 외부 노코드 편집기 도입. 자체 컴포넌트 모델로 HTML 을 다시 써서 `data-*` 훅·
  인라인 SVG·`<script>` 가 바뀌거나 빠질 위험이 커서 접었다

## 화면

`PostEditor` 는 본문이 `isPageBody()` 면 마크다운 편집기 대신 `PageVisualEditor` 를 상단바 바로
아래부터 화면 끝까지 그린다. 저장·발행 버튼은 상단바에 그대로 있다.

```
┌ [블록][글 정보] ┐┌ [편집][실행 미리보기]  안내문 ───────────────┐
│ ▢ 히어로        ││ 회색 작업판                                  │
│ ▢ 1. 점수  ←선택││   ▢ 본문 · slug                              │
│ ▢ 2. 온도       ││   ┌ 프레임 ───────────────────────────────┐ │
│   ...           ││   │ [▢ 1. 점수]           [↑↓⧉🗑|✨</>]   │ │
│                 ││   │ ┏━━━━━━━━━━━━━━ 선택 박스 ━━━━━━━━━━┓ │ │
└────────────────┘└───────────────────────────────────────────────┘
```

- **사이드바 탭 둘.** "블록" 은 레이어 패널(드래그 정렬, 클릭하면 선택·스크롤, 캔버스 선택과 연동).
  "글 정보" 는 제목·카테고리·태그·작성일·원문 작성일·썸네일 입력칸.
- **제목을 위에 크게 고정하지 않는다.** 페이지 글은 본문 HTML 의 `h1` 이 화면 제목이고, `posts.title` 은
  목록·검색·OG 용이라 사이드바에서 고친다. 처음 안은 마크다운 편집기처럼 메타 줄과 큰 제목을 위에
  두었으나, 편집 영역이 좁아 접었다(2026-10-13 사용자 피드백).
- **피그마식 캔버스.** 회색 작업판 위에 글 하나가 프레임으로 놓인다. 마우스를 올리면 1px 파란 테두리,
  클릭하면 2px 선택 박스와 모서리 핸들, 왼쪽 위 이름표(블록이면 `▢ 블록 이름`, 글자 요소면 `T 태그`).
  블록 도구(위로·아래로·복제·삭제·AI 수정·HTML 보기)는 선택한 블록 위 오른쪽에 뜨는 어두운 막대에 있다.
  선택색은 테마와 상관없이 `#0d99ff`.
- **조작**: 클릭 = 선택, 더블클릭 = 글자 편집(누른 자리에 커서), Enter = 확정, Esc = 선택 해제,
  Del = 선택한 블록 삭제, 선택한 글자 요소에서 Enter = 편집 시작. 작업판 빈 곳을 누르면 선택 해제.
- **편집 탭**: 원본 DOM 복사본을 글의 `<style>` 과 함께 `.post-page` 래퍼 안에 그린다. 스크립트는
  실행하지 않는다. 캔버스는 렌더마다 innerHTML 을 다시 넣지 않도록 `{__html}` 객체를 메모이즈한다
  (React 19 는 이 객체를 동일성으로 비교한다. 새 객체를 주면 선택만 바뀌어도 캔버스가 다시 그려져
  편집 중인 요소가 문서에서 떨어진다). `PageBody` 도 같은 이유로 메모이즈한다.
- **글자 수정 대상**: 텍스트 요소(`h1~h6, p, li, figcaption, td, th, blockquote, button, dt, dd, label, summary`).
  인라인 태그(`b, strong, em, code, a, span`)는 보존한다. 붙여넣기는 순수 텍스트만.
  편집 제외: `svg` 안쪽, 글자가 없는 요소(스크립트가 채우는 자리), 스크립트 훅 선택자에 맞는 요소.
- **HTML 보기**: 블록 원본 HTML 을 코드 편집 창으로 열어 고친다. 적용 시 section 하나로 파싱되지
  않으면 거부한다.
- **실행 미리보기 탭**: 현재 원본을 공개 상세 화면과 같은 `PageBody` 로 같은 프레임 안에 그리고 스크립트를 실행한다.
- **되돌리기**: Ctrl+Z / Ctrl+Shift+Z. 편집 동작(이동·복제·삭제·글자 수정 확정·HTML 적용·AI 수락)마다
  원본 HTML 문자열 스냅샷을 쌓는다. 글자 수정은 포커스가 빠질 때 한 단계로 확정한다.

## 데이터 흐름

### 블록 모델

- `body_md` 에서 `PAGE_MARKER` 를 떼고 나머지를 `<template>` 으로 파싱해 **원본 DOM** 을 만든다.
  `<template>` 내용은 스크립트가 실행되지 않는다.
- **블록 = 조상 중에 `section` 이 없는 `section`**. 래퍼(`.tp-wrap`, `.tp-body` 등) 안쪽이어도 블록이다.
- 이동은 **같은 부모 안의 형제 블록끼리만** 한다. 2단 그리드 같은 레이아웃 구조를 보존한다.
  블록 목록에서 부모가 다른 블록 사이로 끌면 놓을 수 없게 표시한다.
- 블록 식별: 캔버스에 그릴 때 각 블록에 `data-edit-block="<순번>"` 을 붙이고, 직렬화할 때 뗀다.

### 저장

- 직렬화: 원본 DOM 의 `innerHTML` 앞에 `PAGE_MARKER` 를 붙여 기존 `saveDraft` / `publishPost` 의
  `bodyMd` 로 보낸다. 서버 저장 코드는 바꾸지 않는다.
- **편집하지 않았으면 원래 문자열을 그대로 보낸다**(dirty 플래그). 직렬화는 공백·속성 따옴표를
  조금 바꿀 수 있다.
- 읽는 시간·스니펫은 기존 `pageText` 경로를 그대로 탄다.

### 순수 함수 (`src/lib/page-blocks.ts`)

DOM 을 받는 순수 함수로 분리해 테스트한다.

- `parsePage(body) → { doc, blocks }`, `serializePage(doc) → body`
- `listBlocks(doc)`, `moveBlock(doc, id, dir)`, `duplicateBlock`, `removeBlock`, `replaceBlock(doc, id, html)`
- `scriptHooks(doc) → Set<string>`: `<script>` 텍스트에서 참조하는 `data-*` 속성명·클래스·id 를 뽑는다
  (`querySelector*` / `getElementById` 인자 문자열 정규식 추출)
- `missingHooks(beforeHtml, afterHtml, hooks) → string[]`

## 블록 AI 수정

### 흐름

1. 블록 툴바 ✨ → 요청 입력 → 서버 액션 `requestBlockRevise({ slug, blockHtml, instruction })` 가
   `ai_jobs` 에 `type='block_revise'` 행을 넣고 id 를 돌려준다.
2. 로컬 워커(`scripts/ai-worker.mjs`)가 claude CLI 에 프롬프트를 보낸다. 프롬프트 내용:
   블록 HTML, 요청, "블록에 있는 class·id·data-* 는 그대로 두라"(훅 목록을 따로 넘기는 대신 더 넓게 지킨다),
   POSTING.md 2-4 점검표와 5장 발췌, AI·LLM 용어는 영어·음차 유지, `{"html": "..."}` JSON 으로만 답하라.
3. 워커는 결과를 **`ai_jobs.result_html` 에만 쓴다. `posts` 는 건드리지 않는다.** 편집기에 저장 안 된
   변경이 있을 수 있어서다.
4. 편집기는 3초 간격으로 `getBlockJob(id)` 를 확인한다. `done` 이면 전/후 비교 창을 띄운다.
   - 검증: 결과가 section 하나로 파싱되는지, `missingHooks` 가 비었는지. 훅이 빠졌으면 경고를 띄우고
     그래도 수락할 수 있게 한다.
   - 수락 → `replaceBlock` (되돌리기 한 단계). 거절 → 버린다.
5. `pending` 이 30초를 넘으면 "워커가 꺼져 있을 수 있습니다. PC 에서 `npm run ai:worker` 를
   실행하세요" 안내와 취소 버튼. 취소는 행을 `error`(result='취소') 로 바꾼다.
6. `error` 면 `result` 의 메시지를 보여 준다.

### DB 마이그레이션 `db/migrations/0016_ai_jobs_block_revise.sql`

- `ai_jobs.type` 체크 제약에 `'block_revise'` 추가
- 컬럼 `block_html text` (입력 블록), `result_html text` (결과 블록)
- 기존 `result` 의 "짧은 요약만" 규칙은 그대로 둔다

### humanize

블록 단위라 `humanize-korean` 플러그인을 돌리지 않고 프롬프트에 POSTING 2-4 점검 규칙만 넣는다.
글 전체 윤문은 지금처럼 Claude Code 의 `/revise` 로 한다.

## 오류 처리

- 파싱 실패(블록 0개 등): 비주얼 편집기 대신 "이 글은 블록 구조를 찾지 못했습니다" 안내와 함께
  원본 HTML textarea 로 떨어진다.
- 저장 실패: 기존 `PostEditor` 오류 표시를 그대로 쓴다.
- 편집 중 페이지 이탈: 기존 dirty 경고를 따른다.

## 점검

- 단위 테스트 `src/lib/page-blocks.test.ts` (`node --test`, DOM 은 개발 의존성 `linkedom`)
  - 견본 3편(`auto-drafts/posts/*.html`) 왕복: 블록 수 동일, `scriptHooks` 동일, `pageText` 동일
  - 이동·복제·삭제·교체 후 블록 순서와 형제 제약
  - `missingHooks` 가 지워진 훅을 잡는지
- 화면: Playwright 로 어드민 편집기를 열어 블록 이동 → 글자 수정 → 저장 → 실행 미리보기에서
  콘솔 오류 없음 확인.
- 워커: `block_revise` 작업 1건을 실제로 넣어 `result_html` 이 채워지고 `posts` 는 바뀌지 않는지 확인.

## 문서

- POSTING.md 5장에 "어드민 비주얼 편집" 절: 블록 = 최상위 section, 이동은 같은 부모 안에서만,
  스크립트 훅은 `data-*` 로 걸어야 AI 수정에서 보존된다.
- `docs/ai-worker-setup.md` 에 `block_revise` 작업 종류.
