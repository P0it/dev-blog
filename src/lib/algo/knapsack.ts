import type { Step, StageState, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * 0/1 배낭 — 물건마다 담거나 말거나 둘 중 하나. dp[i][w] = 물건을 i 개까지 보고 가방 용량이 w 일 때 담을 수 있는 최대 가치.
 * 0행(물건 0개)과 0열(용량 0)은 처음부터 0 이라 반복문은 1 부터 돈다.
 */
export const KNAP_CODE = [
  "def knapsack(items, W):", // 1
  "    n = len(items)", // 2
  "    dp = [[0] * (W + 1) for _ in range(n + 1)]", // 3
  "    for i in range(1, n + 1):", // 4
  "        wt, val = items[i - 1]", // 5
  "        for w in range(1, W + 1):", // 6
  "            dp[i][w] = dp[i - 1][w]", // 7
  "            if w >= wt:", // 8
  "                dp[i][w] = max(dp[i][w], dp[i - 1][w - wt] + val)", // 9
  "    return dp[n][W]", // 10
];

export type Item = { name: string; w: number; v: number };

/** ① 과 ④ 가 함께 쓰는 입력. 물건 셋, 가방 용량 5. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다. */
export const ITEMS: Item[] = [
  { name: "A", w: 2, v: 3 },
  { name: "B", w: 3, v: 4 },
  { name: "C", w: 4, v: 5 },
];
export const CAPACITY = 5;

/** 표 전체. 0행·0열은 0 이고 나머지는 max(안 담기, 담기) 로 채운다. */
export function knapTable(items: Item[] = ITEMS, W: number = CAPACITY): number[][] {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const { w: wt, v } = items[i - 1];
    for (let w = 1; w <= W; w++) {
      dp[i][w] = dp[i - 1][w];
      if (w >= wt) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - wt] + v);
    }
  }
  return dp;
}

export function bestValue(items: Item[] = ITEMS, W: number = CAPACITY): number {
  return knapTable(items, W)[items.length][W];
}

/** 표를 거꾸로 따라가 담은 물건(번호 0부터, 작은 것부터)을 찾는다. 위 칸과 값이 다르면 그 물건을 담은 것이다. */
export function traceBack(items: Item[] = ITEMS, W: number = CAPACITY): number[] {
  const dp = knapTable(items, W);
  const took: number[] = [];
  let w = W;
  for (let i = items.length; i >= 1; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      took.push(i - 1);
      w -= items[i - 1].w;
    }
  }
  return took.reverse();
}

/** 칸 하나가 읽는 후보. `take` 가 null 이면 무게가 용량보다 커서 담을 수 없다. */
export type CellInfo = {
  i: number;
  w: number;
  /** 안 담기 = 바로 위 칸 값 */
  skip: number;
  /** 담기를 고르면 더하기 전의 왼쪽 위 칸 값(무게만큼 왼쪽). 담을 수 없으면 null */
  left: number | null;
  /** 담기 = 왼쪽 위 칸 값 + 이 물건의 값. 담을 수 없으면 null */
  take: number | null;
  /** 이 칸의 답 = 더 큰 쪽 */
  answer: number;
  /** 담는 쪽이 더 큰가 */
  takeWins: boolean;
};

export function cellInfo(table: number[][], i: number, w: number, items: Item[] = ITEMS): CellInfo {
  const { w: wt, v } = items[i - 1];
  const skip = table[i - 1][w];
  const can = w >= wt;
  const left = can ? table[i - 1][w - wt] : null;
  const take = left === null ? null : left + v;
  return { i, w, skip, left, take, answer: table[i][w], takeWins: take !== null && take > skip };
}

/** ① 에서 독자가 채울 칸들(1행·1열부터, 한 줄씩 왼쪽에서 오른쪽으로). */
export function choiceCells(items: Item[] = ITEMS, W: number = CAPACITY): CellInfo[] {
  const t = knapTable(items, W);
  const out: CellInfo[] = [];
  for (let i = 1; i <= items.length; i++) for (let w = 1; w <= W; w++) out.push(cellInfo(t, i, w, items));
  return out;
}

