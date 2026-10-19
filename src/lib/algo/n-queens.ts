import type { Step, StageState, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * N-퀸 코드. 줄을 하나씩 내려가며 퀸을 놓고, 놓을 곳이 없으면 앞 줄로 돌아와 퀸을 거둔 뒤 다음 칸을 시도한다.
 * `cols` 는 퀸이 있는 열, `d1` 은 `diag = 줄 − 열`, `d2` 는 `anti = 줄 + 열` — 같은 대각선에 있는 칸은 이 값이 같다.
 */
export const QUEENS_CODE = [
  "def place(row, n, cols, d1, d2):", // 1
  "    if row == n:", // 2
  "        return True", // 3
  "    for col in range(n):", // 4
  "        diag, anti = row - col, row + col", // 5
  "        if col in cols or diag in d1 or anti in d2:", // 6
  "            continue", // 7
  "        cols.add(col); d1.add(diag); d2.add(anti)", // 8
  "        if place(row + 1, n, cols, d1, d2):", // 9
  "            return True", // 10
  "        cols.remove(col); d1.remove(diag); d2.remove(anti)", // 11
  "    return False", // 12
];

/** ① 해 보기와 ④ 플레이어가 함께 쓰는 보드 크기. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다. */
export const QUEEN_N = 4;

export type Attacker = { row: number; col: number; kind: "column" | "diagonal" };

/**
 * `(row, col)` 칸을 이미 놓은 퀸이 노리는가. `at[r]` 은 r 번째 줄 퀸의 칸 번호(없으면 -1)이고, 위 줄(`r < row`)만 본다.
 * 노리면 어느 퀸이 어떻게 노리는지 돌려준다 — ① 해 보기가 이유를 한 줄로 말할 때 쓴다.
 */
export function attackedBy(at: number[], row: number, col: number): Attacker | null {
  for (let r = 0; r < row; r++) {
    const c = at[r];
    if (c < 0) continue;
    if (c === col) return { row: r, col: c, kind: "column" };
    if (Math.abs(r - row) === Math.abs(c - col)) return { row: r, col: c, kind: "diagonal" };
  }
  return null;
}

/** `row` 줄에서 놓을 수 있는 칸 번호들(왼쪽부터). */
export function safeCols(at: number[], row: number, n: number = QUEEN_N): number[] {
  const out: number[] = [];
  for (let c = 0; c < n; c++) if (!attackedBy(at, row, c)) out.push(c);
  return out;
}

/** `from` 칸부터 오른쪽으로 처음 만나는, 놓을 수 있는 칸. 없으면 null. */
export function nextCol(at: number[], row: number, from: number, n: number = QUEEN_N): number | null {
  for (let c = from; c < n; c++) if (!attackedBy(at, row, c)) return c;
  return null;
}

/** 놓지 못하는 이유를 한 문장으로. */
export function attackReason(a: Attacker): string {
  return a.kind === "column"
    ? `줄 ${a.row}, 칸 ${a.col} 의 퀸과 같은 열이에요`
    : `줄 ${a.row}, 칸 ${a.col} 의 퀸이 대각선으로 노려요`;
}

const board = (
  n: number,
  at: number[],
  row: number,
  mode: NonNullable<StageState["queens"]>["mode"],
  tryCol?: number,
): StageState => ({
  cells: [],
  flags: {},
  queens: { n, at: [...at], row, mode, ...(tryCol === undefined ? {} : { try: tryCol }) },
});

/**
 * 줄 8·11 은 퀸을 놓고 거두는 줄이라 **줄을 실행한 뒤** 상태를, 줄 2·3·12 는 상태가 안 바뀌어 그대로를 보인다.
 * 줄 4~7(칸을 훑으며 노리는 칸을 건너뛰는 일)은 줄 2 한 스텝으로 묶는다 — 칸마다 한 스텝이면 연타로 끝난다.
 */
function* walk(n: number): Generator<Step> {
  const at: number[] = Array(n).fill(-1);

  function* place(row: number): Generator<Step, boolean> {
    if (row === n) {
      yield {
        line: 2,
        vars: { row, queens: row },
        stage: board(n, at, row, "done"),
        note: "모든 줄에 퀸을 놓았는지 봅니다",
      };
      yield {
        line: 3,
        vars: { row, queens: n },
        stage: board(n, at, row, "done"),
        note: `퀸 ${n}개를 모두 놓았습니다. 서로 노리는 퀸이 없는 배치입니다`,
        done: true,
      };
      return true;
    }

    const safe = safeCols(at, row, n);
    yield {
      line: 2,
      vars: { row, queens: row },
      stage: board(n, at, row, "scan"),
      note:
        safe.length > 0
          ? `줄 ${row} 에서 놓을 수 있는 칸을 찾습니다. 퀸 ${row}개가 놓여 있고, 놓을 수 있는 칸은 ${safe.join(", ")} 입니다`
          : `줄 ${row} 에서 놓을 수 있는 칸을 찾습니다. 퀸 ${row}개가 놓여 있고, 놓을 수 있는 칸은 하나도 없습니다`,
    };

    for (let col = 0; col < n; col++) {
      if (attackedBy(at, row, col)) continue;
      at[row] = col;
      yield {
        line: 8,
        vars: { row, col, queens: row + 1 },
        stage: board(n, at, row, "place", col),
        note: `줄 ${row}, 칸 ${col} 에 퀸을 놓습니다. 이제 퀸 ${row + 1}개입니다`,
      };
      if (yield* place(row + 1)) return true;
      at[row] = -1;
      yield {
        line: 11,
        vars: { row, col, queens: row },
        stage: board(n, at, row, "back", col),
        note: `줄 ${row}, 칸 ${col} 의 퀸을 거둡니다. 같은 줄의 다음 칸을 봅니다`,
      };
    }

    yield {
      line: 12,
      vars: { row, col: n - 1, queens: row },
      stage: board(n, at, row, "stuck"),
      note:
        row === 0
          ? "줄 0 에서도 놓을 칸이 없습니다. 이 크기에는 해가 없습니다"
          : `줄 ${row} 에 더는 놓을 칸이 없습니다. 앞 줄로 돌아갑니다`,
      ...(row === 0 ? { done: false } : {}),
    };
    return false;
  }

  yield* place(0);
}

export function queensTape(n: number = QUEEN_N): Tape {
  return buildTape(walk(n), QUEENS_CODE);
}

// ── 횟수 세기 — 비교용이라 테이프를 만들지 않는다 ──

/** 퀸을 놓은 횟수(줄 8 실행 횟수). `first` 면 첫 해를 찾는 순간까지, 아니면 모든 해를 찾을 때까지. */
export function countPlacements(n: number, first: boolean): number {
  const at: number[] = Array(n).fill(-1);
  let count = 0;
  const go = (row: number): boolean => {
    if (row === n) return true;
    for (let col = 0; col < n; col++) {
      if (attackedBy(at, row, col)) continue;
      count++;
      at[row] = col;
      if (go(row + 1) && first) return true;
      at[row] = -1;
    }
    return false;
  };
  go(0);
  return count;
}

/** 서로 노리지 않게 놓는 방법의 수. */
export function countSolutions(n: number): number {
  const at: number[] = Array(n).fill(-1);
  let total = 0;
  const go = (row: number) => {
    if (row === n) {
      total++;
      return;
    }
    for (let col = 0; col < n; col++) {
      if (attackedBy(at, row, col)) continue;
      at[row] = col;
      go(row + 1);
      at[row] = -1;
    }
  };
  go(0);
  return total;
}

/** 첫 해(줄마다 퀸의 칸 번호). 해가 없으면 null. */
export function firstSolution(n: number): number[] | null {
  const at: number[] = Array(n).fill(-1);
  const go = (row: number): boolean => {
    if (row === n) return true;
    for (let col = 0; col < n; col++) {
      if (attackedBy(at, row, col)) continue;
      at[row] = col;
      if (go(row + 1)) return true;
      at[row] = -1;
    }
    return false;
  };
  return go(0) ? [...at] : null;
}

/** 조합 수 C(n, k). 숫자로 담기는 크기만 쓴다. */
export function choose(n: number, k: number): number {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

export type HandAction = { kind: "place" | "back"; row: number; col: number };

/**
 * ① 해 보기의 규칙(놓을 수 있는 칸 가운데 **가장 왼쪽 칸부터**, 막히면 앞 줄 퀸을 거둔다)을 그대로 따라 한
 * 손동작 순서. 독자가 해 볼 때 누르게 되는 순서와 같고, ④ 플레이어의 놓기·거두기 줄(8·11)과도 같다.
 */
export function handScript(n: number = QUEEN_N): HandAction[] {
  const at: number[] = Array(n).fill(-1);
  const start: number[] = Array(n).fill(0);
  const out: HandAction[] = [];
  let row = 0;
  while (row < n) {
    const col = nextCol(at, row, start[row], n);
    if (col !== null) {
      at[row] = col;
      out.push({ kind: "place", row, col });
      row++;
      if (row < n) start[row] = 0;
    } else {
      if (row === 0) return out; // 해가 없다
      row--;
      const c0 = at[row];
      at[row] = -1;
      start[row] = c0 + 1;
      out.push({ kind: "back", row, col: c0 });
    }
  }
  return out;
}

/** ④ 플레이어의 예측 관문 — 줄 2 의 스텝 가운데 `row` 줄에 처음 들어오는 스텝 번호. */
export function firstScanIndex(tape: Tape, row: number): number {
  return tape.steps.findIndex((s) => s.line === 2 && s.vars.row === row && s.stage.queens?.mode === "scan");
}

/** 첫 번째로 놓을 곳이 하나도 없는 줄에 들어오는 줄 2 스텝 번호(그 줄의 노트가 "하나도 없다"). */
export function firstEmptyScanIndex(tape: Tape): number {
  return tape.steps.findIndex(
    (s) => s.line === 2 && s.stage.queens?.mode === "scan" && safeCols(s.stage.queens.at, s.stage.queens.row, s.stage.queens.n).length === 0,
  );
}
