# 알고리즘 학습 탭 — 파일럿 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/algo` 탭을 띄우고, 세 페이지(이분 탐색 · 버블 정렬 · 격자 BFS)를 완성해 공통 규약을 확정한다.

**Architecture:** 콘텐츠는 전부 레포 안이다. 알고리즘마다 `src/content/algo/<slug>.tsx` 한 파일이
메타데이터와 본문을 내보내고, `src/lib/algo/*`가 스텝 테이프를 만들고, `src/components/algo/*`가
무대·플레이어·사이드바를 그린다. Supabase·어드민·MDX를 쓰지 않는다.

**Tech Stack:** Next 16 App Router · React 19 · TypeScript · `globals.css` 디자인 토큰 ·
`node --test` + `--experimental-strip-types` · Python 3(테이프 대조 fixture 생성 전용, CI 불필요)

**Spec:** `docs/superpowers/specs/2026-10-17-algo-visualizer-design.md`

## Global Constraints

- **모바일이 기본.** 조작 요소 최소 44px, 가로 스크롤 금지, 타이핑 요구 금지(슬라이더·버튼으로 받는다)
- **외부 리소스 금지.** 폰트·이미지·CDN 라이브러리를 새로 끌어오지 않는다
- **색은 `src/app/globals.css` 토큰만.** 상태 6종(현재/비교 중/확정/버림/범위 밖/대기)을 토큰에 매핑하고 하드코딩하지 않는다
- **플레이어는 처음에 멈춰 있다.** 자동 재생 금지
- **`prefers-reduced-motion`에서 전환을 끈다**
- **스크립트가 꺼져도 스텝 0과 전체 코드가 HTML로 읽힌다** (서버 렌더 결과가 스텝 0)
- 본문 글은 줄글 금지 — 키워드 머리 불릿·체인(`100 → 50 → …`)·등호 정의
- 제목 = 알고리즘 이름, 소제목 = 독자가 아는 장면. 본문은 ②되짚기 전까지 알고리즘 용어 금지
- 기준 샘플: `.superpowers/sample-binary-search.html`

## Review Focus

1. **못 찾는 값** — 테이프가 `return -1`까지 가고 마지막 스텝이 "없습니다"로 끝나야 한다 (Task 1)
2. **배열 길이 0·1** — 루프가 한 번도 안 돌거나 한 번만 돈다. 빈 테이프에서 렌더가 터지지 않아야 한다 (Task 1, 2)
3. **스텝 상한 초과** — 큰 입력에서 제너레이터가 상한에 닿으면 `truncated: true`로 끊고 메모리를 더 쓰지 않는다 (Task 1)
4. **`localStorage` 접근 불가** — 사생활 모드·차단 설정에서 읽기·쓰기가 throw 한다. 이어보기가 없어도 페이지가 정상 동작해야 한다 (Task 4)
5. **정렬 안 된 사용자 입력** — 이분 탐색에 섞인 배열을 넣으면 틀린 답이 나온다. 막지 말고 **그렇게 되는 걸 보여 주되** 경고를 띄운다 (Task 6)

---

### Task 1: 테이프 엔진 · 조사 함수 · 이분 탐색 생성기

**Files:**
- Create: `src/lib/algo/types.ts`, `src/lib/algo/josa.ts`, `src/lib/algo/binary-search.ts`
- Create: `scripts/algo/trace_binary_search.py`, `src/lib/algo/fixtures/binary-search.json`
- Test: `src/lib/algo/josa.test.ts`, `src/lib/algo/binary-search.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `type Step = { line: number; vars: Record<string, number>; stage: StageState; note: string; done?: boolean }`
  - `type StageState = { cells: CellState[]; flags: Record<string, number> }`
  - `type CellState = "current" | "compare" | "settled" | "dropped" | "out" | "waiting"`
  - `type Tape = { steps: Step[]; code: string[]; truncated: boolean }`
  - `buildTape(gen: Generator<Step>, code: string[], limit?: number): Tape` — 기본 limit 2000
  - `josa(n: number, withBatchim: string, without: string): string`
  - `binarySearchTape(arr: number[], target: number): Tape`

- [ ] **Step 1: `josa` 실패 테스트를 쓴다**

```ts
test("josa — 마지막 자리 읽는 소리의 받침으로 고른다", () => {
  assert.equal(josa(31, "이", "가"), "31이");   // 일 → 받침
  assert.equal(josa(42, "이", "가"), "42가");   // 이 → 없음
  assert.equal(josa(10, "은", "는"), "10은");   // 십 → 받침
  assert.equal(josa(7, "을", "를"), "7을");     // 칠 → 받침
  assert.equal(josa(0, "이", "가"), "0이");     // 영 → 받침
});
```

- [ ] **Step 2: 실패 확인** — `npm test` → `josa is not defined`
- [ ] **Step 3: `src/lib/algo/josa.ts` 에 `josa` 구현** — 받침 있는 끝자리는 0·1·3·6·7·8(영·일·삼·육·칠·팔)
- [ ] **Step 4: 통과 확인** — `npm test`

- [ ] **Step 5: 테이프 실패 테스트를 쓴다**

```ts
test("binarySearchTape — 찾는 값이 있을 때", () => {
  const t = binarySearchTape([7,12,19,23,31,42,55,68,71,90], 42);
  assert.equal(t.steps.at(-1)!.done, true);
  assert.equal(t.steps.at(-1)!.vars.mid, 5);
  assert.ok(t.steps.every(s => s.line >= 1 && s.line <= t.code.length));
});

