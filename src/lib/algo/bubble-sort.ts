import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

export const BUBBLE_SORT_CODE = [
  "def bubble_sort(arr):", // 1
  "    n = len(arr)", // 2
  "    for i in range(n - 1):", // 3
  "        for j in range(n - 1 - i):", // 4
  "            if arr[j] > arr[j + 1]:", // 5
  "                arr[j], arr[j + 1] = arr[j + 1], arr[j]", // 6
  "    return arr", // 7
];

/** 뒤에서부터 `settled` 가 쌓인다 — 한 바퀴 돌 때마다 가장 큰 수가 끝으로 밀려 자리를 잡는다. */
function stage(values: number[], settledFrom: number, a: number | null, b: number | null) {
  const cells: CellState[] = values.map((_, i) => {
    if (i >= settledFrom) return "settled";
    if (i === a || i === b) return "compare";
    return "out";
  });
  const flags: Record<string, number> = {};
  if (a !== null) flags.j = a;
  return { cells, flags, values: [...values] };
}

function* walk(input: number[]): Generator<Step> {
  const arr = [...input];
  const n = arr.length;

  yield {
    line: 2,
    vars: { n },
    stage: stage(arr, n, null, null),
    note: `칸이 ${josa(n, "", "")}개입니다`,
  };

  for (let i = 0; i < n - 1; i++) {
    const settledFrom = n - i;
    yield {
      line: 3,
      vars: { n, i },
      stage: stage(arr, settledFrom, null, null),
      note: `${i + 1}번째 바퀴입니다. 뒤쪽 ${i}칸은 이미 자리를 잡았습니다`,
    };

    for (let j = 0; j < n - 1 - i; j++) {
      yield {
        line: 5,
        vars: { n, i, j },
        stage: stage(arr, settledFrom, j, j + 1),
        note: `${arr[j]}와 ${josa(arr[j + 1], "을", "를")} 견줍니다`,
      };

      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        yield {
          line: 6,
          vars: { n, i, j },
          stage: stage(arr, settledFrom, j, j + 1),
          note: `앞이 더 크니 자리를 바꿉니다`,
        };
      }
    }

    yield {
      line: 4,
      vars: { n, i },
      stage: stage(arr, n - i - 1, null, null),
      note: `${josa(arr[n - i - 1], "이", "가")} 끝자리에 확정됐습니다`,
    };
  }

  yield {
    line: BUBBLE_SORT_CODE.length,
    vars: { n },
    stage: stage(arr, 0, null, null),
    note: "전부 자리를 잡았습니다",
    done: true,
  };
}

export function bubbleSortTape(input: number[]): Tape {
  return buildTape(walk(input), BUBBLE_SORT_CODE);
}

/**
 * 연산 횟수만 센다. 비교용이라 테이프를 또 만들지 않는다 —
 * "왜 이걸 고르나"는 숫자로 보여야 설득이 된다.
 */
export function countOps(input: number[]): { compares: number; swaps: number } {
  const arr = [...input];
  const n = arr.length;
  let compares = 0;
  let swaps = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      compares++;
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swaps++;
      }
    }
  }
  return { compares, swaps };
}
