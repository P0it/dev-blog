import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * ① 해 보기와 ④ 플레이어가 함께 쓰는 줄. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다.
 * 2 가 셋 붙어 있다 — 칸이 아니라 **칸 사이 틈**에 번호를 붙이면 0~6번 틈이 일곱 개다.
 */
export const BOUND_ARR = [1, 2, 2, 2, 3, 5];

/** 화면에 보여 주는 Python 코드. 아래 제너레이터가 이 줄 번호를 따라간다. */
export const BOUND_LEFT_CODE = [
  "def bisect_left(arr, x):", // 1
  "    lo, hi = 0, len(arr)", // 2
  "    while lo < hi:", // 3
  "        mid = (lo + hi) // 2", // 4
  "        if arr[mid] < x:", // 5
  "            lo = mid + 1", // 6
  "        else:", // 7
  "            hi = mid", // 8
  "    return lo", // 9
];

/**
 * 비교 한 줄만 `<` 에서 `<=` 로 바꾼 코드. 이것이 bisect_right 다.
 * 같은 값을 만나면 왼쪽 코드는 hi 로 돌아서고, 이 코드는 lo 를 넘어 간다.
 */
export const BOUND_RIGHT_CODE = BOUND_LEFT_CODE.map((l, i) =>
  i === 0 ? "def bisect_right(arr, x):" : i === 4 ? "        if arr[mid] <= x:" : l,
);

export type BoundVariant = "left" | "right";