test("binarySearchTape — 못 찾으면 return -1 까지 간다", () => {
  const t = binarySearchTape([1,3,5], 4);
  assert.equal(t.steps.at(-1)!.line, t.code.length);   // return -1
  assert.equal(t.steps.at(-1)!.done, false);
});

test("binarySearchTape — 빈 배열에서도 테이프가 생긴다", () => {
  const t = binarySearchTape([], 1);
  assert.ok(t.steps.length >= 1);
  assert.equal(t.truncated, false);
});

test("buildTape — 상한에 닿으면 truncated 로 끊는다", () => {
  const t = buildTape(infiniteGen(), ["x"], 10);
  assert.equal(t.steps.length, 10);
  assert.equal(t.truncated, true);
});
```

- [ ] **Step 6: 실패 확인** — `npm test`
- [ ] **Step 7: `types.ts` · `binary-search.ts` 구현** — `binarySearchTape`는 제너레이터로 스텝을 흘리고 `buildTape`가 상한까지만 모은다. 코드 배열은 사양의 Python 11줄 그대로, 스텝의 `line`은 1-base
- [ ] **Step 8: 통과 확인** — `npm test`

- [ ] **Step 9: Python tracer 와 fixture**

`scripts/algo/trace_binary_search.py` 는 같은 Python 코드를 `sys.settrace` 로 돌려
`[{line, vars:{left,right,mid}}, …]` 를 `src/lib/algo/fixtures/binary-search.json` 으로 쓴다.
입력은 위 테스트와 같은 배열·타깃 3쌍(찾음 / 못 찾음 / 빈 배열).

- [ ] **Step 10: 대조 테스트를 쓴다**

```ts
test("Python 과 JS 가 같은 줄·같은 변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = binarySearchTape(c.arr, c.target);
    const mine = t.steps.map(s => [s.line, s.vars.left, s.vars.right, s.vars.mid ?? null]);
    assert.deepEqual(mine, c.trace);
  }
});
```

- [ ] **Step 11: `python scripts/algo/trace_binary_search.py` 로 fixture 생성 → `npm test` 통과 확인**

fixture 는 커밋한다. CI 에 Python 을 들이지 않는다 — 코드를 고칠 때만 사람이 다시 생성한다.

- [ ] **Step 12: Commit** — `feat(algo): 테이프 엔진·조사 함수·이분 탐색 생성기`

---

### Task 2: 무대 컴포넌트 — track · flag

**Files:**
- Create: `src/components/algo/StageTrack.tsx`, `src/components/algo/stage.module.css`
- Modify: `src/app/globals.css` (상태 색 6종 토큰 별칭 추가)
- Test: `src/components/algo/stage.test.ts`

**Interfaces:**
- Consumes: `StageState`, `CellState` (Task 1)
- Produces: `<StageTrack values={number[]} state={StageState} />`, `cellClass(state: CellState): string`

- [ ] **Step 1: `cellClass` 실패 테스트** — 상태 6종이 각각 다른 클래스를 내고, 알 수 없는 값은 `out` 으로 떨어진다
- [ ] **Step 2: 실패 확인** — `npm test`
- [ ] **Step 3: `globals.css` 에 `--algo-current/compare/settled/dropped/out/waiting` 를 기존 토큰 별칭으로 추가하고 `cellClass` 구현** — 새 색을 만들지 않는다
- [ ] **Step 4: 통과 확인** — `npm test`
- [ ] **Step 5: `StageTrack` 구현** — 칸 + 인덱스, 칸 아래 `flags` 라벨. 빈 배열이면 아무것도 안 그리고 터지지 않는다. 전환은 CSS, `prefers-reduced-motion` 에서 끈다
- [ ] **Step 6: Commit** — `feat(algo): 칸 트랙 무대와 상태 색 토큰`

---

### Task 3: 플레이어 셸

**Files:**
- Create: `src/components/algo/TapePlayer.tsx`, `src/components/algo/player.module.css`
- Test: `src/components/algo/player.test.ts`

**Interfaces:**
- Consumes: `Tape` (Task 1), `StageTrack` (Task 2)
- Produces: `<TapePlayer tape={Tape} stage={(s: StageState) => ReactNode} />`,
  `clampStep(at: number, len: number): number`

- [ ] **Step 1: `clampStep` 실패 테스트** — `-5 → -1`(시작 전), `99 → len-1`, 빈 테이프에서 항상 `-1`
- [ ] **Step 2: 실패 확인** — `npm test`
- [ ] **Step 3: `clampStep` 구현 후 통과 확인**
- [ ] **Step 4: `TapePlayer` 구현**

  - 컨트롤: `◀ · 재생/멈춤 · ▶ · 처음`, 스텝 카운터. 44px 이상, 아래쪽 한 줄
  - 좁은 화면(≤620px)은 `그림 / 코드` 탭 전환, 넓으면 좌우 배치
  - 코드는 현재 줄만 하이라이트. 가로 스크롤이 생기지 않게 좁은 폭 기준으로 둔다
  - **서버 렌더 결과가 스텝 0** — JS 없이도 코드 전문과 첫 상태가 보인다
  - `truncated` 면 마지막에 "여기까지만 보여 줍니다"를 띄운다

- [ ] **Step 5: Commit** — `feat(algo): 테이프 플레이어`

---

### Task 4: 라우트 · 레지스트리 · 페이지 셸

**Files:**
- Create: `src/content/algo/registry.ts`, `src/app/algo/page.tsx`, `src/app/algo/[slug]/page.tsx`,
  `src/components/algo/AlgoPage.tsx`, `src/lib/algo/progress.ts`
- Test: `src/content/algo/registry.test.ts`, `src/lib/algo/progress.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `type AlgoEntry = { slug: string; title: string; lede: string; category: string; tier: 1|2|3; aliases: string[]; signals: string[]; status: "ready"|"planned" }`
  - `registry: AlgoEntry[]`, `byCategory(): Map<string, AlgoEntry[]>`
  - `readProgress(slug: string): number | null`, `writeProgress(slug: string, at: number): void`