/** ① 의 예측 보기. 정답이 첫 번째이고, 오답은 독자가 할 법한 두 가지다 — 전부 담은 값, 가장 값진 물건 하나만 담은 값. */
export function predictOptions(items: Item[] = ITEMS, W: number = CAPACITY): { value: number; correct: boolean }[] {
  return [
    { value: bestValue(items, W), correct: true },
    { value: items.reduce((s, x) => s + x.v, 0), correct: false },
    { value: Math.max(...items.map((x) => x.v)), correct: false },
  ];
}

/** ② 되짚기의 큰 수. 물건 n 개를 담을지 말지 모든 경우, 그리고 표의 칸 수. */
export const subsetCount = (n: number): number => 2 ** n;
export const tableCells = (n: number, W: number): number => n * W;

// ── ⑥ 틀리는 자리 ──

/**
 * `if w >= wt` 를 뺀 코드. 무게가 용량보다 크면 `w - wt` 가 음수라 파이썬은 그 줄의 **끝에서부터** 칸을 읽는다
 * (에러 없이 조용히 틀린다). `Array.prototype.at` 이 같은 규칙이다.
 */
export function knapNoCheck(items: Item[] = ITEMS, W: number = CAPACITY): number {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const { w: wt, v } = items[i - 1];
    for (let w = 1; w <= W; w++) {
      const read = dp[i - 1].at(w - wt);
      if (read === undefined) throw new RangeError("list index out of range");
      dp[i][w] = Math.max(dp[i - 1][w], read + v);
    }
  }
  return dp[n][W];
}

/** 1차원 배열로 줄인 풀이. `backward` 가 참이면 용량을 큰 쪽부터 거꾸로 돈다(0/1 배낭이 맞다). */
function oneDim(items: Item[], W: number, backward: boolean): number[] {
  const dp = new Array<number>(W + 1).fill(0);
  for (const { w: wt, v } of items) {
    if (backward) {
      for (let w = W; w >= wt; w--) dp[w] = Math.max(dp[w], dp[w - wt] + v);
    } else {
      for (let w = wt; w <= W; w++) dp[w] = Math.max(dp[w], dp[w - wt] + v);
    }
  }
  return dp;
}
export const knap1dBackward = (items: Item[] = ITEMS, W: number = CAPACITY): number[] => oneDim(items, W, true);
/** 앞에서부터 돌면 같은 물건을 여러 번 담는다(무한 배낭). */
export const knap1dForward = (items: Item[] = ITEMS, W: number = CAPACITY): number[] => oneDim(items, W, false);

/** 무게당 가치가 큰 물건부터 담는 그리디. 들어가지 않으면 건너뛴다. */
export function greedyByRatio(items: Item[] = ITEMS, W: number = CAPACITY): number {
  let total = 0;
  let value = 0;
  for (const x of [...items].sort((a, b) => b.v / b.w - a.v / a.w)) {
    if (total + x.w <= W) {
      total += x.w;
      value += x.v;
    }
  }
  return value;
}

/** 그리디가 틀리는 작은 반례: P 를 먼저 담으면 Q·R 이 못 들어가 5, 표는 Q+R 로 6. */
export const GREEDY_COUNTER = {
  items: [
    { name: "P", w: 3, v: 5 },
    { name: "Q", w: 2, v: 3 },
    { name: "R", w: 2, v: 3 },
  ] as Item[],
  W: 4,
};

// ── ④ 플레이어 테이프 ──

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(i: number | null, w: number | null, wt: number | null, val: number | null): Record<string, number> {
  const v: Record<string, number> = {};
  if (i !== null) v.i = i;
  if (w !== null) v.w = w;
  if (wt !== null) v.wt = wt;
  if (val !== null) v.val = val;
  return v;
}

