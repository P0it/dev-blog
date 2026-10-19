/**
 * 알고리즘 학습 탭의 스텝 테이프 타입.
 * 설계: docs/superpowers/specs/2026-10-17-algo-visualizer-design.md
 */

/** 칸·노드 하나의 상태. 색은 globals.css 토큰에 매핑한다(하드코딩 ✗). */
export type CellState =
  | "current" // 지금 보고 있는 칸
  | "compare" // 견주는 중
  | "settled" // 정렬 완료·방문 끝·확정
  | "dropped" // 범위에서 잘려 나간 것
  | "out" // 아직 안 건드린 것 / 범위 밖
  | "waiting"; // 큐·힙에서 차례를 기다리는 것

/** 그림(무대)이 한 스텝에 그릴 상태. */
export type StageState = {
  /** 칸 트랙·격자의 칸마다 상태 하나 */
  cells: CellState[];
  /** 칸 위에 꽂히는 깃발. `{ left: 0, mid: 4, right: 9 }` */
  flags: Record<string, number>;
  /** 이 스텝에서의 값들. 정렬처럼 값이 움직이는 알고리즘이 쓴다 */
  values?: number[];
  /** 레인(스택·큐·힙)에 담긴 값. 없으면 그리지 않는다 */
  queue?: number[];
  /** 칸 트랙 아래에 붙는 두 번째 줄(누적합처럼 원래 배열과 파생 배열을 같이 볼 때). 값이 모자란 칸은 빈 칸으로 그린다 */
  below?: { values: number[]; cells: CellState[]; flags: Record<string, number> };
  /** 칸 트랙에서 지금 비어 있는 칸 번호(줄 서기처럼 한 칸씩 밀어 자리를 만들 때). 그 칸은 값을 숨기고 점선 빈칸으로 그린다 */
  gap?: number;
  /** 호출 탑 — 아래가 먼저 부른 층이다. `ret` 이 있으면 그 층이 값을 돌려주며 걷히는 중이다 */
  frames?: { n: number; ret?: number }[];
  /** 글자를 한 칸씩 읽는 입력(괄호 검사). `cells` 가 이 글자들의 상태이고 `flags.i` 가 지금 읽는 글자다 */
  chars?: string[];
  /** 스택에 담긴 글자. 앞이 먼저 넣은 것(아래)이고 맨 뒤가 맨 위다 */
  stack?: string[];
  /**
   * 줄(큐·덱) 처리. `served` 는 지금까지 받고 내보낸 사람, `shifted` 는 같은 일을 리스트 `pop(0)` 으로 했다면
   * 지금까지 한 칸씩 당겼을 칸 수, `hot` 은 이 스텝에서 사람이 드나든 끝이다.
   */
  line?: { served: number[]; shifted: number; hot?: "front" | "back" };
  /**
   * 사물함(해시 표). `buckets[i]` 는 i 번 칸에 이어 붙은 이름표(먼저 온 것이 앞), `hot` 은 지금 열어 본 칸,
   * `name` 은 지금 다루는 이름표, `scan` 은 `hot` 칸 안에서 지금까지 훑은 이름표 수.
   */
  hash?: { buckets: string[][]; hot?: number; name?: string; scan?: number };
  /**
   * 병합(합치기). 위 줄(`values`·`cells`)은 원래 줄 전체이고, 지금 합치는 구간 `[lo, hi)` 가 켜진다 —
   * 앞 `mid` 칸이 왼쪽 묶음, 나머지가 오른쪽 묶음이다. 아래 줄은 `result` 에 쌓인, 합쳐서 만드는 줄이다.
   * `mode`: split(반으로 나눔) · ready(합칠 두 묶음) · compare(맨 앞 둘 견주기) · place(한 장 내려놓음, `side` 가 쪽) ·
   * rest(남은 묶음 이어 붙임) · done(합치기 끝). `taken` 은 묶음별로 지금까지 내려놓은 카드 수다.
   */
  merge?: {
    lo: number;
    hi: number;
    mid: number;
    mode: "split" | "ready" | "compare" | "place" | "rest" | "done";
    taken: { left: number; right: number };
    side?: "left" | "right";
    result: number[];
  };
  /**
   * 섬 지도(연결 요소). `land[i]` 는 i 번 칸이 땅인지, `owner[i]` 는 그 칸을 칠한 섬 번호(0부터, 안 칠했으면 null),
   * `queue` 는 큐에 든 칸 번호(앞이 먼저 나감), `scan` 은 바깥 반복문이 지금 훑는 칸, `now` 는 큐에서 방금 꺼낸 칸이다.
   * 칸 번호는 `행 * cols + 열` 이다.
   */
  island?: {
    cols: number;
    land: boolean[];
    owner: (number | null)[];
    queue: number[];
    scan?: number;
    now?: number;
  };
  /**
   * 수첩(메모이제이션). `notebook` 은 지금까지 수첩에 적힌 `n → fib(n)`(적은 순서), `hit` 은 이 스텝이
   * 수첩에서 꺼내 쓰는 순간이다. 호출 탑은 `frames` 가 그린다.
   */
  memo?: { notebook: { n: number; v: number }[]; hit?: boolean };
  /**
   * 지도(다익스트라). `dist[i]` 는 i 번 곳까지 지금까지 알려진 가장 빠른 시간(분), 아직 길을 모르면 null(∞).
   * `confirmed` 는 확정한 곳, `now` 는 지금 다루는 곳, `look` 은 지금 견주는 이웃, `changed` 는 방금 시간이 고쳐진 곳.
   * `queue` 는 큐에 든 `[거리, 곳 번호]` — 앞이 먼저 나간다. 곳 이름과 번호는 `lib/algo/dijkstra.ts` 의 NAMES 다.
   */
  graph?: {
    dist: (number | null)[];
    confirmed: boolean[];
    now?: number;
    look?: number;
    changed?: number[];
    queue: [number, number][];
  };
  /**
   * 거스름돈. `values` 는 큰 동전부터 늘어놓은 동전 줄, `at` 은 지금 보는 동전 칸(아직 반복에 들어가기 전이면 null),
   * `given` 은 지금까지 바구니에 담은 동전(낸 순서), `left` 는 남은 돈이다.
   */
  coins?: { values: number[]; at: number | null; given: number[]; left: number };
  /**
   * 시간표(회의실 배정). `rows` 는 지금 순서대로 늘어선 회의 한 줄씩(`name` 은 회의 이름, `s`·`e` 는 시작·끝 시각)이고,
   * 줄마다 상태는 `cells` 가 쥔다(고름 settled · 지금 보는 current · 건너뜀 dropped · 아직 out).
   * `end` 는 지금까지 고른 회의 가운데 가장 늦은 끝 시각 — 시간표에 세로 선으로 그린다. 시간 축은 `lib/algo/activity-selection.ts` 의 AXIS 다.
   */
  timeline?: { rows: { name: string; s: number; e: number }[]; end?: number };
  /**
   * 0/1 배낭 표. `dp[i][w]` 는 물건을 i 개까지 보고 가방 용량이 w 일 때 담을 수 있는 최대 가치(코드의 dp 그대로),
   * `done[i][w]` 는 그 칸을 이미 채웠는지, `cur` 는 지금 채우는 칸 `[i, w]`, `from` 은 그 칸이 읽는 칸들(안 담기 = 바로 위 칸,
   * 담기 = 무게만큼 왼쪽 위 칸)이다. `items` 는 물건 이름·무게·값, `W` 는 가방 용량이다.
   */
  knap?: {
    items: { name: string; w: number; v: number }[];
    W: number;
    dp: number[][];
    done: boolean[][];
    cur?: [number, number];
    from?: [number, number][];
  };
  /**
   * 줄 서는 순서(순열·백트래킹). `items` 는 줄 설 친구들, `path` 는 지금 자리에 선 친구의 번호(items 의 칸, 앞자리부터),
   * `used` 는 친구마다 섰는지, `result` 는 지금까지 결과에 담은 순서들(글자를 이은 것)이다.
   * `mode` 는 이 스텝이 한 일: start(아무도 안 섬) · choose(친구를 세우고 다음 자리로) · found(자리가 다 차 결과에 담음) ·
   * undo(마지막 친구를 뺌) · done(모두 끝). `i` 는 이 스텝에서 세우거나 뺀 친구의 번호다.
   */
  perm?: {
    items: string[];
    path: number[];
    used: boolean[];
    result: string[];
    mode: "start" | "choose" | "found" | "undo" | "done";
    i?: number;
  };
  /**
   * 로봇 방(시뮬레이션). 칸 번호는 `행 * cols + 열` 이고 `walls[i]` 는 그 칸이 벽인지, `(r, c)` 와 `d` 는 로봇의 칸과 방향
   * (0 위 · 1 오른쪽 · 2 아래 · 3 왼쪽), `trail` 은 지나온 칸 번호(시작 칸부터 순서대로)다. `cmds` 는 명령 전체이고 `at` 은
   * 지금 읽는 명령 번호(아직 안 읽었으면 -1, 다 읽었으면 `cmds.length`), `done` 은 끝난 명령 수, `cmd` 는 지금 읽은 명령이다.
   * `ahead` 는 F 가 가려는 앞 칸 번호(방 바깥이면 null), `block` 은 그 칸이 못 가는 칸이면 이유(벽·바깥)다.
   */
  robot?: {
    rows: number;
    cols: number;
    walls: boolean[];
    r: number;
    c: number;
    d: number;
    trail: number[];
    cmds: string[];
    at: number;
    done: number;
    cmd: string | null;
    ahead: number | null;
    block: "wall" | "edge" | null;
  };
  /**
   * N-퀸 보드. `at[r]` 은 r 번째 줄에 놓인 퀸의 칸 번호(아직 없으면 -1), `row` 는 지금 보는 줄, `try` 는 이 스텝에서
   * 놓거나 거둔 칸이다. `mode`: scan(놓을 수 있는 칸을 찾는 중) · place(방금 놓음) · back(방금 거둠) ·
   * stuck(놓을 칸이 없어 앞 줄로 돌아감) · done(모든 줄에 놓음). 노리는 칸은 보드가 `at` 으로 직접 계산한다.
   */
  queens?: { n: number; at: number[]; row: number; try?: number; mode: "scan" | "place" | "back" | "stuck" | "done" };
  /**
   * 에라토스테네스의 체 수 격자. `erased[m]` 은 수 m 이 지워졌는지(0 은 쓰지 않는다), `i` 는 지금 보는 수,
   * `plan` 은 이번에 지울 예정인 배수, `fresh` 는 이 스텝에서 새로 지운 수, `done` 이면 남은 수(소수)를 강조한다.
   */
  sieve?: { n: number; erased: boolean[]; i?: number; plan?: number[]; fresh?: number[]; done?: boolean };
  /** 경우를 한 줄씩 적는 표. 아직 안 한 줄은 todo, 지금 보는 줄은 current, 한도 안 최고 값을 쥔 줄은 best */
  table?: {
    head: string[];
    rows: { cells: string[]; state: "todo" | "current" | "done" | "best" | "over" }[];
  };
};

/** 코드 한 줄이 실행된 순간. */
export type Step = {
  /** 켤 코드 줄 번호 (1-base) */
  line: number;
  /** 변수 바에 찍을 값 */
  vars: Record<string, number>;
  stage: StageState;
  /** 스텝 설명 한 줄 */
  note: string;
  /** 마지막 스텝에서만 쓴다. 찾았으면 true, 못 찾았으면 false */
  done?: boolean;
};

export type Tape = {
  steps: Step[];
  /** 화면에 보여 줄 Python 코드. 줄 번호는 1-base */
  code: string[];
  /** 색을 칠한 코드 줄(`highlightTape`). 없으면 색 없이 `code` 를 그린다 */
  html?: string[];
  /** 스텝 상한에 닿아 끊겼는지 */
  truncated: boolean;
};
