import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * 안쪽 반복 머리(`for j …`, 5번)는 스텝으로 올리지 않는다. 그 줄이 하는 일(j 배정)은 바로 뒤 6번 줄의
 * 상태에 이미 들어 있고, 올리면 한 번 견줄 때마다 스텝이 둘씩 늘어 연타로 끝나는 플레이어가 된다.
 */
export const SELECTION_SORT_CODE = [
  "def selection_sort(arr):", // 1
  "    n = len(arr)", // 2
  "    for i in range(n - 1):", // 3
  "        min_idx = i", // 4
  "        for j in range(i + 1, n):", // 5
  "            if arr[j] < arr[min_idx]:", // 6
  "                min_idx = j", // 7
  "        arr[i], arr[min_idx] = arr[min_idx], arr[i]", // 8
  "    return arr", // 9
];

/** ① 해 보기와 ④ 플레이어가 같이 쓰는 카드. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다. */
export const SELECT_CARDS = [5, 2, 9, 1, 7, 4];

/** 후보보다 작을 때만 true. 같은 값은 false — 코드의 `<` 와 같다. */
export function isSmaller(arr: number[], j: number, best: number): boolean {
  return arr[j] < arr[best];
}

/**
 * 앞 `settled` 칸은 확정, 후보(`min_idx`)는 current, 지금 견주는 칸(`j`)은 compare.
 * 확정 칸이 앞에서부터 쌓인다 — 버블 정렬은 뒤에서부터 쌓인다.
 */
function stage(
  values: number[],
  settled: number,
  min: number | null,
  j: number | null,
  i: number | null,
) {
  const cells: CellState[] = values.map((_, k) => {
    if (k < settled) return "settled";
    if (j !== null && k === j) return "compare";
    if (min !== null && k === min) return "current";
    return "out";
  });
  const flags: Record<string, number> = {};
  if (i !== null) flags.i = i;
  if (min !== null) flags.min = min;
  if (j !== null) flags.j = j;
  return { cells, flags, values: [...values] };
}

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. 안쪽 반복이 끝난 뒤에도 j·min_idx 는 직전 값이 남는다. */
function vars(n: number, i: number | null, j: number | null, min: number | null) {
  const v: Record<string, number> = { n };
  if (i !== null) v.i = i;
  if (min !== null) v.min_idx = min;
  if (j !== null) v.j = j;
  return v;
}

function* walk(input: number[]): Generator<Step> {
  const arr = [...input];
  const n = arr.length;
  let i: number | null = null;
  let j: number | null = null;
  let min: number | null = null;

  yield {
    line: 2,
    vars: vars(n, null, null, null),
    stage: stage(arr, 0, null, null, null),
    note: `카드가 ${josa(n, "", "")}장입니다`,
  };

  for (let a = 0; a < n - 1; a++) {
    i = a;
    yield {
      line: 3,
      vars: vars(n, i, j, min),
      stage: stage(arr, a, null, null, a),
      note: `${a + 1}번째 바퀴입니다. 앞 ${a}칸은 이미 자리를 잡았습니다`,
    };

    min = a;
    yield {
      line: 4,
      vars: vars(n, i, j, min),
      stage: stage(arr, a, min, null, a),
      note: `${a}번 칸의 ${josa(arr[a], "을", "를")} 가장 작은 후보로 잡습니다`,
    };

    for (let b = a + 1; b < n; b++) {
      j = b;
      yield {
        line: 6,
        vars: vars(n, i, j, min),
        stage: stage(arr, a, min, j, a),
        note: `${josa(arr[j], "과", "와")} 후보 ${josa(arr[min], "을", "를")} 견줍니다`,
      };

      if (arr[j] < arr[min]) {
        min = j;
        yield {
          line: 7,
          vars: vars(n, i, j, min),
          stage: stage(arr, a, min, j, a),
          note: `${josa(arr[min], "이", "가")} 더 작아서 후보가 바뀝니다`,
        };
      }
    }

    const keep = min;
    if (keep !== a) [arr[a], arr[keep]] = [arr[keep], arr[a]];
    yield {
      line: 8,
      vars: vars(n, i, j, min),
      stage: stage(arr, a + 1, null, null, a),
      note:
        keep === a
          ? `${josa(arr[a], "은", "는")} 이미 제자리입니다. 바꾸지 않아도 됩니다`
          : `후보 ${josa(arr[a], "을", "를")} ${a}번 칸으로 보냅니다`,
    };
  }

  // 바깥 반복이 끝나는 자리 — 파이썬은 for 머리 줄을 한 번 더 지난다
  yield {
    line: 3,
    vars: vars(n, i, j, min),
    stage: stage(arr, n, null, null, null),
    note: "더 고를 바퀴가 없습니다",
  };

  yield {
    line: SELECTION_SORT_CODE.length,
    vars: vars(n, i, j, min),
    stage: stage(arr, n, null, null, null),
    note: "전부 자리를 잡았습니다",
    done: true,
  };
}

export function selectionSortTape(input: number[]): Tape {
  return buildTape(walk(input), SELECTION_SORT_CODE);
}

/**
 * 연산 횟수만 센다. `swaps` 는 **실제로 자리가 바뀐 횟수**(후보가 제 자리가 아닐 때)이고,
 * `codeSwaps` 는 코드가 8번 줄을 실행하는 횟수(n-1, 제자리여도 자기와 맞바꾼다)다.
 */
export function countSelectionOps(input: number[]): { compares: number; swaps: number; codeSwaps: number } {
  const arr = [...input];
  const n = arr.length;
  let compares = 0;
  let swaps = 0;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      compares++;
      if (arr[j] < arr[min]) min = j;
    }
    if (min !== i) {
      [arr[i], arr[min]] = [arr[min], arr[i]];
      swaps++;
    }
  }
  return { compares, swaps, codeSwaps: Math.max(n - 1, 0) };
}

/**
 * 같은 값에 이름표를 달아 선택 정렬한다. `cmp` 는 후보를 바꾸는 조건의 `<` 와 `<=`.
 * `<` 도 먼 칸과 맞바꾸느라 같은 값의 순서가 뒤집힐 수 있다(안정 정렬이 아니다).
 * `<=` 는 같은 값 중 **뒤쪽**을 후보로 잡아 이미 정렬된 입력에서도 자리를 옮긴다.
 */
export function selectionLabels(pairs: [number, string][], cmp: "<" | "<="): string[] {
  const a = pairs.map((p) => [...p] as [number, string]);
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      const better = cmp === "<" ? a[j][0] < a[min][0] : a[j][0] <= a[min][0];
      if (better) min = j;
    }
    [a[i], a[min]] = [a[min], a[i]];
  }
  return a.map(([v, l]) => `${v}${l}`);
}

/** `range(start + i, n)` 의 안쪽 반복이 도는 횟수의 합. 1 이면 코드대로(15번), 0 이면 자기 자신과도 견준다(20번). */
export function compareCountFrom(n: number, offset: 0 | 1): number {
  let total = 0;
  for (let i = 0; i < n - 1; i++) total += n - (i + offset);
  return total;
}
