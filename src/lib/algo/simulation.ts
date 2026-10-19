import type { CellState, Step, StageState, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * 로봇 시뮬레이션 코드. 명령을 한 글자씩 읽어 시키는 대로 따라 한다.
 * `F` 앞으로 한 칸(앞이 벽이거나 방 바깥이면 제자리), `R` 오른쪽으로 90도, `L` 왼쪽으로 90도.
 * 방향은 위(0) → 오른쪽(1) → 아래(2) → 왼쪽(3) 순서의 시계 방향이고, `dr`·`dc` 가 그 방향으로 한 칸 갈 때의 행·열 변화다.
 */
export const ROBOT_CODE = [
  "def robot(commands, grid, r, c):", // 1
  "    rows, cols = len(grid), len(grid[0])", // 2
  "    dr = [-1, 0, 1, 0]", // 3
  "    dc = [0, 1, 0, -1]", // 4
  "    d = 0", // 5
  "    for cmd in commands:", // 6
  '        if cmd == "F":', // 7
  "            nr, nc = r + dr[d], c + dc[d]", // 8
  "            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:", // 9
  "                r, c = nr, nc", // 10
  '        elif cmd == "R":', // 11
  "            d = (d + 1) % 4", // 12
  "        else:", // 13
  "            d = (d - 1) % 4", // 14
  "    return r, c", // 15
];

/**
 * ① 해 보기와 ④ 플레이어가 **같은 방**을 쓴다. 0 = 빈 칸, 1 = 벽. (행, 열) 은 0부터 세고 위쪽이 0행이다.
 * (1,2) 와 (3,1) 이 벽이다. 시작은 (3,0) 에서 위를 보고 선다.
 */
export const ROOM: number[][] = [
  [0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0],
];
export const ROOM_ROWS = ROOM.length;
export const ROOM_COLS = ROOM[0].length;
export const START = { r: 3, c: 0 };

/** 명령 여덟 개. 다섯 번째 F 는 벽에, 여덟 번째 F 는 방 바깥에 막힌다. */
export const COMMANDS = "FFRFFLFF";

export const DR = [-1, 0, 1, 0];
export const DC = [0, 1, 0, -1];
export const ARROWS = ["▲", "▶", "▼", "◀"];
/** 방향 이름 — `를/을` 이 붙은 꼴(목적어)과 그냥 이름. */
export const DIR_NAMES = ["위", "오른쪽", "아래", "왼쪽"];
export const DIR_OBJ = ["위를", "오른쪽을", "아래를", "왼쪽을"];

export type Pose = { r: number; c: number; d: number };
export type Block = "wall" | "edge" | null;

/** 칸 (r, c) 이 방 안의 빈 칸인가. 막힌 이유를 함께 돌려준다. */
export function blockOf(room: number[][], r: number, c: number): Block {
  if (r < 0 || c < 0 || r >= room.length || c >= (room[0]?.length ?? 0)) return "edge";
  return room[r][c] === 1 ? "wall" : null;
}

/** 명령 하나를 따라 한 뒤의 자세. 막히면 제자리이고 `block` 에 이유가 있다. */
export function stepCommand(
  room: number[][],
  pose: Pose,
  cmd: string,
): { pose: Pose; block: Block; ahead: { r: number; c: number } | null } {
  if (cmd === "R") return { pose: { ...pose, d: (pose.d + 1) % 4 }, block: null, ahead: null };
  if (cmd === "L") return { pose: { ...pose, d: (pose.d + 3) % 4 }, block: null, ahead: null };
  const ahead = { r: pose.r + DR[pose.d], c: pose.c + DC[pose.d] };
  const block = blockOf(room, ahead.r, ahead.c);
  return { pose: block ? pose : { ...pose, r: ahead.r, c: ahead.c }, block, ahead };
}

/** 시작 자세와 명령 전체를 돌려 명령마다 끝난 뒤의 자세를 모은다. 맨 앞이 시작 자세다. */
export function posesOf(room: number[][], start: { r: number; c: number }, commands: string): Pose[] {
  const out: Pose[] = [{ r: start.r, c: start.c, d: 0 }];
  for (const cmd of commands) out.push(stepCommand(room, out.at(-1)!, cmd).pose);
  return out;
}

/** 명령을 다 따라 한 뒤 로봇이 선 칸. */
export function finalCell(room: number[][], start: { r: number; c: number }, commands: string): { r: number; c: number } {
  const p = posesOf(room, start, commands).at(-1)!;
  return { r: p.r, c: p.c };
}

/** 벽과 바깥을 무시하고 명령을 그대로 따랐다면 서게 될 칸 — "막히지 않았다면"의 값이다. */
export function unblockedCell(start: { r: number; c: number }, commands: string): { r: number; c: number } {
  let { r, c } = start;
  let d = 0;
  for (const cmd of commands) {
    if (cmd === "R") d = (d + 1) % 4;
    else if (cmd === "L") d = (d + 3) % 4;
    else {
      r += DR[d];
      c += DC[d];
    }
  }
  return { r, c };
}

/** 두 칸 사이의 거리 — 위·아래·왼쪽·오른쪽으로 걸어야 하는 칸 수(대각선 없음). */
export function distance(a: { r: number; c: number }, b: { r: number; c: number }): number {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

/**
 * ⑥ 틀리는 자리 — 코드를 일부러 고친 변형을 돌려 본다(파이썬으로 같은 변형을 돌린 값과 테스트가 맞춘다).
 * `edgeCheck: false` 는 경계 검사(`0 <= nr < rows and 0 <= nc < cols`)를 뺀 코드다. 파이썬 리스트처럼 음수 인덱스는 뒤에서부터
 * 읽고(`grid[-1]` 은 맨 아래 줄), 범위를 넘는 인덱스는 `IndexError` 라 "IndexError" 를 돌려준다.
 * `dc` 는 방향 순서를 바꾼 변형(위·왼쪽·아래·오른쪽)을 쓸 때 넘긴다.
 */
export function endOfVariant(
  room: number[][],
  start: { r: number; c: number },
  commands: string,
  opts: { edgeCheck?: boolean; dc?: number[] } = {},
): { r: number; c: number } | "IndexError" {
  const dc = opts.dc ?? DC;
  const at = (r: number, c: number): number | undefined => {
    const row = room[r < 0 ? room.length + r : r];
    return row === undefined ? undefined : row[c < 0 ? row.length + c : c];
  };
  let { r, c } = start;
  let d = 0;
  for (const cmd of commands) {
    if (cmd === "R") d = (d + 1) % 4;
    else if (cmd === "L") d = (d + 3) % 4;
    else {
      const nr = r + DR[d];
      const nc = c + dc[d];
      const inside = nr >= 0 && nc >= 0 && nr < room.length && nc < (room[0]?.length ?? 0);
      if (opts.edgeCheck === false) {
        const cell = at(nr, nc);
        if (cell === undefined) return "IndexError";
        if (cell === 0) {
          r = nr;
          c = nc;
        }
      } else if (inside && room[nr][nc] === 0) {
        r = nr;
        c = nc;
      }
    }
  }
  return { r, c };
}

type Snap = { r: number; c: number; d: number; nr: number | null; nc: number | null };

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function varsOf(s: Snap): Record<string, number> {
  const v: Record<string, number> = { r: s.r, c: s.c, d: s.d };
  if (s.nr !== null) v.nr = s.nr;
  if (s.nc !== null) v.nc = s.nc;
  return v;
}

function stageOf(
  room: number[][],
  pose: Pose,
  trail: number[],
  cmds: string[],
  at: number,
  done: number,
  cmd: string | null,
  ahead: { r: number; c: number } | null,
  block: Block,
): StageState {
  const rows = room.length;
  const cols = room[0]?.length ?? 0;
  const here = pose.r * cols + pose.c;
  const cells: CellState[] = Array.from({ length: rows * cols }, (_, i) => {
    if (i === here) return "current";
    if (room[Math.floor(i / cols)][i % cols] === 1) return "dropped";
    return trail.includes(i) ? "settled" : "out";
  });
  return {
    cells,
    flags: {},
    robot: {
      rows,
      cols,
      walls: room.flat().map((v) => v === 1),
      r: pose.r,
      c: pose.c,
      d: pose.d,
      trail: [...trail],
      cmds: [...cmds],
      at,
      done,
      cmd,
      ahead: ahead && block !== "edge" ? ahead.r * cols + ahead.c : null,
      block,
    },
  };
}

const CMD_OBJ: Record<string, string> = { F: "F를", R: "R을", L: "L을" };

function* walk(commands: string, room: number[][], r0: number, c0: number): Generator<Step> {
  const cols = room[0]?.length ?? 0;
  const cmds = [...commands];
  let pose: Pose = { r: r0, c: c0, d: 0 };
  let nr: number | null = null;
  let nc: number | null = null;
  let cmd: string | null = null;
  const trail = [r0 * cols + c0];
  const snap = (): Snap => ({ ...pose, nr, nc });
  const stage = (at: number, done: number, ahead: { r: number; c: number } | null = null, block: Block = null) =>
    stageOf(room, pose, trail, cmds, at, done, cmd, ahead, block);

  yield {
    line: 5,
    vars: varsOf(snap()),
    stage: stage(-1, 0),
    note: `로봇이 (${pose.r}, ${pose.c}) 칸에서 ${DIR_OBJ[pose.d]} 보고 서 있습니다`,
  };

  for (let i = 0; i < cmds.length; i++) {
    cmd = cmds[i];
    yield {
      line: 6,
      vars: varsOf(snap()),
      stage: stage(i, i),
      note: `${i + 1}번째 명령 ${CMD_OBJ[cmd]} 읽습니다`,
    };

    if (cmd === "F") {
      nr = pose.r + DR[pose.d];
      nc = pose.c + DC[pose.d];
      const ahead = { r: nr, c: nc };
      yield {
        line: 8,
        vars: varsOf(snap()),
        stage: stage(i, i, ahead),
        note: `${DIR_OBJ[pose.d]} 보고 있으니 앞은 (${nr}, ${nc}) 칸입니다`,
      };

      const block = blockOf(room, nr, nc);
      yield {
        line: 9,
        vars: varsOf(snap()),
        stage: stage(i, block ? i + 1 : i, ahead, block),
        note: block
          ? `(${nr}, ${nc}) 칸은 ${block === "wall" ? "벽" : "방 바깥"}이라 못 갑니다. 제자리에 섭니다`
          : `(${nr}, ${nc}) 칸은 방 안의 빈 칸이라 갈 수 있습니다`,
      };
      if (!block) {
        pose = { ...pose, r: nr, c: nc };
        trail.push(nr * cols + nc);
        yield {
          line: 10,
          vars: varsOf(snap()),
          stage: stage(i, i + 1),
          note: `로봇이 (${pose.r}, ${pose.c}) 칸으로 한 칸 갔습니다`,
        };
      }
    } else if (cmd === "R") {
      pose = { ...pose, d: (pose.d + 1) % 4 };
      yield {
        line: 12,
        vars: varsOf(snap()),
        stage: stage(i, i + 1),
        note: `R은 시계 방향으로 90도 돕니다. 이제 ${DIR_OBJ[pose.d]} 봅니다`,
      };
    } else {
      pose = { ...pose, d: (pose.d + 3) % 4 };
      yield {
        line: 14,
        vars: varsOf(snap()),
        stage: stage(i, i + 1),
        note: `L은 반시계 방향으로 90도 돕니다. 이제 ${DIR_OBJ[pose.d]} 봅니다`,
      };
    }
  }

  yield {
    line: 6,
    vars: varsOf(snap()),
    stage: stage(cmds.length, cmds.length),
    note: "읽을 명령이 더 없습니다",
  };
  yield {
    line: ROBOT_CODE.length,
    vars: varsOf(snap()),
    stage: stage(cmds.length, cmds.length),
    note: `명령이 끝났습니다. 로봇은 (${pose.r}, ${pose.c}) 칸에 서 있습니다`,
    done: true,
  };
}

export function robotTape(commands: string, room: number[][], r: number, c: number): Tape {
  return buildTape(walk(commands, room, r, c), ROBOT_CODE);
}

/** 예측 관문 자리 — 막히는 F 의 9번 줄(조건 검사) 스텝 번호. 처음 막히는 곳을 찾는다. */
export function firstBlockedIndex(tape: Tape): number {
  return tape.steps.findIndex((s) => s.line === 9 && s.stage.robot?.block);
}