- [ ] **Step 1: 레지스트리 실패 테스트** — slug 중복 없음, `status: "ready"` 인 항목은 전부 `src/content/algo/<slug>.tsx` 가 존재, `byCategory` 가 사양 5절 카테고리 순서를 지킨다
- [ ] **Step 2: 진행 저장 실패 테스트** — `localStorage` 가 throw 하도록 바꿔 두고 `readProgress` 가 `null`, `writeProgress` 가 조용히 넘어가는지
- [ ] **Step 3: 실패 확인** — `npm test`
- [ ] **Step 4: `registry.ts` · `progress.ts` 구현 후 통과 확인**

  레지스트리에는 사양 5절 티어 1 전체를 넣되, 세 개만 `status: "ready"` 다.

- [ ] **Step 5: 라우트와 셸 구현**

  - `/algo` — 카테고리별 목록. `planned` 는 흐리게, 링크 없음
  - `/algo/[slug]` — `generateStaticParams` 로 `ready` 항목만. `generateMetadata` 는 제목·소제목
  - `AlgoPage` — 카테고리 / h1 제목 / 소제목 / 본문 슬롯. 본문은 `src/content/algo/<slug>.tsx` 가 준다

- [ ] **Step 6: Commit** — `feat(algo): /algo 라우트와 레지스트리`

---

### Task 5: 사이드바

**Files:**
- Create: `src/components/algo/AlgoSidebar.tsx`, `src/lib/algo/search.ts`, `src/components/algo/sidebar.module.css`
- Modify: `src/components/algo/AlgoPage.tsx`
- Test: `src/lib/algo/search.test.ts`

