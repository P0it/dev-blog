import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * 구간 합을 뺄셈 한 번으로. 깔아 두는 줄(prefix)은 맨 앞에 0 을 한 칸 둔다 —
 * prefix[k] 는 "앞에서 k칸을 더한 값" 이라 prefix[0] = 0 이다.
 */
export const PREFIX_CODE = [
  "def range_sum(arr, left, right):", // 1
  "    prefix = [0]", // 2
  "    for i in range(len(arr)):", // 3
  "        prefix.append(prefix[i] + arr[i])", // 4
  "    ans = prefix[right + 1] - prefix[left]", // 5
  "    return ans", // 6
];

/** ①·④ 가 같이 쓰는 방문자 수. 10칸(0~9번). */
export const VISITS = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3];

/**
 * ① 의 질문 셋. [시작 칸, 끝 칸] — 둘 다 포함.
 * 세 번째가 0번 칸부터라 "앞에서 0칸 합 = 0" 이 실제로 쓰인다(⑥ 에서 되짚는다).
 */
export const QUESTIONS: [number, number][] = [
  [2, 6],
  [1, 8],
  [0, 9],
];

/** 한 칸씩 직접 더할 때 누르는 횟수 = 구간의 칸 수. */
export function handClicks(left: number, right: number): number {
  return right - left + 1;
}

/** 깔아 둔 줄. 맨 앞에 0 이 있어 길이가 n+1 이다. */
export function prefixOf(arr: number[]): number[] {
  const p = [0];
  for (let i = 0; i < arr.length; i++) p.push(p[i] + arr[i]);
  return p;
}

/** 깔아 둔 줄에서 두 칸만 읽어 뺀다. */
export function rangeSum(prefix: number[], left: number, right: number): number {
  return prefix[right + 1] - prefix[left];
}

/**
 * 맨 앞 0 을 빼먹은 누적합으로 `cum[right] - cum[left - 1]` 을 하면 어떻게 되나.
 * left 가 0 이면 `cum[-1]` — 파이썬은 오류 없이 **맨 뒤 칸**을 읽는다. JS `at(-1)` 도 같다.
 */
export function rangeSumWithoutZero(arr: number[], left: number, right: number): number {
  const cum: number[] = [];
  let s = 0;
  for (const x of arr) {
    s += x;
    cum.push(s);
  }
  return cum[right] - (cum.at(left - 1) ?? 0);
}

/**
 * ② 되짚기 — 질문이 많을 때의 횟수.
 * 한 칸씩 더하기는 질문마다 최대 칸 수만큼, 누적합은 한 번 깔고(칸 수) 질문마다 두 칸만 읽는다.
 */
export function bulkOps(cells: number, queries: number): { naive: number; prefix: number } {
  return { naive: cells * queries, prefix: cells + 2 * queries };
}

// ── ④ 플레이어 테이프 ──

type Row = { values: number[]; cells: CellState[]; flags: Record<string, number> };

/** 그림 한 장. 위 줄은 방문자 수, 아래 줄은 지금까지 깔린 합. */
function stage(
  arr: number[],
  prefix: number[],
  top: (k: number) => CellState,
  bottom: (k: number) => CellState,
  topFlags: Record<string, number>,
  bottomFlags: Record<string, number>,
) {
  const below: Row = {
    values: [...prefix],
    cells: prefix.map((_, k) => bottom(k)),
    flags: bottomFlags,
  };
  return { cells: arr.map((_, k) => top(k)), flags: topFlags, values: [...arr], below };
}

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(left: number, right: number, i: number | null, ans: number | null): Record<string, number> {
  const v: Record<string, number> = { left, right };
  if (i !== null) v.i = i;
  if (ans !== null) v.ans = ans;
  return v;
}

function* walk(arr: number[], left: number, right: number): Generator<Step> {
  const prefix = [0];
  let i: number | null = null;
  let ans: number | null = null;

  const building = (cur: number | null, newest: boolean) =>
    stage(
      arr,
      prefix,
      (k) => (cur !== null && k === cur ? "current" : cur === null || k < cur ? "settled" : "out"),
      (k) => (newest && k === prefix.length - 1 ? "current" : "settled"),
      cur === null ? {} : { i: cur },
      {},
    );

  const asking = () =>
    stage(
      arr,
      prefix,
      (k) => (k < left ? "dropped" : k <= right ? "settled" : "out"),
      (k) => (k === right + 1 ? "current" : k === left ? "dropped" : "out"),
      { left, right },
      { "right+1": right + 1, left },
    );

  yield {
    line: 2,
    vars: vars(left, right, i, ans),
    stage: building(null, false),
    note: "깔아 둘 줄을 [0] 한 칸으로 시작합니다. 앞에서 0칸을 더한 값은 0 입니다",
  };

  for (let k = 0; k < arr.length; k++) {
    i = k;
    yield {
      line: 3,
      vars: vars(left, right, i, ans),
      stage: building(k, false),
      note: `${k}번 칸을 볼 차례입니다`,
    };
    const before = prefix[k];
    prefix.push(before + arr[k]);
    yield {
      line: 4,
      vars: vars(left, right, i, ans),
      stage: building(k, true),
      note: `앞에서 ${k + 1}칸 합 = 앞에서 ${k}칸 합 ${before} + ${arr[k]} = ${prefix[k + 1]}`,
    };
  }

  yield {
    line: 3,
    vars: vars(left, right, i, ans),
    stage: building(null, false),
    note: "더 볼 칸이 없습니다. 줄이 다 깔렸습니다",
  };

  ans = prefix[right + 1] - prefix[left];
  yield {
    line: 5,
    vars: vars(left, right, i, ans),
    stage: asking(),
    note: `${prefix[right + 1]} − ${prefix[left]} = ${ans}. 뺄셈 한 번으로 ${left}번 칸부터 ${right}번 칸까지의 합이 나옵니다`,
  };

  yield {
    line: 6,
    vars: vars(left, right, i, ans),
    stage: asking(),
    note: `답은 ${ans} 입니다`,
    done: true,
  };
}

export function prefixTape(arr: number[], left: number, right: number): Tape {
  return buildTape(walk(arr, left, right), PREFIX_CODE);
}
