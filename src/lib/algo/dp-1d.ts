import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * 계단 오르기 — 한 번에 1칸 또는 2칸. dp[i] = i번 계단까지 올라가는 방법의 수.
 * dp[0] = 1 은 "시작 자리에 가만히 서 있는 방법" 하나라서다.
 */
export const CLIMB_CODE = [
  "def climb(n):", // 1
  "    dp = [0] * (n + 1)", // 2
  "    dp[0] = dp[1] = 1", // 3
  "    for i in range(2, n + 1):", // 4
  "        dp[i] = dp[i - 1] + dp[i - 2]", // 5
  "    return dp[n]", // 6
];

/** ①·④ 가 같이 쓰는 계단 수. 0번(시작 자리)부터 6번까지 7칸짜리 표다. */
export const STAIRS = 6;

/** ① 의 예측 문제 — 이 번호의 계단까지는 몇 가지일까. */
export const PREDICT_STAIR = 4;

/** 표 전체. dp[0] = dp[1] = 1 에서 시작해 앞 두 칸의 합으로 채운다. n 은 1 이상이다(파이썬도 n=0 이면 IndexError). */
export function climbTable(n: number): number[] {
  return climbTableWith(n, 1, 1);
}

function climbTableWith(n: number, d0: number, d1: number): number[] {
  if (!Number.isInteger(n) || n < 1) throw new RangeError("계단은 1칸 이상이어야 한다");
  const dp = new Array<number>(n + 1).fill(0);
  dp[0] = d0;
  dp[1] = d1;
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  return dp;
}

/** 초깃값을 바꿔 돌렸을 때 `dp[n]`. ⑥ 에서 초깃값이 틀리면 에러 없이 틀린 답이 나오는 걸 보인다. */
export function climbWith(n: number, d0: number, d1: number): number {
  return climbTableWith(n, d0, d1)[n];
}

/**
 * 한 번에 `steps` 칸(예: [1, 2, 3])씩 오를 수 있을 때 n번 계단까지의 방법 수.
 * dp[0] 은 `start0`(기본 1), dp[1] 은 1 — 코드의 `dp[0] = dp[1] = 1` 과 같다.
 * `start0` 을 0 으로 두면 시작 자리를 0가지로 센 틀린 값이 나온다.
 */
export function waysWithSteps(n: number, steps: number[], start0 = 1): number {
  const dp = new Array<number>(n + 1).fill(0);
  dp[0] = start0;
  if (n >= 1) dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    for (const s of steps) if (i - s >= 0) dp[i] += dp[i - s];
  }
  return dp[n];
}

/** ② 되짚기의 큰 수. 계단 50칸이면 방법이 이만큼이라 하나씩 세는 건 불가능하다. */
export const waysCount50 = climbTable(50)[50];

/** ① 에서 칸을 채울 때 고르는 값 하나. */
export type FillChoice = { value: number; correct: boolean };

/**
 * i번 칸에 넣을 값을 세 개 중에서 고른다. 오답은 독자가 실제로 할 법한 실수다 —
 * 앞 칸 하나만 쓴 값, 그리고 하나 더 센 값. 정답 자리는 칸마다 돌려 한 자리에 몰리지 않게 한다.
 */
export function fillChoices(table: number[], i: number): FillChoice[] {
  const right = { value: table[i], correct: true };
  const wrong = [
    { value: table[i - 1], correct: false },
    { value: table[i] + 1, correct: false },
  ];
  const at = i % 3;
  const out: FillChoice[] = [];
  let w = 0;
  for (let p = 0; p < 3; p++) out.push(p === at ? right : wrong[w++]);
  return out;
}

// ── ④ 플레이어 테이프 ──

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(n: number, i: number | null): Record<string, number> {
  const v: Record<string, number> = { n };
  if (i !== null) v.i = i;
  return v;
}

/**
 * 그림 한 장. `filled` 는 채워진 칸 수(앞에서부터), `cur` 는 지금 채우는 칸, `from` 은 그 칸이 읽는 앞 두 칸이다.
 * 아직 안 채운 칸은 코드 그대로 0 이다.
 */
function stage(dp: number[], filled: number, cur: number | null, from: number[], flagI: number | null) {
  const cells: CellState[] = dp.map((_, k) => {
    if (k === cur) return "current";
    if (from.includes(k)) return "compare";
    return k < filled ? "settled" : "out";
  });
  const flags: Record<string, number> = {};
  if (flagI !== null) flags.i = flagI;
  return { cells, flags, values: [...dp] };
}

function* walk(n: number): Generator<Step> {
  const dp = new Array<number>(n + 1).fill(0);

  yield {
    line: 2,
    vars: vars(n, null),
    stage: stage(dp, 0, null, [], null),
    note: `계단이 ${n}칸이니 시작 자리까지 ${n + 1}칸짜리 표를 0 으로 만듭니다`,
  };

  dp[0] = dp[1] = 1;
  yield {
    line: 3,
    vars: vars(n, null),
    stage: stage(dp, 2, null, [], null),
    note: "0번과 1번 칸은 1가지로 시작합니다. 시작 자리에 가만히 서 있기 1가지, 1번 계단은 한 칸 오르기 1가지입니다",
  };

  for (let i = 2; i <= n; i++) {
    yield {
      line: 4,
      vars: vars(n, i),
      stage: stage(dp, i, i, [i - 1, i - 2], i),
      note: `${i}번 칸을 채울 차례입니다. 앞의 ${i - 1}번 칸과 ${i - 2}번 칸을 읽습니다`,
    };
    dp[i] = dp[i - 1] + dp[i - 2];
    yield {
      line: 5,
      vars: vars(n, i),
      stage: stage(dp, i + 1, i, [i - 1, i - 2], i),
      note: `${i}번 계단 = 한 칸 아래에서 ${dp[i - 1]}가지 + 두 칸 아래에서 ${dp[i - 2]}가지 = ${dp[i]}가지`,
    };
  }

  yield {
    line: 4,
    vars: vars(n, n >= 2 ? n : null),
    stage: stage(dp, n + 1, null, [], null),
    note: "채울 칸이 더 없습니다. 표가 다 채워졌습니다",
  };

  yield {
    line: 6,
    vars: vars(n, n >= 2 ? n : null),
    stage: stage(dp, n + 1, null, [], null),
    note: `${n}번 계단까지 올라가는 방법은 ${dp[n]}가지입니다`,
    done: true,
  };
}

export function climbTape(n: number): Tape {
  if (!Number.isInteger(n) || n < 1) throw new RangeError("계단은 1칸 이상이어야 한다");
  return buildTape(walk(n), CLIMB_CODE);
}