**Interfaces:**
- Consumes: `registry`, `AlgoEntry` (Task 4)
- Produces: `filterEntries(entries: AlgoEntry[], q: string): AlgoEntry[]`, `chosung(s: string): string`

- [ ] **Step 1: 검색 실패 테스트**

```ts
test("filterEntries — 이름·별칭·신호·초성", () => {
  assert.deepEqual(ids(filterEntries(reg, "이분")), ["binary-search"]);
  assert.deepEqual(ids(filterEntries(reg, "binary")), ["binary-search"]);   // 별칭
  assert.deepEqual(ids(filterEntries(reg, "ㅇㅂ")), ["binary-search"]);      // 초성
  assert.deepEqual(ids(filterEntries(reg, "정렬돼")), ["binary-search"]);    // 신호 칩
  assert.deepEqual(filterEntries(reg, ""), reg);                            // 빈 질의는 전체
});
```

- [ ] **Step 2: 실패 확인** — `npm test`
- [ ] **Step 3: `search.ts` 구현 후 통과 확인** — 한글 초성 추출은 `(code - 0xAC00) / 588`
- [ ] **Step 4: `AlgoSidebar` 구현** — 검색창(`/` 단축키) · 접히는 카테고리 그룹 · 개수 배지. 좁은 화면에서는 상단 토글 뒤로. 접힘 상태와 검색어를 `sessionStorage` 에 둔다(없어도 동작)
- [ ] **Step 5: Commit** — `feat(algo): 사이드바와 검색`

---

### Task 6: 이분 탐색 페이지

**Files:**
- Create: `src/content/algo/binary-search.tsx`, `src/components/algo/UpDownGame.tsx`,
  `src/components/algo/Quiz.tsx`, `src/components/algo/InputPicker.tsx`
- Modify: `src/content/algo/registry.ts` (status → ready)
- Test: `src/components/algo/quiz.test.ts`

**Interfaces:**
- Consumes: Task 1~5 전부
- Produces: `<Quiz question stem options={{label, correct}[]} why />`,
  `<InputPicker values onChange max={30} />`

- [ ] **Step 1: 퀴즈 실패 테스트** — 정답을 고르면 `right`, 오답은 `wrong`, **어느 쪽을 골라도 해설이 열린다**. 정답이 정확히 하나가 아니면 던진다
- [ ] **Step 2: 실패 확인 → `Quiz` 구현 → 통과 확인**
- [ ] **Step 3: `UpDownGame` 구현**

  슬라이더로 1~100 중 하나를 고르고 버튼 한 번. `더 커요 ↑` / `더 작아요 ↓`, 남은 후보 막대가
  양쪽에서 좁혀진다. **맞히기 전에는 ②되짚기 문단이 숨어 있다.** 맞히면 횟수를 7과 견준다.

- [ ] **Step 4: `InputPicker` 구현** — 배열을 눌러서 바꾸는 입력. 최대 30칸. **정렬이 깨지면 막지 않고 경고를 띄운다**(Review Focus 5)
- [ ] **Step 5: `binary-search.tsx` 본문 작성** — 사양 3절 ①~⑦ 순서. 기준 샘플의 글을 옮기되 줄글 금지 규칙을 지킨다. 퀴즈 오답은 **같은 알고리즘이 다른 입력에서 실제로 하는 행동**으로 만든다
- [ ] **Step 6: `npm run build` 통과 확인, 좁은 폭에서 가로 스크롤이 없는지 확인**
- [ ] **Step 7: Commit** — `feat(algo): 이분 탐색 페이지`

---

### Task 7: 버블 정렬 페이지

**Files:**
- Create: `src/lib/algo/bubble-sort.ts`, `src/content/algo/bubble-sort.tsx`,
  `src/components/algo/Counter.tsx`, `scripts/algo/trace_bubble_sort.py`,
  `src/lib/algo/fixtures/bubble-sort.json`
- Modify: `src/content/algo/registry.ts`
- Test: `src/lib/algo/bubble-sort.test.ts`

**Interfaces:**
- Consumes: Task 1~6
- Produces: `bubbleSortTape(arr: number[]): Tape`, `<Counter rows={{label, n}[]} />`

