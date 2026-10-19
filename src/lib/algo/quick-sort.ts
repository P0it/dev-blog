import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * 기준(`pivot`)을 **맨 앞 카드**로 잡고 `i` 를 "작은 카드 묶음의 끝"으로 쓴다.
 * 작은 카드를 만나면 `i` 를 한 칸 늘려 그 자리와 맞바꾸고, 다 보고 나면 기준 카드를 묶음 끝과 맞바꿔 제자리에 놓는다.
 * ① 해 보기의 "기준은 맨 앞 카드, 작으면 왼쪽·크면 오른쪽" 과 같은 동작이라 ② 되짚기가 ① 을 반증하지 않는다.
 *
 * 화면 스텝은 호출마다 늘지 않게 묶는다(`scripts/algo/trace_quick_sort.py` 머리말과 같은 규칙).
 * 첫 호출(루트)은 줄마다, 더 깊은 호출은 기준을 놓은 10번 줄 한 번만 스텝으로 올린다.
 */
export const QUICK_SORT_CODE = [
  "def quick_sort(arr, lo, hi):", // 1
  "    if lo >= hi:", // 2
  "        return", // 3
  "    pivot = arr[lo]", // 4
  "    i = lo", // 5
  "    for j in range(lo + 1, hi + 1):", // 6
  "        if arr[j] < pivot:", // 7
  "            i += 1", // 8
  "            arr[i], arr[j] = arr[j], arr[i]", // 9
  "    arr[lo], arr[i] = arr[i], arr[lo]", // 10
  "    quick_sort(arr, lo, i - 1)", // 11
  "    quick_sort(arr, i + 1, hi)", // 12
];

/** ① 해 보기와 ④ 플레이어가 같이 쓰는 카드. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다. */
export const QUICK_CARDS = [6, 3, 8, 2, 9, 1, 5];

/** ③ 에서 끌어낼 쏠림 — 이미 정렬된 카드는 맨 앞 카드가 가장 작아서 왼쪽 묶음이 늘 비어 있다. */
export const QUICK_SORTED = [1, 2, 3, 4, 5, 6, 7];

/** 기준보다 작을 때만 true. 같은 값은 false — 코드의 `<` 와 같다. */
export function isSmallerThanPivot(card: number, pivot: number): boolean {
  return card < pivot;
}

type View = {
  lo: number | null;
  hi: number | null;
  i: number | null;
  j: number | null;
  /** 기준 카드(lo)를 current 로 칠하는가 — 첫 분할을 하는 동안만 켠다 */
  scanning: boolean;
};

/**
 * 확정된 칸(settled)이 가장 먼저 칠해진다. 첫 분할 중에는 기준(lo)이 current, 지금 견주는 칸(j)이 compare,
 * 작은 카드 묶음(lo+1..i)이 waiting 이다.
 */
function stage(values: number[], settled: Set<number>, v: View) {
  const cells: CellState[] = values.map((_, k) => {
    if (settled.has(k)) return "settled";
    if (v.scanning) {
      if (v.lo !== null && k === v.lo) return "current";
      if (v.j !== null && k === v.j && (v.i === null || k > v.i)) return "compare";
      if (v.lo !== null && v.i !== null && k > v.lo && k <= v.i) return "waiting";
    }
    return "out";
  });
  const flags: Record<string, number> = {};
  for (const [name, at] of [
    ["lo", v.lo],
    ["hi", v.hi],
    ["i", v.i],
    ["j", v.j],
  ] as const) {
    if (at !== null && at >= 0 && at < values.length) flags[name] = at;
  }
  return { cells, flags, values: [...values] };
}

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(lo: number, hi: number, pivot: number | null, i: number | null, j: number | null) {
  const v: Record<string, number> = { lo, hi };
  if (pivot !== null) v.pivot = pivot;
  if (i !== null) v.i = i;
  if (j !== null) v.j = j;
  return v;
}

