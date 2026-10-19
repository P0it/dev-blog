import type { CellState, StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * 화면에 보여 주는 Python 코드. 아래 제너레이터가 이 줄 번호를 따라간다.
 *
 * 스텝으로 올리는 줄은 4·7·13·14·17·19·20 뿐이다(`MERGE_SHOWN`). 나머지(base case·재귀 부르기·`i += 1`)는
 * 바로 앞뒤 줄의 상태에 들어 있어서, 올리면 스텝이 100 개를 넘어 연타로 끝나는 플레이어가 된다.
 * 함수 이름이 `merge_sort` 라 플레이어 에디터 탭이 `merge_sort.py` 로 뜬다.
 */
export const MERGE_SORT_CODE = [
  "def merge_sort(arr):", // 1
  "    if len(arr) <= 1:", // 2
  "        return arr", // 3
  "    mid = len(arr) // 2", // 4
  "    left = merge_sort(arr[:mid])", // 5
  "    right = merge_sort(arr[mid:])", // 6
  "    return merge(left, right)", // 7
  "", // 8
  "def merge(left, right):", // 9
  "    result = []", // 10
  "    i = j = 0", // 11
  "    while i < len(left) and j < len(right):", // 12
  "        if left[i] <= right[j]:", // 13
  "            result.append(left[i])", // 14
  "            i += 1", // 15
  "        else:", // 16
  "            result.append(right[j])", // 17
  "            j += 1", // 18
  "    result += left[i:] + right[j:]", // 19
  "    return result", // 20
];

/** 스텝으로 올리는 줄. fixture 를 만드는 파이썬 스크립트의 `SHOWN` 과 같아야 한다. */
export const MERGE_SHOWN = [4, 7, 13, 14, 17, 19, 20];

/** ④ 플레이어의 카드. 마지막 합치기가 ① 해 보기의 두 묶음과 같다 — ① 에서 한 일이 ④ 의 마지막 장면이다. */
export const MERGE_CARDS = [5, 2, 9, 1, 7, 4];
/** ① 해 보기의 두 묶음. 각각 이미 작은 수부터 서 있다. */
export const MERGE_LEFT = [2, 5, 9];
export const MERGE_RIGHT = [1, 4, 7];

/** ② 그림의 여덟 장. */
export const MERGE_TREE_CARDS = [6, 3, 8, 1, 7, 2, 5, 4];

type Merge = NonNullable<StageState["merge"]>;

const fmt = (a: number[]) => `[${a.join(", ")}]`;

/** 위 줄의 칸 상태. 합치는 구간 밖은 `out`, 구간 안은 모드와 내려놓은 수로 정한다. */
function topCells(n: number, m: Merge): CellState[] {
  return Array.from({ length: n }, (_, k) => {
    if (k < m.lo || k >= m.hi) return "out";
    const onLeft = k < m.lo + m.mid;
    const idx = onLeft ? k - m.lo : k - m.lo - m.mid;
    const used = onLeft ? m.taken.left : m.taken.right;
    switch (m.mode) {
      case "split":
      case "ready":
        return "waiting";
      case "compare":
        // 견주는 중 — 두 묶음의 맨 앞 카드가 compare, 이미 내려놓은 카드는 settled
        return idx < used ? "settled" : idx === used ? "compare" : "waiting";
      case "place": {
        // 방금 내려놓은 카드는 current. 반대쪽 묶음의 맨 앞 카드는 계속 compare 로 남는다
        const mine = m.side === (onLeft ? "left" : "right");
        if (idx < used - 1) return "settled";
        if (idx === used - 1) return mine ? "current" : "settled";
        if (idx === used) return mine ? "waiting" : "compare";
        return "waiting";
      }
      case "rest":
      case "done":
        return "settled";
    }
  });
}

function stage(values: number[], m: Merge, i: number | null, j: number | null): StageState {
  const flags: Record<string, number> = {};
  if (i !== null && i < m.mid) flags.i = m.lo + i;
  if (j !== null && j < m.hi - m.lo - m.mid) flags.j = m.lo + m.mid + j;
  return { cells: topCells(values.length, m), flags, values: [...values], merge: m };
}

type Ctx = { values: number[] };

function* merge(
  ctx: Ctx,
  left: number[],
  right: number[],
  lo: number,
  outer: boolean,
): Generator<Step, number[]> {
  const result: number[] = [];
  const mid = left.length;
  const hi = lo + left.length + right.length;
  let i = 0;
  let j = 0;
  const m = (mode: Merge["mode"], taken: Merge["taken"], side?: Merge["side"]): Merge => ({
    lo,
    hi,
    mid,
    mode,
    taken,
    ...(side ? { side } : {}),
    result: [...result],
  });

  while (i < left.length && j < right.length) {
    yield {
      line: 13,
      vars: { i, j },
      stage: stage(ctx.values, m("compare", { left: i, right: j }), i, j),
      note: `${josa(left[i], "과", "와")} ${josa(right[j], "을", "를")} 견줍니다`,
    };
    if (left[i] <= right[j]) {
      result.push(left[i]);
      // 줄을 실행한 뒤의 상태 — `i += 1`(15번 줄)은 아직 안 했다
      yield {
        line: 14,
        vars: { i, j },
        stage: stage(ctx.values, m("place", { left: i + 1, right: j }, "left"), i, j),
        note: `왼쪽 묶음의 ${josa(left[i], "을", "를")} 내려놓습니다`,
      };
      i++;
    } else {
      result.push(right[j]);
      yield {
        line: 17,
        vars: { i, j },
        stage: stage(ctx.values, m("place", { left: i, right: j + 1 }, "right"), i, j),
        note: `오른쪽 묶음의 ${josa(right[j], "을", "를")} 내려놓습니다`,
      };
      j++;
    }
  }

  const rest = [...left.slice(i), ...right.slice(j)];
  result.push(...rest);
  yield {
    line: 19,
    vars: { i, j },
    stage: stage(ctx.values, m("rest", { left: left.length, right: right.length }), null, null),
    note: `한쪽 묶음이 비었습니다. 남은 ${rest.length}장을 그대로 이어 붙입니다`,
  };

  // 합친 줄을 원래 줄 자리에 되돌려 쓴다 — 다음 합치기는 이 구간을 이미 정렬된 묶음으로 본다
  ctx.values.splice(lo, result.length, ...result);
  yield {
    line: 20,
    vars: { i, j },
    stage: stage(ctx.values, m("done", { left: left.length, right: right.length }), null, null),
    note: `합치기가 끝났습니다. ${result.join(" ")}`,
    ...(outer ? { done: true } : {}),
  };
  return result;
}

/** `outer` 는 맨 바깥 호출 — 그 호출의 마지막 줄(20번)이 테이프의 끝이다. */
function* mergeSort(ctx: Ctx, piece: number[], lo: number, outer: boolean): Generator<Step, number[]> {
  const n = piece.length;
  if (n <= 1) return piece;
  const mid = Math.floor(n / 2);
  const idle: Merge["taken"] = { left: 0, right: 0 };

  yield {
    line: 4,
    vars: { n, mid },
    stage: stage(ctx.values, { lo, hi: lo + n, mid, mode: "split", taken: idle, result: [] }, null, null),
    note: `${n}장을 ${mid}장과 ${n - mid}장으로 나눕니다`,
  };

  const left = yield* mergeSort(ctx, piece.slice(0, mid), lo, false);
  const right = yield* mergeSort(ctx, piece.slice(mid), lo + mid, false);

  yield {
    line: 7,
    vars: { n, mid },
    stage: stage(ctx.values, { lo, hi: lo + n, mid, mode: "ready", taken: idle, result: [] }, null, null),
    note: `정렬된 두 묶음을 합칩니다. 왼쪽 ${fmt(left)}, 오른쪽 ${fmt(right)}`,
  };
  return yield* merge(ctx, left, right, lo, outer);
}

function* walk(input: number[]): Generator<Step, void> {
  const ctx: Ctx = { values: [...input] };
  yield* mergeSort(ctx, [...input], 0, true);
}

export function mergeSortTape(input: number[]): Tape {
  return buildTape(walk(input), MERGE_SORT_CODE);
}

/** ① 해 보기가 쓴다. 두 묶음 앞에서 내려놓을 쪽 — 같으면 왼쪽(코드의 `<=` 와 같다). 한쪽이 비었으면 남은 쪽. */
export function nextSide(left: number[], right: number[], i: number, j: number): "left" | "right" | null {
  if (i >= left.length && j >= right.length) return null;
  if (i >= left.length) return "right";
  if (j >= right.length) return "left";
  return left[i] <= right[j] ? "left" : "right";
}

/**
 * 테이프 없이 횟수만 센다. 비교용·확인 문제용.
 * `placed` 는 카드를 새 줄에 내려놓은 횟수(남은 묶음을 이어 붙이는 것도 센다), `compares` 는 두 카드를 견준 횟수,
 * `levels` 는 반으로 쪼갠 층의 수다.
 */
export function countMergeOps(input: number[]): { placed: number; compares: number; levels: number } {
  let placed = 0;
  let compares = 0;
  const sort = (arr: number[]): { out: number[]; depth: number } => {
    if (arr.length <= 1) return { out: arr, depth: 0 };
    const mid = Math.floor(arr.length / 2);
    const l = sort(arr.slice(0, mid));
    const r = sort(arr.slice(mid));
    const out: number[] = [];
    let i = 0;
    let j = 0;
    while (i < l.out.length && j < r.out.length) {
      compares++;
      out.push(l.out[i] <= r.out[j] ? l.out[i++] : r.out[j++]);
    }
    out.push(...l.out.slice(i), ...r.out.slice(j));
    placed += out.length;
    return { out, depth: Math.max(l.depth, r.depth) + 1 };
  };
  const res = sort([...input]);
  return { placed, compares, levels: res.depth };
}

/**
 * 같은 값에 이름표를 달아 병합 정렬한다. `cmp` 는 왼쪽 카드를 먼저 내려놓는 조건 — `<=` 가 코드대로.
 * `<` 로 바꾸면 같은 값에서 오른쪽 카드가 먼저 나와 원래 순서가 뒤집힌다(안정 정렬이 깨진다).
 */
export function mergeSortLabels(pairs: [number, string][], cmp: "<=" | "<"): string[] {
  const sort = (arr: [number, string][]): [number, string][] => {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const l = sort(arr.slice(0, mid));
    const r = sort(arr.slice(mid));
    const out: [number, string][] = [];
    let i = 0;
    let j = 0;
    while (i < l.length && j < r.length) {
      const takeLeft = cmp === "<=" ? l[i][0] <= r[j][0] : l[i][0] < r[j][0];
      out.push(takeLeft ? l[i++] : r[j++]);
    }
    return [...out, ...l.slice(i), ...r.slice(j)];
  };
  return sort(pairs.map((p) => [...p] as [number, string])).map(([v, l]) => `${v}${l}`);
}

/** 19번 줄(`result += left[i:] + right[j:]`)을 빼먹은 병합 정렬. 남은 묶음이 사라진다. */
export function mergeSortWithoutRest(input: number[]): number[] {
  const sort = (arr: number[]): number[] => {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const l = sort(arr.slice(0, mid));
    const r = sort(arr.slice(mid));
    const out: number[] = [];
    let i = 0;
    let j = 0;
    while (i < l.length && j < r.length) out.push(l[i] <= r[j] ? l[i++] : r[j++]);
    return out;
  };
  return sort([...input]);
}

/** ② 그림: 한 층씩 반으로 쪼갠 모양. 각 묶음에 합쳐서 정렬한 모습(`sorted`)도 붙는다. */
export type MergeLevel = { cards: number[]; sorted: number[] }[];
export function mergeLevels(input: number[]): MergeLevel[] {
  const levels: MergeLevel[] = [];
  const walkDown = (arr: number[], depth: number) => {
    (levels[depth] ??= []).push({ cards: arr, sorted: [...arr].sort((a, b) => a - b) });
    if (arr.length <= 1) return;
    const mid = Math.floor(arr.length / 2);
    walkDown(arr.slice(0, mid), depth + 1);
    walkDown(arr.slice(mid), depth + 1);
  };
  walkDown(input, 0);
  return levels;
}