- [ ] **Step 1: 실패 테스트** — 마지막 스텝의 `stage.cells` 가 전부 `settled`, 이미 정렬된 입력에서 교환 0회, 역순 입력에서 비교 `n(n-1)/2` 회, 길이 1 배열에서도 테이프가 생긴다
- [ ] **Step 2: 실패 확인 → `bubbleSortTape` 구현 → 통과 확인**
- [ ] **Step 3: Python tracer 와 fixture 생성, 대조 테스트 통과 확인** (Task 1 Step 9~11 과 같은 방식)
- [ ] **Step 4: `Counter` 구현** — 같은 입력에 두 방법의 연산 횟수를 나란히. 테이프를 또 만들지 않고 세기만 한다
- [ ] **Step 5: `bubble-sort.tsx` 본문 작성** — ①은 "옆 사람과 키 순서로 서 보기"(칸을 직접 끌어 정렬해 보고 몇 번 바꿨는지 센다). ⑦ 신호에 "그래서 실무에서는 안 쓴다"를 빠뜨리지 않는다
- [ ] **Step 6: `npm run build` 통과 확인 후 Commit** — `feat(algo): 버블 정렬 페이지`

---

### Task 8: 격자 BFS 페이지 — grid · lane 무대

**Files:**
- Create: `src/lib/algo/bfs-grid.ts`, `src/components/algo/StageGrid.tsx`,
  `src/components/algo/StageLane.tsx`, `src/content/algo/bfs-grid.tsx`,
  `scripts/algo/trace_bfs_grid.py`, `src/lib/algo/fixtures/bfs-grid.json`
- Modify: `src/content/algo/registry.ts`, `src/lib/algo/types.ts` (`StageState` 에 `grid`·`queue` 추가)
- Test: `src/lib/algo/bfs-grid.test.ts`

**Interfaces:**
- Consumes: Task 1~7
- Produces: `bfsGridTape(grid: number[][], start: [number,number], goal: [number,number]): Tape`,
  `<StageGrid />`, `<StageLane items={number[]} inSide="right" outSide="left" />`

- [ ] **Step 1: 실패 테스트** — 도달 가능한 격자에서 마지막 스텝의 `vars.dist` 가 최단 거리와 같다, 벽으로 막힌 격자에서 큐가 비고 "못 간다"로 끝난다, 시작=도착이면 거리 0
- [ ] **Step 2: 실패 확인 → `bfsGridTape` 구현 → 통과 확인**
- [ ] **Step 3: Python tracer 와 fixture, 대조 테스트 통과 확인**
- [ ] **Step 4: `StageGrid`·`StageLane` 구현** — 격자는 방문 순서가 보이게, 레인은 들어가는 쪽과 나오는 쪽을 화살표로 못박는다. **한 화면에 그림 하나** 규칙 때문에 좁은 화면에서는 격자와 큐를 위아래로 붙여 한 덩어리로 보이게 한다
- [ ] **Step 5: `bfs-grid.tsx` 본문 작성** — ①은 "소문은 어떻게 퍼질까"(격자를 눌러 벽을 놓고 번지는 걸 본다). ⑦ 신호에 "가중치가 없을 때만"을 넣는다
- [ ] **Step 6: `npm run build` 통과 확인 후 Commit** — `feat(algo): 격자 BFS 페이지`

---

### Task 9: 네비 탭 · 규약 문서 연결

**Files:**
- Modify: `src/components/layout/PublicNav.tsx`, `src/components/layout/MobileMenu.tsx`,
  `src/app/sitemap.ts`, `POSTING.md`, `CLAUDE.md`
- Create: `.claude/commands/algo.md`

- [ ] **Step 1: 네비에 네 번째 탭 추가** — `Active` 타입에 `"algo"` 추가, 아이콘은 `lucide-react` 에서 고른다. 모바일 메뉴에도 같이 넣는다
- [ ] **Step 2: `sitemap.ts` 에 `ready` 항목 추가**
- [ ] **Step 3: `POSTING.md` 에 `5-8. 알고리즘 학습 탭` 절 추가** — 별도 규약을 따른다는 한 줄과 설계 문서 링크. 5-3 스크롤 규칙이 여기 적용되지 않는다는 것을 명시
- [ ] **Step 4: `CLAUDE.md` 의 "스킬·커맨드를 고칠 때" 표에 `/algo` 행 추가**
- [ ] **Step 5: `.claude/commands/algo.md` 작성** — 개념 하나를 받아 `src/content/algo/<slug>.tsx` 를 쓰는 커맨드. 사양 3절 ①~⑦ 순서, 줄글 금지, 제목·소제목 규칙, `humanize` 를 거친다는 것까지 담는다
- [ ] **Step 6: `npm run build` · `npm test` 통과 확인 후 Commit** — `feat(algo): 네비 탭과 작성 규약`