function stage(
  items: Item[],
  W: number,
  dp: number[][],
  done: boolean[][],
  cur?: [number, number],
  from?: [number, number][],
): StageState {
  return {
    cells: [],
    flags: {},
    knap: { items, W, dp: dp.map((r) => [...r]), done: done.map((r) => [...r]), cur, from },
  };
}

function* walk(items: Item[], W: number): Generator<Step> {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(W + 1).fill(0));
  // 0행과 0열은 처음부터 정해진 값이라 채워진 것으로 본다
  const done = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: W + 1 }, (_, w) => i === 0 || w === 0));
  let wv: number | null = null; // 파이썬은 안쪽 반복이 끝나도 w 를 지우지 않는다

  yield {
    line: 3,
    vars: vars(null, null, null, null),
    stage: stage(items, W, dp, done),
    note: `물건 ${n}개와 용량 ${W}에 맞춰 ${n + 1}행 × ${W + 1}열 표를 만들고 칸을 모두 0으로 채웁니다`,
  };

  for (let i = 1; i <= n; i++) {
    const { name, w: wt, v: val } = items[i - 1];
    yield {
      line: 5,
      vars: vars(i, wv, wt, val),
      stage: stage(items, W, dp, done),
      note: `물건 ${name}를 볼 차례입니다. 무게 ${wt}, 값 ${val}`,
    };

    for (let w = 1; w <= W; w++) {
      wv = w;
      dp[i][w] = dp[i - 1][w];
      const up = dp[i - 1][w];
      if (w >= wt) {
        yield {
          line: 7,
          vars: vars(i, w, wt, val),
          stage: stage(items, W, dp, done, [i, w], [[i - 1, w]]),
          note: `먼저 ${name}를 안 담은 값을 적습니다. 바로 위 칸 ${up} 그대로입니다`,
        };
        const left = dp[i - 1][w - wt];
        const take = left + val;
        const bigger = take > dp[i][w];
        if (bigger) dp[i][w] = take;
        done[i][w] = true;
        yield {
          line: 9,
          vars: vars(i, w, wt, val),
          stage: stage(items, W, dp, done, [i, w], [[i - 1, w], [i - 1, w - wt]]),
          note: bigger
            ? `담으면 ${left} + ${val} = ${take}입니다. 안 담은 값 ${up}보다 커서 이 칸을 고칩니다`
            : `담으면 ${left} + ${val} = ${take}입니다. 안 담은 값 ${up}보다 크지 않아 그대로 둡니다`,
        };
      } else {
        done[i][w] = true;
        yield {
          line: 7,
          vars: vars(i, w, wt, val),
          stage: stage(items, W, dp, done, [i, w], [[i - 1, w]]),
          note: `용량 ${w}에는 무게 ${wt}짜리 ${name}를 담을 수 없습니다. 위 칸 ${up} 그대로 둡니다`,
        };
      }
    }
  }

  for (const row of done) row.fill(true);
  yield {
    line: 10,
    vars: vars(n > 0 ? n : null, wv, n > 0 ? items[n - 1].w : null, n > 0 ? items[n - 1].v : null),
    stage: stage(items, W, dp, done),
    note: `용량 ${W}의 가방에 담을 수 있는 최대 가치는 ${dp[n][W]}입니다`,
    done: true,
  };
}

export function knapsackTape(items: Item[] = ITEMS, W: number = CAPACITY): Tape {
  return buildTape(walk(items, W), KNAP_CODE);
}

/** 예측 관문 자리 — (2, 5) 칸의 담기 후보를 계산하는 9번 줄 직전. 바로 앞 스텝은 같은 칸의 7번 줄이다. */
export function knapGate(tape: Tape): number {
  return tape.steps.findIndex((s) => s.line === 9 && s.vars.i === 2 && s.vars.w === 5);
}
