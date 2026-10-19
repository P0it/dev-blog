import type { CellState, StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * `j -= 1`(7번)은 스텝으로 올리지 않는다. 그 줄이 하는 일(j 감소)은 바로 뒤 5번 줄의 상태에 이미 들어 있고,
 * 올리면 한 번 밀 때마다 스텝이 둘씩 늘어 연타로 끝나는 플레이어가 된다(선택 정렬이 안쪽 for 머리를 뺀 것과 같다).
 */
export const INSERTION_SORT_CODE = [
  "def insertion_sort(arr):", // 1
  "    for i in range(1, len(arr)):", // 2
  "        key = arr[i]", // 3
  "        j = i - 1", // 4
  "        while j >= 0 and arr[j] > key:", // 5
  "            arr[j + 1] = arr[j]", // 6
  "            j -= 1", // 7
  "        arr[j + 1] = key", // 8
  "    return arr", // 9
];

/** ① 해 보기와 ④ 플레이어가 같이 쓰는 카드. 선택 정렬 페이지와 같은 입력이라 두 방법의 횟수를 견줄 수 있다. */
export const INSERT_CARDS = [5, 2, 9, 1, 7, 4];

type StageOpts = {
  /** 손패로 치는 칸 수 — 앞 `hand` 칸이 정렬된 손패다 */
  hand: number;
  /** 지금 견주는 칸(카드). 없으면 null */
  cmp?: number | null;
  /** 빈자리. 없으면 그리지 않는다 */
  gap?: number;
  /** 손에 든 카드. 없으면 그리지 않는다 */
  key?: number;
  /** 방금 놓은 칸 */
  placed?: number;
  /** 바깥 반복의 `i`(다음에 받을 카드의 칸). 없으면 꽂지 않는다 */
  flagI?: number | null;
  /** 안쪽 반복의 `j`. 음수·없음이면 꽂지 않는다 */
  flagJ?: number | null;
  /** 이 칸은 지금 받을 카드다(집어 들기 직전) */
  next?: number;
};

/**
 * 앞 `hand` 칸은 손패(settled), 견주는 카드는 compare, 방금 놓은 카드는 current, 나머지(아직 안 받은 카드)는 out.
 * 파이썬 리스트에는 밀고 난 자리에 옛 복사본이 남아 있지만 `gap` 이 그 칸을 빈자리로 가려 그린다.
 */
function stage(values: number[], o: StageOpts): StageState {
  const cells: CellState[] = values.map((_, k) => {
    if (k === o.placed) return "current";
    if (k === o.next) return "current";
    if (k === o.cmp) return "compare";
    if (k < o.hand) return "settled";
    return "out";
  });
  const flags: Record<string, number> = {};
  if (o.flagI !== undefined && o.flagI !== null) flags.i = o.flagI;
  if (o.flagJ !== undefined && o.flagJ !== null && o.flagJ >= 0) flags.j = o.flagJ;
  return {
    cells,
    flags,
    values: [...values],
    ...(o.gap === undefined ? {} : { gap: o.gap }),
    ...(o.key === undefined ? {} : { queue: [o.key] }),
  };
}

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. 바깥 반복이 도는 동안 key·j 는 직전 값이 남는다. */
function vars(i: number | null, key: number | null, j: number | null) {
  const v: Record<string, number> = {};
  if (i !== null) v.i = i;
  if (key !== null) v.key = key;
  if (j !== null) v.j = j;
  return v;
}

function* walk(input: number[]): Generator<Step> {
  const arr = [...input];
  const n = arr.length;
  let i: number | null = null;
  let key: number | null = null;
  let j: number | null = null;

  for (let a = 1; a < n; a++) {
    i = a;
    yield {
      line: 2,
      vars: vars(i, key, j),
      stage: stage(arr, { hand: a, next: a, flagI: a }),
      note: `${a + 1}번째로 ${josa(arr[a], "을", "를")} 받습니다`,
    };

    key = arr[a];
    yield {
      line: 3,
      vars: vars(i, key, j),
      stage: stage(arr, { hand: a + 1, gap: a, key, flagI: a }),
      note: `${josa(key, "을", "를")} 손에 듭니다. ${a}번 칸이 빈자리가 됩니다`,
    };

    j = a - 1;
    yield {
      line: 4,
      vars: vars(i, key, j),
      stage: stage(arr, { hand: a + 1, gap: a, key, flagI: a, flagJ: j }),
      note: `빈자리 왼쪽 ${j}번 칸부터 견줍니다`,
    };

    for (;;) {
      const bigger = j >= 0 && arr[j] > key;
      yield {
        line: 5,
        vars: vars(i, key, j),
        stage: stage(arr, { hand: a + 1, gap: j + 1, key, cmp: j >= 0 ? j : null, flagI: a, flagJ: j }),
        note: bigger
          ? `${josa(arr[j], "은", "는")} 손에 든 ${key}보다 큽니다. 밀어야 합니다`
          : j >= 0
            ? `${josa(arr[j], "은", "는")} 손에 든 ${key}보다 크지 않습니다. 여기서 멈춥니다`
            : "맨 앞까지 왔습니다. 더 견줄 카드가 없습니다",
      };
      if (!bigger) break;

      arr[j + 1] = arr[j];
      yield {
        line: 6,
        vars: vars(i, key, j),
        stage: stage(arr, { hand: a + 1, gap: j, key, flagI: a, flagJ: j }),
        note: `${josa(arr[j + 1], "을", "를")} 한 칸 오른쪽으로 밀었습니다. 빈자리가 왼쪽으로 옮겨 옵니다`,
      };
      j -= 1; // 7번 줄 — 스텝으로 올리지 않는다
    }

    arr[j + 1] = key;
    yield {
      line: 8,
      vars: vars(i, key, j),
      stage: stage(arr, { hand: a + 1, placed: j + 1, flagI: a }),
      note: `${josa(key, "을", "를")} ${j + 1}번 칸에 놓았습니다. 손패는 ${a + 1}장이 됐습니다`,
    };
  }

  // 바깥 반복이 끝나는 자리 — 파이썬은 for 머리 줄을 한 번 더 지난다
  yield {
    line: 2,
    vars: vars(i, key, j),
    stage: stage(arr, { hand: n }),
    note: "더 받을 카드가 없습니다",
  };

  yield {
    line: INSERTION_SORT_CODE.length,
    vars: vars(i, key, j),
    stage: stage(arr, { hand: n }),
    note: "전부 정렬됐습니다",
    done: true,
  };
}

export function insertionSortTape(input: number[]): Tape {
  return buildTape(walk(input), INSERTION_SORT_CODE);
}

/**
 * 연산 횟수만 센다. `compares` 는 **카드끼리 견준 횟수**(`arr[j] > key` 를 실제로 따져 본 횟수 — 맨 앞에 와서
 * `j >= 0` 에서 끝나는 때는 견줄 카드가 없어 세지 않는다), `shifts` 는 카드를 한 칸 민 횟수다.
 * 밀기는 순서가 거꾸로 선 쌍의 수라 버블 정렬이 바꾸는 횟수와 같다.
 */
export function countInsertionOps(input: number[]): { compares: number; shifts: number } {
  const arr = [...input];
  let compares = 0;
  let shifts = 0;
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0) {
      compares++;
      if (arr[j] <= key) break;
      arr[j + 1] = arr[j];
      shifts++;
      j--;
    }
    arr[j + 1] = key;
  }
  return { compares, shifts };
}