/** 더 깊은 호출 — 화면에 올리는 건 기준을 놓은 직후(10번 줄) 한 스텝뿐이다. 안의 비교·교환은 조용히 해 둔다. */
function* deep(arr: number[], settled: Set<number>, lo: number, hi: number): Generator<Step> {
  if (lo > hi) return;
  if (lo === hi) {
    settled.add(lo);
    return;
  }
  const pivot = arr[lo];
  let i = lo;
  for (let j = lo + 1; j <= hi; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[lo], arr[i]] = [arr[i], arr[lo]];
  settled.add(i);
  yield {
    line: 10,
    vars: vars(lo, hi, pivot, i, hi),
    stage: stage(arr, settled, { lo, hi, i, j: null, scanning: false }),
    note: `${lo}~${hi}번 칸에서도 같은 분할을 끝냈습니다. 기준 ${josa(pivot, "은", "는")} ${i}번 칸에 자리를 잡았습니다`,
  };
  yield* deep(arr, settled, lo, i - 1);
  yield* deep(arr, settled, i + 1, hi);
}

function* walk(input: number[]): Generator<Step> {
  const arr = [...input];
  const n = arr.length;
  const settled = new Set<number>();
  const lo = 0;
  const hi = n - 1;
  const idle = { lo, hi, i: null, j: null, scanning: false } as const;

  if (lo >= hi) {
    yield {
      line: 2,
      vars: vars(lo, hi, null, null, null),
      stage: stage(arr, settled, idle),
      note: n === 0 ? "카드가 없습니다" : "카드가 한 장이라 이미 정렬돼 있습니다",
    };
    if (n === 1) settled.add(0);
    yield {
      line: 3,
      vars: vars(lo, hi, null, null, null),
      stage: stage(arr, settled, idle),
      note: "할 일이 없어 바로 돌아갑니다",
    };
    yield finish(arr, 3, vars(lo, hi, null, null, null));
    return;
  }

  yield {
    line: 2,
    vars: vars(lo, hi, null, null, null),
    stage: stage(arr, settled, idle),
    note: `카드가 ${n}장이라 계속 가릅니다`,
  };

  const pivot = arr[lo];
  yield {
    line: 4,
    vars: vars(lo, hi, pivot, null, null),
    stage: stage(arr, settled, { lo, hi, i: null, j: null, scanning: true }),
    note: `맨 앞 카드 ${josa(pivot, "을", "를")} 기준으로 잡습니다`,
  };

  let i = lo;
  yield {
    line: 5,
    vars: vars(lo, hi, pivot, i, null),
    stage: stage(arr, settled, { lo, hi, i, j: null, scanning: true }),
    note: `작은 카드 묶음의 끝을 ${i}번 칸으로 잡습니다. 아직 비어 있습니다`,
  };

  for (let j = lo + 1; j <= hi; j++) {
    const small = isSmallerThanPivot(arr[j], pivot);
    yield {
      line: 7,
      vars: vars(lo, hi, pivot, i, j),
      stage: stage(arr, settled, { lo, hi, i, j, scanning: true }),
      note: small
        ? `${josa(arr[j], "은", "는")} 기준 ${pivot}보다 작습니다`
        : `${josa(arr[j], "은", "는")} 기준 ${pivot}보다 작지 않습니다`,
    };
    if (small) {
      i++;
      yield {
        line: 8,
        vars: vars(lo, hi, pivot, i, j),
        stage: stage(arr, settled, { lo, hi, i, j, scanning: true }),
        note: `작은 카드 묶음이 한 칸 늘어납니다. 묶음의 끝은 ${i}번 칸입니다`,
      };
      [arr[i], arr[j]] = [arr[j], arr[i]];
      yield {
        line: 9,
        vars: vars(lo, hi, pivot, i, j),
        stage: stage(arr, settled, { lo, hi, i, j, scanning: true }),
        note:
          i === j
            ? `${josa(arr[j], "은", "는")} 이미 묶음 끝에 있어 그대로입니다`
            : `${josa(arr[i], "을", "를")} 작은 카드 묶음 안으로 보냅니다`,
      };
    }
  }

  const last = hi;
  [arr[lo], arr[i]] = [arr[i], arr[lo]];
  settled.add(i);
  yield {
    line: 10,
    vars: vars(lo, hi, pivot, i, last),
    stage: stage(arr, settled, { lo, hi, i, j: null, scanning: false }),
    note: `기준 ${josa(pivot, "을", "를")} ${i}번 칸에 놓았습니다. 왼쪽 ${i - lo}장은 작고 오른쪽 ${hi - i}장은 크거나 같습니다`,
  };

  // 11·12번 줄은 호출 직전 상태를 낸다 — 호출 뒤 상태를 쓰면 왼쪽을 다 정렬한 배열이 호출 줄에 찍힌다
  yield {
    line: 11,
    vars: vars(lo, hi, pivot, i, last),
    stage: stage(arr, settled, { lo, hi, i, j: null, scanning: false }),
    note: i - lo === 0 ? "왼쪽은 0장이라 할 일이 없습니다" : `왼쪽 ${i - lo}장에 같은 일을 되풀이합니다`,
  };
  yield* deep(arr, settled, lo, i - 1);

  yield {
    line: 12,
    vars: vars(lo, hi, pivot, i, last),
    stage: stage(arr, settled, { lo, hi, i, j: null, scanning: false }),
    note: hi - i === 0 ? "오른쪽은 0장이라 할 일이 없습니다" : `오른쪽 ${hi - i}장에 같은 일을 되풀이합니다`,
  };
  yield* deep(arr, settled, i + 1, hi);

  yield finish(arr, 12, vars(lo, hi, pivot, i, last));
}

