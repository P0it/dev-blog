import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/** 같은 값이 둘 있는지 **모든 쌍**을 견줘 보는 코드. 한 번 견줄 때마다 count 가 1 오른다. */
export const PAIRS_CODE = [
  "def has_duplicate(arr):", // 1
  "    n = len(arr)", // 2
  "    count = 0", // 3
  "    for i in range(n):", // 4
  "        for j in range(i + 1, n):", // 5
  "            count += 1", // 6
  "            if arr[i] == arr[j]:", // 7
  "                return True", // 8
  "    return False", // 9
];

function stage(values: number[], i: number | null, j: number | null, hit: boolean) {
  const cells: CellState[] = values.map((_, k) => {
    if (hit && (k === i || k === j)) return "settled";
    if (k === i) return "current";
    if (k === j) return "compare";
    return "out";
  });
  const flags: Record<string, number> = {};
  if (i !== null) flags.i = i;
  if (j !== null) flags.j = j;
  return { cells, flags, values: [...values] };
}

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(n: number, count: number | null, i: number | null, j: number | null) {
  const v: Record<string, number> = { n };
  if (count !== null) v.count = count;
  if (i !== null) v.i = i;
  if (j !== null) v.j = j;
  return v;
}

function* walk(input: number[]): Generator<Step> {
  const arr = [...input];
  const n = arr.length;
  let count = 0;
  let i: number | null = null;
  let j: number | null = null;

  yield { line: 2, vars: vars(n, null, null, null), stage: stage(arr, null, null, false), note: `칸이 ${josa(n, "", "")}개입니다` };
  yield { line: 3, vars: vars(n, 0, null, null), stage: stage(arr, null, null, false), note: "견준 횟수를 0 으로 시작합니다" };

  for (let a = 0; a < n; a++) {
    i = a;
    j = a === 0 ? null : j; // 바깥 루프가 돌아도 j 는 직전 값이 남는다
    yield { line: 4, vars: vars(n, count, i, j), stage: stage(arr, i, null, false), note: `${a}번 칸을 기준으로 잡습니다` };

    for (let b = a + 1; b < n; b++) {
      j = b;
      yield { line: 5, vars: vars(n, count, i, j), stage: stage(arr, i, j, false), note: `${b}번 칸을 짝으로 잡습니다` };
      count++;
      yield { line: 6, vars: vars(n, count, i, j), stage: stage(arr, i, j, false), note: `${count}번째로 견줍니다` };
      const same = arr[a] === arr[b];
      yield {
        line: 7,
        vars: vars(n, count, i, j),
        stage: stage(arr, i, j, false),
        note: same ? `${josa(arr[a], "과", "와")} ${arr[b]}, 같습니다` : `${josa(arr[a], "과", "와")} ${arr[b]}, 다릅니다`,
      };
      if (same) {
        yield { line: 8, vars: vars(n, count, i, j), stage: stage(arr, i, j, true), note: `같은 값을 찾았습니다. ${count}번 견줬습니다`, done: true };
        return;
      }
    }
    // 안쪽 반복이 끝나는 자리(다음 짝이 없다)
    yield { line: 5, vars: vars(n, count, i, j), stage: stage(arr, i, null, false), note: `${a}번 칸의 짝을 다 봤습니다` };
  }

  yield { line: 4, vars: vars(n, count, i, j), stage: stage(arr, null, null, false), note: "기준으로 잡을 칸이 더 없습니다" };
  yield { line: 9, vars: vars(n, count, i, j), stage: stage(arr, null, null, false), note: `같은 값이 없습니다. ${count}번 견줬습니다`, done: false };
}

export function pairsTape(input: number[]): Tape {
  return buildTape(walk(input), PAIRS_CODE);
}

// ── 횟수 세기 — 비교용이라 테이프를 만들지 않는다 ──

/**
 * Python 이 1초에 하는 일의 수(보수적 어림값). 1천만~3천만 번 사이인데 여유 있게 하한을 쓴다.
 * `1억 번` 은 C++ 감각이라 이 탭(Python)에서는 한계선에 닿는 값을 "된다"고 하게 만든다.
 */
export const OPS_PER_SECOND = 10_000_000;

export type Growth = "linear" | "nlogn" | "square" | "exp";

/** 칸이 n 개일 때 걸리는 횟수. 2^n 은 넘치므로 `log10Ops` 와 같이 쓴다. */
export function ops(kind: Growth, n: number): number {
  switch (kind) {
    case "linear":
      return n;
    case "nlogn":
      return Math.round(n * Math.log2(Math.max(n, 1)));
    case "square":
      return n * n;
    case "exp":
      return n < 1000 ? 2 ** n : Infinity;
  }
}

/** 횟수의 상용로그. 2^n 처럼 숫자로 못 담는 값도 크기는 말할 수 있다. */
export function log10Ops(kind: Growth, n: number): number {
  if (kind === "exp") return n * Math.log10(2);
  return Math.log10(Math.max(ops(kind, n), 1));
}

/** 모든 쌍을 견주는 횟수 n(n-1)/2. */
export function pairCount(n: number): number {
  return (n * (n - 1)) / 2;
}

/** 이 횟수를 컴퓨터가 끝내는 데 걸리는 시간을 사람 말로. 로그값을 받아 넘침을 피한다. */
export function timeLabel(log10: number, perSecond: number = OPS_PER_SECOND): string {
  const secLog = log10 - Math.log10(perSecond);
  if (secLog <= 0) return "1초 안";
  const sec = 10 ** secLog;
  if (secLog < Math.log10(60)) return `${Math.round(sec)}초`;
  if (secLog < Math.log10(3600)) return `${Math.round(sec / 60)}분`;
  if (secLog < Math.log10(86400)) return `${Math.round(sec / 3600)}시간`;
  if (secLog < Math.log10(86400 * 365)) return `${Math.round(sec / 86400)}일`;
  const years = secLog - Math.log10(86400 * 365);
  if (years < 10) return `${Math.round(10 ** years).toLocaleString("ko-KR")}년`;
  return "우주 나이보다 길다";
}

/** 1초 안에 끝나는지. */
export function fitsInSecond(log10: number, perSecond: number = OPS_PER_SECOND): boolean {
  return log10 <= Math.log10(perSecond);
}

/** 횟수 표기. 1조를 넘으면 10^k 로 적는다. */
export function opsLabel(log10: number): string {
  if (log10 < 12) return Math.round(10 ** log10).toLocaleString("ko-KR");
  return `10^${Math.round(log10)}`;
}