/**
 * 같은 값에 이름표를 달아 삽입 정렬한다. `cmp` 는 밀지 말지 정하는 조건의 `>` 와 `>=`.
 * `>` 는 같은 값 앞에서 멈춰 원래 순서가 지켜진다(안정 정렬).
 * `>=` 는 같은 값도 넘어가 이미 정렬된 입력에서도 같은 값끼리 자리가 뒤집힌다.
 */
export function insertionLabels(pairs: [number, string][], cmp: ">" | ">="): string[] {
  const a = pairs.map((p) => [...p] as [number, string]);
  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    while (j >= 0 && (cmp === ">" ? a[j][0] > key[0] : a[j][0] >= key[0])) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
  return a.map(([v, l]) => `${v}${l}`);
}

/** 마지막 `arr[j + 1] = key` 줄을 뺀 코드의 결과. 손에 든 카드가 어디에도 놓이지 않아 사라진다. */
export function insertionWithoutPlace(input: number[]): number[] {
  const arr = [...input];
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
  }
  return arr;
}

// ── ① 손으로 하는 해 보기 ──────────────────────────────────────────────────────────────

/** 독자가 고르는 동작. 크면 밀고, 크지 않으면 놓고, 맨 앞이면 놓는다 — 삽입 정렬이 하는 동작 그대로다. */
export type HandAction = "bigger" | "notBigger" | "front";

export type HandState = {
  /** 줄 위의 칸. 빈자리는 null */
  slots: (number | null)[];
  /** 지금 받은 카드의 원래 칸(바깥 반복의 i) */
  i: number;
  /** 빈자리가 있는 칸. 끝나면 -1 */
  hole: number;
  /** 손에 든 카드. 끝나면 null */
  key: number | null;
  /** 카드끼리 견준 횟수 */
  compares: number;
  /** 카드를 민 횟수 */
  shifts: number;
  /** 카드 한 장마다 민 횟수. 앞에서부터 두 번째 카드(i=1)의 것 */
  perCard: number[];
  done: boolean;
};