/** Python 행에는 없는 마무리 스텝 — 모든 칸을 확정으로 칠한다. */
function finish(arr: number[], line: number, v: Record<string, number>): Step {
  const all = new Set<number>(arr.map((_, k) => k));
  return {
    line,
    vars: v,
    stage: stage(arr, all, { lo: null, hi: null, i: null, j: null, scanning: false }),
    note: "전부 자리를 잡았습니다",
    done: true,
  };
}

export function quickSortTape(input: number[]): Tape {
  return buildTape(walk(input), QUICK_SORT_CODE);
}

/**
 * 연산 횟수만 센다. `compares` 는 기준과 견준 횟수, `depth` 는 겹쳐 들어간 분할의 층 수,
 * `firstLeft`·`firstRight` 는 첫 분할로 갈린 왼쪽·오른쪽 카드 수다. 쏠림은 이 둘로 보인다.
 */
export function countQuickOps(input: number[]): {
  compares: number;
  depth: number;
  firstLeft: number;
  firstRight: number;
} {
  const arr = [...input];
  let compares = 0;
  let depth = 0;
  let firstLeft = 0;
  let firstRight = 0;
  let first = true;

  const go = (lo: number, hi: number, d: number) => {
    if (lo >= hi) return;
    depth = Math.max(depth, d);
    const pivot = arr[lo];
    let i = lo;
    for (let j = lo + 1; j <= hi; j++) {
      compares++;
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    [arr[lo], arr[i]] = [arr[i], arr[lo]];
    if (first) {
      firstLeft = i - lo;
      firstRight = hi - i;
      first = false;
    }
    go(lo, i - 1, d + 1);
    go(i + 1, hi, d + 1);
  };
  go(0, arr.length - 1, 1);
  return { compares, depth, firstLeft, firstRight };
}

/**
 * 같은 값에 이름표를 달아 같은 방식(맨 앞 카드 기준, `<`)으로 정렬한다.
 * 먼 칸과 맞바꾸느라 같은 값의 원래 순서가 뒤집힐 수 있다 — 안정 정렬이 아니다.
 */
export function quickLabels(pairs: [number, string][]): string[] {
  const a = pairs.map((p) => [...p] as [number, string]);
  const go = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const pivot = a[lo][0];
    let i = lo;
    for (let j = lo + 1; j <= hi; j++) {
      if (a[j][0] < pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
      }
    }
    [a[lo], a[i]] = [a[i], a[lo]];
    go(lo, i - 1);
    go(i + 1, hi);
  };
  go(0, a.length - 1);
  return a.map(([v, l]) => `${v}${l}`);
}
