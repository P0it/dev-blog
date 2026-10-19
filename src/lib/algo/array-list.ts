import type { CellState, StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * 리스트 맨 앞에 끼우는 코드. 파이썬의 `arr.insert(0, x)` 가 안에서 하는 일을 손으로 풀어 쓴 것이다.
 * 뒤에서부터 한 칸씩 뒤로 밀어 맨 앞에 빈자리를 만든 뒤 거기에 넣는다.
 */
export const ARRAY_CODE = [
  "def insert_front(arr, x):", // 1
  "    arr.append(None)", // 2
  "    moved = 0", // 3
  "    for i in range(len(arr) - 1, 0, -1):", // 4
  "        arr[i] = arr[i - 1]", // 5
  "        moved += 1", // 6
  "    arr[0] = x", // 7
  "    return moved", // 8
];

/** ① 해 보기와 ④ 플레이어가 함께 쓰는 줄. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다. */
export const LINE_PEOPLE = [3, 5, 8, 2, 9, 4, 7];
export const NEW_PERSON = 1;

/** 파이썬에서 `None` 이 든 칸을 그림 값으로 옮길 때 쓰는 자리표시(그림은 gap 으로 가려 그린다). */
const BLANK = 0;

/**
 * 그림 한 장. 값(`values`)은 파이썬 리스트 그대로 — 밀고 난 칸에는 옛 복사본이 남아 있다.
 * 그 칸은 `gap` 으로 가려서 "빈자리"로 그린다. 새로 온 사람은 옆(`queue`)에서 기다린다.
 */
function stage(
  values: number[],
  opts: { cur?: number; next?: number; gap?: number; waiting?: number; settledAt?: number; flagI?: number | null },
): StageState {
  const cells: CellState[] = values.map((_, k) => {
    if (k === opts.settledAt) return "settled";
    if (k === opts.cur) return "current";
    if (k === opts.next) return "compare";
    return "out";
  });
  return {
    cells,
    flags: opts.flagI === undefined || opts.flagI === null ? {} : { i: opts.flagI },
    values: [...values],
    ...(opts.gap === undefined ? {} : { gap: opts.gap }),
    ...(opts.waiting === undefined ? {} : { queue: [opts.waiting] }),
  };
}

type Vars = { i: number | null; moved: number | null };

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(s: Vars): Record<string, number> {
  const out: Record<string, number> = {};
  if (s.moved !== null) out.moved = s.moved;
  if (s.i !== null) out.i = s.i;
  return out;
}

function* walk(input: number[], x: number): Generator<Step> {
  const a = [...input];
  const n0 = a.length;
  const s: Vars = { i: null, moved: null };

  // 줄 2: arr.append(None) — 맨 끝에 빈자리 하나
  a.push(BLANK);
  yield {
    line: 2,
    vars: vars(s),
    stage: stage(a, { gap: n0, waiting: x }),
    note: "줄 맨 뒤에 빈자리를 하나 만듭니다",
  };

  s.moved = 0;
  yield { line: 3, vars: vars(s), stage: stage(a, { gap: n0, waiting: x }), note: "밀어낸 횟수를 0 으로 둡니다" };

  // 줄 4~6: 뒤에서부터 한 칸씩
  for (let i = n0; i >= 1; i--) {
    s.i = i;
    yield {
      line: 4,
      vars: vars(s),
      stage: stage(a, { gap: i, waiting: x, cur: i, next: i - 1, flagI: i }),
      note: `빈자리는 ${i}번 칸입니다. 그 앞 ${i - 1}번 칸 사람을 밀 차례입니다`,
    };

    const who = a[i - 1];
    a[i] = a[i - 1];
    yield {
      line: 5,
      vars: vars(s),
      stage: stage(a, { gap: i - 1, waiting: x, cur: i, flagI: i }),
      note: `${who}번 사람을 한 칸 뒤 ${i}번 칸으로 보냅니다`,
    };

    s.moved = (s.moved ?? 0) + 1;
    yield {
      line: 6,
      vars: vars(s),
      stage: stage(a, { gap: i - 1, waiting: x, cur: i, flagI: i }),
      note: `밀어낸 횟수가 ${s.moved}번이 됩니다`,
    };
  }

  // 줄 4: 반복이 끝나는 자리 — 빈자리가 맨 앞까지 왔다
  yield {
    line: 4,
    vars: vars(s),
    stage: stage(a, { gap: 0, waiting: x }),
    note: "빈자리가 맨 앞까지 왔습니다. 더 밀 사람이 없습니다",
  };

  // 줄 7: arr[0] = x
  a[0] = x;
  yield {
    line: 7,
    vars: vars(s),
    stage: stage(a, { settledAt: 0 }),
    note: `비어 있는 맨 앞 칸에 새 사람 ${x}번을 세웁니다`,
  };

  yield {
    line: 8,
    vars: vars(s),
    stage: stage(a, { settledAt: 0 }),
    note: `새 사람을 맨 앞에 세웠습니다. 사람을 ${s.moved}번 밀었습니다`,
    done: true,
  };
}

export function insertFrontTape(arr: number[], x: number): Tape {
  return buildTape(walk(arr, x), ARRAY_CODE);
}

// ── ① 해 보기 — 빈자리 바로 앞 사람만 밀 수 있다 ──

export type LineState = {
  /** 칸마다 사람(번호표). 빈자리는 null. 끝에 빈자리 한 칸이 더 있다 */
  slots: (number | null)[];
  /** 지금 빈자리 번호 */
  gap: number;
  /** 한 칸씩 밀어낸 횟수 */
  moved: number;
  /** 새 사람을 맨 앞에 세웠는지 */
  placed: boolean;
};

export function initLine(people: number[]): LineState {
  return { slots: [...people, null], gap: people.length, moved: 0, placed: false };
}

export type Pressed = { line: LineState; ok: boolean; text: string };

/**
 * i 번 칸 사람을 눌렀다.
 *
 * ① 에서 허용하는 동작 = 코드가 하는 동작이다. 코드는 **빈자리 바로 앞 사람부터** 뒤로 민다 —
 * 앞쪽 사람부터 밀면 그 뒤에 선 사람 자리를 덮어쓰기 때문이다. 그래서 그 한 사람만 눌린다.
 */
export function press(line: LineState, i: number): Pressed {
  if (line.placed) return { line, ok: false, text: "" };
  if (i === line.gap) return { line, ok: false, text: "여기는 빈자리예요. 빈자리 바로 앞 사람을 눌러 보세요" };
  if (i > line.gap) return { line, ok: false, text: "이 사람은 이미 한 칸 뒤로 옮겼어요" };
  if (i < line.gap - 1) {
    return {
      line,
      ok: false,
      text: "앞쪽 사람을 먼저 밀면 바로 뒤에 선 사람 자리를 덮어써 버립니다. 빈자리 바로 앞 사람부터 밀어 주세요",
    };
  }
  const slots = [...line.slots];
  slots[line.gap] = slots[i];
  slots[i] = null;
  return {
    line: { ...line, slots, gap: i, moved: line.moved + 1 },
    ok: true,
    text: `${slots[line.gap]}번 사람을 한 칸 뒤로 보냈습니다`,
  };
}

/** 맨 앞 빈자리에 새 사람을 세운다. 빈자리가 맨 앞에 와야 한다. */
export function place(line: LineState, x: number): Pressed {
  if (line.placed) return { line, ok: false, text: "" };
  if (line.gap !== 0) return { line, ok: false, text: "아직 맨 앞이 비지 않았어요. 빈자리 앞 사람을 계속 뒤로 보내세요" };
  const slots = [...line.slots];
  slots[0] = x;
  return { line: { ...line, slots, gap: -1, placed: true }, ok: true, text: `새 사람 ${x}번이 맨 앞에 섰습니다` };
}

/** ① 첫 질문 — 예상. 정답이 첫 번째다. */
export const PREDICT_OPTIONS: { label: string; correct?: boolean }[] = [
  { label: "맨 뒤에 붙이는 쪽이 덜 민다", correct: true },
  { label: "맨 앞에 끼우는 쪽이 덜 민다" },
  { label: "똑같이 민다" },
];

// ── 횟수 ──

/** 줄이 n 명일 때 맨 앞에 끼우려면 n 명을 민다. */
export function insertFrontMoves(n: number): number {
  return n;
}

/** 맨 뒤에 붙일 때는 밀 사람이 없다. */
export function appendMoves(_n: number): number {
  return 0;
}

/** 빈 줄에서 시작해 N 번 맨 앞에 끼울 때 민 총 횟수. 0 + 1 + … + (N-1). */
export function slideTotal(n: number): number {
  return (n * (n - 1)) / 2;
}