export function bisectLeft(arr: number[], x: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function bisectRight(arr: number[], x: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function stage(len: number, lo: number, hi: number, mid: number | null, end = false) {
  // lo 앞은 "x 쪽에 못 미친다고 확인된 칸", hi 뒤는 "이미 x 를 넘은 칸" — 둘 다 더는 볼 필요가 없어 dropped
  const cells: CellState[] = [];
  for (let i = 0; i < len; i++) {
    if (i < lo || i >= hi) cells.push("dropped");
    else if (i === mid) cells.push("current");
    else cells.push("out");
  }
  // 끝나면 경계 틈 바로 오른쪽 카드를 확정으로 칠한다
  if (end && lo < len) cells[lo] = "settled";
  const flags: Record<string, number> = {};
  if (lo < len) flags.lo = lo;
  if (hi < len) flags.hi = hi;
  if (mid !== null) flags.mid = mid;
  return { cells, flags };
}

/**
 * Python 과 스텝이 한 줄씩 맞물리게 흘린다.
 *
 *  - `while` 조건이 **실패하는 순간도 한 스텝**이다. 그 뒤에 `return lo` 줄이 온다
 *  - `else:` 줄은 Python 에서 줄 이벤트가 없다. 가지가 갈리면 바로 `hi = mid`(8번 줄)로 간다
 *  - `mid` 는 한 번 정해지면 끝날 때까지 변수로 남는다
 */
function* walk(arr: number[], x: number, variant: BoundVariant): Generator<Step> {
  let lo = 0;
  let hi = arr.length;
  let mid: number | null = null;
  const len = arr.length;
  const strict = variant === "left"; // 왼쪽 코드는 `<`, 오른쪽 코드는 `<=`

  const vars = (): Record<string, number> => (mid === null ? { lo, hi } : { lo, hi, mid });

  yield {
    line: 2,
    vars: vars(),
    stage: stage(len, lo, hi, mid),
    note: `틈 ${lo}번부터 ${hi}번까지가 후보입니다`,
  };

  while (true) {
    const goes = lo < hi;
    yield {
      line: 3,
      vars: vars(),
      stage: stage(len, lo, hi, mid),
      note: goes ? "아직 후보 틈이 둘 이상입니다" : `lo 와 hi 가 만났습니다. 경계는 ${lo}번 틈입니다`,
    };
    if (!goes) break;

    mid = (lo + hi) >> 1;
    yield {
      line: 4,
      vars: vars(),
      stage: stage(len, lo, hi, mid),
      note: `가운데는 ${mid}번 칸, 값은 ${arr[mid]}입니다`,
    };

    const small = strict ? arr[mid] < x : arr[mid] <= x;
    yield {
      line: 5,
      vars: vars(),
      stage: stage(len, lo, hi, mid),
      note: strict
        ? `${josa(arr[mid], "이", "가")} ${x}보다 작을까요?`
        : `${josa(arr[mid], "이", "가")} ${x}보다 작거나 같을까요?`,
    };

    if (small) {
      lo = mid + 1;
      yield {
        line: 6,
        vars: vars(),
        stage: stage(len, lo, hi, mid),
        note: strict
          ? `${mid}번 칸까지는 전부 ${x}보다 작습니다. lo 를 ${lo}번 틈으로 옮깁니다`
          : `${mid}번 칸까지는 전부 ${x} 이하입니다. lo 를 ${lo}번 틈으로 옮깁니다`,
      };
    } else {
      hi = mid;
      yield {
        line: 8,
        vars: vars(),
        stage: stage(len, lo, hi, mid),
        note: strict
          ? `${mid}번 칸은 ${x} 이상입니다. 경계가 이 칸 바로 앞일 수 있어 hi 를 ${hi}번 틈에 둡니다`
          : `${mid}번 칸은 ${x}보다 큽니다. 경계가 이 칸 바로 앞일 수 있어 hi 를 ${hi}번 틈에 둡니다`,
      };
    }
  }

  yield {
    line: BOUND_LEFT_CODE.length,
    vars: vars(),
    stage: stage(len, lo, hi, mid, true),
    note: strict
      ? `${x} 이상이 처음 나오는 틈은 ${lo}번입니다`
      : `${x}보다 큰 수가 처음 나오는 틈은 ${lo}번입니다`,
    done: true,
  };
}

export function boundTape(arr: number[], x: number, variant: BoundVariant = "left"): Tape {
  return buildTape(walk(arr, x, variant), variant === "right" ? BOUND_RIGHT_CODE : BOUND_LEFT_CODE);
}

// ── ① 틈 고르기 ──

/** 틈 번호의 정답. `left` 는 x 덩어리가 시작되는 틈(bisect_left), `right` 는 끝나는 틈(bisect_right). */
export function gapAnswer(arr: number[], x: number, kind: BoundVariant): number {
  return kind === "left" ? bisectLeft(arr, x) : bisectRight(arr, x);
}

/**
 * 독자가 고른 틈을 판정한다. 틀리면 **그 틈 바로 옆의 카드 값**으로 왜 틀렸는지 말한다.
 * g 번 틈은 g-1 번 칸과 g 번 칸 사이다.
 */
export function explainGap(arr: number[], x: number, kind: BoundVariant, g: number): { ok: boolean; text: string } {
  if (!Number.isInteger(g) || g < 0 || g > arr.length) return { ok: false, text: "그런 틈은 없습니다" };
  const answer = gapAnswer(arr, x, kind);
  if (g === answer) {
    return {
      ok: true,
      text:
        kind === "left"
          ? `맞아요. ${g}번 틈 왼쪽은 전부 ${x}보다 작고, 오른쪽은 ${x} 이상입니다`
          : `맞아요. ${g}번 틈 왼쪽은 전부 ${x} 이하이고, 오른쪽은 ${x}보다 큽니다`,
    };
  }
  if (g < answer) {
    // 틈 바로 오른쪽 카드가 아직 왼쪽 묶음이어야 한다
    return {
      ok: false,
      text:
        kind === "left"
          ? `${g}번 틈 바로 오른쪽 카드 ${josa(arr[g], "은", "는")} ${x}보다 작습니다. 이 틈은 너무 앞입니다`
          : `${g}번 틈 바로 오른쪽 카드 ${josa(arr[g], "은", "는")} ${x} 이하입니다. 이 틈은 너무 앞입니다`,
    };
  }
  // g > answer — 틈 바로 왼쪽 카드가 오른쪽 묶음이어야 한다
  return {
    ok: false,
    text:
      kind === "left"
        ? `${g}번 틈 바로 왼쪽 카드 ${josa(arr[g - 1], "은", "는")} ${x} 이상입니다. 이 틈은 너무 뒤입니다`
        : `${g}번 틈 바로 왼쪽 카드 ${josa(arr[g - 1], "은", "는")} ${x}보다 큽니다. 이 틈은 너무 뒤입니다`,
  };
}
