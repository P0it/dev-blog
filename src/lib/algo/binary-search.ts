import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/** 화면에 보여 주는 Python 코드. 아래 제너레이터가 이 줄 번호를 따라간다. */
export const BINARY_SEARCH_CODE = [
  "def binary_search(arr, target):", // 1
  "    left, right = 0, len(arr) - 1", // 2
  "    while left <= right:", // 3
  "        mid = (left + right) // 2", // 4
  "        if arr[mid] == target:", // 5
  "            return mid", // 6
  "        elif arr[mid] < target:", // 7
  "            left = mid + 1", // 8
  "        else:", // 9
  "            right = mid - 1", // 10
  "    return -1", // 11
];

/**
 * 일부러 틀린 코드 — `<=` 를 `<` 로 바꿨다. ⑥ 틀리는 자리를 화면에서 확인하게 하려는 것이다.
 * 한 칸만 남은 순간(left == right)에 그 칸을 안 보고 끝내서, 배열에 있어도 -1 이 나온다.
 */
export const BINARY_SEARCH_LT_CODE = BINARY_SEARCH_CODE.map((l, i) =>
  i === 2 ? "    while left < right:" : l,
);

export type Variant = "ok" | "lt";

function stage(len: number, left: number, right: number, mid: number | null, found = false) {
  // 사양 4절 색 규약 그대로다 — 잘려 나간 범위가 dropped, 아직 안 건드린 후보가 out.
  // 거꾸로 칠하면 "버렸다"가 흐릿해지고 "아직 후보다"가 눈에 튄다.
  const cells: CellState[] = [];
  for (let i = 0; i < len; i++) {
    if (i < left || i > right) cells.push("dropped");
    else if (i === mid) cells.push(found ? "settled" : "current");
    else cells.push("out");
  }
  const flags: Record<string, number> = {};
  if (left < len) flags.left = left;
  if (right >= 0) flags.right = right;
  if (mid !== null) flags.mid = mid;
  return { cells, flags };
}

/**
 * Python 과 스텝이 한 칸씩 맞물리게 흘린다.
 *
 * 두 가지를 Python 실행 순서에 맞췄다 — 어긋나면 fixture 대조 테스트가 잡는다.
 *  - `while` 조건이 **실패하는 순간도 한 스텝**이다. 그 뒤에 `return -1` 줄이 온다
 *  - `mid` 는 한 번 정해지면 함수가 끝날 때까지 변수로 남는다. 루프 머리에서도 계속 보인다
 */
function* walk(arr: number[], target: number, variant: Variant = "ok"): Generator<Step> {
  let left = 0;
  let right = arr.length - 1;
  let mid: number | null = null;

  const vars = (): Record<string, number> =>
    mid === null ? { left, right } : { left, right, mid };

  yield {
    line: 2,
    vars: vars(),
    stage: stage(arr.length, left, right, mid),
    note: `왼쪽 끝 ${left}, 오른쪽 끝 ${right}에서 시작합니다`,
  };

  while (true) {
    const goes = variant === "lt" ? left < right : left <= right;
    yield {
      line: 3,
      vars: vars(),
      stage: stage(arr.length, left, right, mid),
      note: goes
        ? `후보 ${right - left + 1}칸이 남았습니다`
        : variant === "lt" && left === right
          ? `후보가 ${left}번 칸 한 칸 남았는데 조건이 거짓입니다`
          : "볼 곳이 다 떨어졌습니다",
    };
    if (!goes) break;

    mid = (left + right) >> 1;

    yield {
      line: 4,
      vars: vars(),
      stage: stage(arr.length, left, right, mid),
      note: `가운데는 ${mid}번 칸, 값은 ${arr[mid]}입니다`,
    };

    yield {
      line: 5,
      vars: vars(),
      stage: stage(arr.length, left, right, mid),
      // 찾는 값을 되풀이하지 않는다 — `42가 찾는 42일까요?` 가 되는 자리다
      note: `${mid}번 칸의 ${josa(arr[mid], "이", "가")} 찾는 값일까요?`,
    };

    if (arr[mid] === target) {
      yield {
        line: 6,
        vars: vars(),
        stage: stage(arr.length, left, right, mid, true),
        note: `찾았습니다. ${mid}번 칸입니다`,
        done: true,
      };
      return;
    }

    const smaller = arr[mid] < target;

    yield {
      line: 7,
      vars: vars(),
      stage: stage(arr.length, left, right, mid),
      note: `${josa(arr[mid], "은", "는")} ${target}보다 ${smaller ? "작습니다" : "큽니다"}`,
    };

    if (smaller) {
      const dropped = mid + 1;
      left = mid + 1;
      yield {
        line: 8,
        vars: vars(),
        stage: stage(arr.length, left, right, mid),
        note: `더 오른쪽에 있습니다. 왼쪽 ${dropped}칸을 버립니다`,
      };
    } else {
      right = mid - 1;
      yield {
        line: 10,
        vars: vars(),
        stage: stage(arr.length, left, right, mid),
        note: "더 왼쪽에 있습니다. 오른쪽을 버립니다",
      };
    }
  }

  yield {
    line: BINARY_SEARCH_CODE.length,
    vars: vars(),
    stage: stage(arr.length, left, right, mid),
    note:
      variant === "lt" && arr.includes(target)
        ? `${josa(target, "은", "는")} 배열에 있는데 한 칸 남은 순간을 안 보고 끝냈습니다. -1 이 나옵니다`
        : "이 줄에는 없습니다",
    done: false,
  };
}

export function binarySearchTape(arr: number[], target: number, variant: Variant = "ok"): Tape {
  return buildTape(walk(arr, target, variant), variant === "lt" ? BINARY_SEARCH_LT_CODE : BINARY_SEARCH_CODE);
}