/** 두 번째 카드를 집어 든 채 시작한다. 첫 카드는 손패 한 장이라 이미 정렬돼 있다. */
export function initHand(cards: number[]): HandState {
  const slots: (number | null)[] = [...cards];
  if (cards.length < 2) {
    return { slots, i: 1, hole: -1, key: null, compares: 0, shifts: 0, perCard: [], done: true };
  }
  const key = cards[1];
  slots[1] = null;
  return { slots, i: 1, hole: 1, key, compares: 0, shifts: 0, perCard: [0], done: false };
}

/** 한 동작을 해 본다. 틀린 동작이면 `ok: false` 로 이유만 돌려주고 상태는 그대로다. */
export function stepHand(
  s: HandState,
  action: HandAction,
): { state: HandState; ok: boolean; text: string } {
  if (s.done || s.key === null) return { state: s, ok: false, text: "카드를 모두 놓았습니다" };
  const key = s.key;
  const left = s.hole > 0 ? s.slots[s.hole - 1]! : null;

  if (left === null) {
    if (action !== "front") {
      return {
        state: s,
        ok: false,
        text: `맨 앞이라 더 견줄 카드가 없어요. ${josa(key, "을", "를")} 여기에 놓으세요`,
      };
    }
    return place(s, `${josa(key, "을", "를")} 맨 앞 ${s.hole}번 칸에 놓았습니다`);
  }

  if (action === "front") {
    return { state: s, ok: false, text: `아직 맨 앞이 아니에요. 왼쪽의 ${left}와 먼저 견주세요` };
  }

  const truth = left > key;
  if (action === "bigger" && !truth) {
    return {
      state: s,
      ok: false,
      text: `${josa(left, "은", "는")} 손에 든 ${key}보다 크지 않아요. 크지 않으면 더 밀지 않고 여기에 놓습니다`,
    };
  }
  if (action === "notBigger" && truth) {
    return {
      state: s,
      ok: false,
      text: `${josa(left, "은", "는")} 손에 든 ${key}보다 커요. 큰 카드가 앞을 막고 있으면 한 칸 오른쪽으로 밀어야 합니다`,
    };
  }

  if (action === "bigger") {
    const slots = [...s.slots];
    slots[s.hole] = left;
    slots[s.hole - 1] = null;
    const perCard = [...s.perCard];
    perCard[s.i - 1] = (perCard[s.i - 1] ?? 0) + 1;
    return {
      state: { ...s, slots, hole: s.hole - 1, compares: s.compares + 1, shifts: s.shifts + 1, perCard },
      ok: true,
      text: `${josa(left, "이", "가")} 손에 든 ${key}보다 커서 한 칸 오른쪽으로 밀었습니다`,
    };
  }

  // notBigger — 견줘 보니 크지 않다. 견주기만 세고 여기에 놓는다
  return place({ ...s, compares: s.compares + 1 }, `${josa(key, "을", "를")} ${s.hole}번 칸에 놓았습니다`);
}

/** 빈자리에 손에 든 카드를 놓고, 다음 카드를 집어 든다. 다 받았으면 끝낸다. */
function place(s: HandState, text: string): { state: HandState; ok: boolean; text: string } {
  const slots = [...s.slots];
  slots[s.hole] = s.key;
  const i = s.i + 1;
  if (i >= slots.length) {
    return {
      state: { ...s, slots, i, hole: -1, key: null, done: true },
      ok: true,
      text: `${text}. 카드를 모두 놓았습니다`,
    };
  }
  const next = slots[i]!;
  slots[i] = null;
  return {
    state: { ...s, slots, i, hole: i, key: next, perCard: [...s.perCard, 0], done: false },
    ok: true,
    text: `${text}. 다음 카드 ${josa(next, "을", "를")} 받았습니다`,
  };
}

/** ① 의 줄을 ④ 와 같은 무대로 그린다 — 빈자리, 손에 든 카드, 견주는 칸이 같은 모양이다. */
export function handStage(s: HandState): StageState {
  const values = s.slots.map((v) => v ?? 0);
  if (s.done) return stage(values, { hand: values.length });
  return stage(values, {
    hand: s.i + 1,
    gap: s.hole,
    key: s.key ?? undefined,
    cmp: s.hole > 0 ? s.hole - 1 : null,
  });
}
