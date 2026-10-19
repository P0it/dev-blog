import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/** 앞 칸부터 하나씩 열어 찾는 코드. 못 찾으면 -1. */
export const SEARCH_CODE = [
  "def linear_search(arr, target):", // 1
  "    for i in range(len(arr)):", // 2
  "        if arr[i] == target:", // 3
  "            return i", // 4
  "    return -1", // 5
];

/** ① 해 보기와 ④ 플레이어가 함께 쓰는 사물함 번호표. 일부러 섞여 있다. */
export const SEARCH_ARR = [7, 3, 11, 5, 9, 2, 8, 12, 4, 10, 6, 1];
/** 찾는 번호. 아홉 번째 칸(8번)에 있다. */
export const SEARCH_TARGET = 4;
/** 일부러 없는 번호 — 다 열어 봐야 없다는 걸 안다. */
export const SEARCH_MISSING = 13;

/** 위치를 돌려준다. 같은 값이 여럿이면 첫 위치만, 없으면 -1. */
export function linearSearch(arr: number[], target: number): number {
  for (let i = 0; i < arr.length; i++) if (arr[i] === target) return i;
  return -1;
}

/** 확실히 알기까지 여는 칸 수. 찾으면 그 칸까지, 없으면 전부. */
export function opensNeeded(arr: number[], target: number): number {
  const at = linearSearch(arr, target);
  return at === -1 ? arr.length : at + 1;
}

/**
 * ① 에서 열 수 있는 칸은 아직 안 연 칸 중 맨 앞 하나뿐이다.
 * 번호표가 섞여 있어서 건너뛰어 열면 찾는 번호를 놓칠 수 있다 — 알고리즘이 하는 동작과 같게 막는다.
 */
export function canOpen(opened: number, i: number): boolean {
  return i === opened;
}

/** 지나간 칸은 dropped, 지금 보는 칸은 current, 찾은 칸은 settled, 아직 안 본 칸은 out. */
function stage(arr: number[], i: number | null, hit: boolean, allSeen = false) {
  const cells: CellState[] = arr.map((_, k) => {
    if (allSeen) return "dropped";
    if (i === null) return "out";
    if (k < i) return "dropped";
    if (k === i) return hit ? "settled" : "current";
    return "out";
  });
  const flags: Record<string, number> = {};
  if (i !== null && !allSeen) flags.i = i;
  return { cells, flags, values: [...arr] };
}

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(i: number | null): Record<string, number> {
  return i === null ? {} : { i };
}

function* walk(arr: number[], target: number): Generator<Step> {
  const n = arr.length;
  let last: number | null = null;

  for (let i = 0; i < n; i++) {
    last = i;
    yield {
      line: 2,
      vars: vars(i),
      stage: stage(arr, i, false),
      note: `${i}번 칸을 열 차례입니다`,
    };

    const same = arr[i] === target;
    yield {
      line: 3,
      vars: vars(i),
      stage: stage(arr, i, false),
      note: `${i}번 칸의 번호표는 ${arr[i]} 입니다. 찾는 번호 ${josa(target, "과", "와")} ${same ? "같습니다" : "다릅니다"}`,
    };

    if (same) {
      yield {
        line: 4,
        vars: vars(i),
        stage: stage(arr, i, true),
        note: `${i}번 칸에서 찾았습니다. 칸을 ${i + 1}번 열었습니다`,
        done: true,
      };
      return;
    }
  }

  // for 가 끝나는 자리(더 열 칸이 없다)
  yield {
    line: 2,
    vars: vars(last),
    stage: stage(arr, null, false, true),
    note: "더 열 칸이 없습니다",
  };
  yield {
    line: SEARCH_CODE.length,
    vars: vars(last),
    stage: stage(arr, null, false, true),
    note: n === 0 ? "칸이 하나도 없어서 -1 을 돌려줍니다" : `칸을 ${n}번 다 열었는데 없습니다. -1 을 돌려줍니다`,
    done: false,
  };
}

export function searchTape(arr: number[], target: number): Tape {
  return buildTape(walk(arr, target), SEARCH_CODE);
}
