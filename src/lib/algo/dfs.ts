import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { DEMO_GRID, DEMO_START, DEMO_GOAL, type Cell } from "./bfs-grid.ts";

// ① 해 보기와 ④ 플레이어는 격자 BFS 와 **같은 격자**를 쓴다 — 같은 길을 큐로 가면 7걸음, 스택으로 가면 9걸음이다.
export { DEMO_GRID, DEMO_START, DEMO_GOAL };
export type { Cell };

/** 격자 BFS 코드에서 큐(`deque`)를 스택(`list`)으로 바꾼 것. 꺼내는 쪽만 다르다. */
export const DFS_CODE = [
  "def dfs(grid, start, goal):", // 1
  "    rows, cols = len(grid), len(grid[0])", // 2
  "    stack = [start]", // 3
  "    dist = {start: 0}", // 4
  "    while stack:", // 5
  "        r, c = stack.pop()", // 6
  "        if (r, c) == goal:", // 7
  "            return dist[(r, c)]", // 8
  "        for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):", // 9
  "            nr, nc = r + dr, c + dc", // 10
  "            if not (0 <= nr < rows and 0 <= nc < cols):", // 11
  "                continue", // 12
  "            if grid[nr][nc] == 0 and (nr, nc) not in dist:", // 13
  "                dist[(nr, nc)] = dist[(r, c)] + 1", // 14
  "                stack.append((nr, nc))", // 15
  "    return -1", // 16
];

/** 위·아래·왼쪽·오른쪽. 코드의 `for dr, dc in …` 와 같은 순서다. */
const DIRS: Cell[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
/** 이웃 순서를 거꾸로 한 코드(⑥) — 오른쪽·왼쪽·아래·위 */
const DIRS_REVERSED: Cell[] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

export const cellKey = (r: number, c: number) => r * 1000 + c;

const inside = (grid: number[][], r: number, c: number) => r >= 0 && c >= 0 && r < grid.length && c < grid[0].length;

// ── ④ 플레이어 테이프 ──

function stage(
  grid: number[][],
  dist: Map<number, number>,
  st: Cell[],
  now: Cell | null,
  goal: Cell,
  found: boolean,
) {
  const inStack = new Set(st.map(([r, c]) => cellKey(r, c)));
  const cells: CellState[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 1) cells.push("dropped"); // 벽
      else if (found && r === goal[0] && c === goal[1]) cells.push("settled");
      else if (now && r === now[0] && c === now[1]) cells.push("current");
      else if (inStack.has(cellKey(r, c))) cells.push("waiting");
      else if (dist.has(cellKey(r, c))) cells.push("compare"); // 이미 다녀간 칸
      else cells.push("out");
    }
  }
  // 레인에는 스택에 든 칸의 걸음 수가 바닥부터 맨 위 순서로 들어간다
  return { cells, flags: {} as Record<string, number>, queue: st.map(([r, c]) => dist.get(cellKey(r, c)) ?? 0) };
}

function* walk(grid: number[][], start: Cell, goal: Cell): Generator<Step> {
  const dist = new Map<number, number>([[cellKey(...start), 0]]);
  const st: Cell[] = [start];

  yield {
    line: 4,
    vars: { 스택: st.length },
    stage: stage(grid, dist, st, null, goal, false),
    note: "시작 칸 하나를 스택에 넣고 걸음 수 0을 적어 둡니다",
  };

  while (st.length) {
    const now = st.pop()!;
    const [r, c] = now;
    const d = dist.get(cellKey(r, c))!;

    yield {
      line: 6,
      vars: { r, c, dist: d, 스택: st.length },
      stage: stage(grid, dist, st, now, goal, false),
      note: `스택 맨 위를 꺼냅니다. ${d}걸음 떨어진 칸입니다`,
    };

    if (r === goal[0] && c === goal[1]) {
      yield {
        line: 8,
        vars: { r, c, dist: d, 스택: st.length },
        stage: stage(grid, dist, st, now, goal, true),
        note: `도착했습니다. ${d}걸음입니다`,
        done: true,
      };
      return;
    }

    let added = 0;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inside(grid, nr, nc) || grid[nr][nc] !== 0 || dist.has(cellKey(nr, nc))) continue;
      dist.set(cellKey(nr, nc), d + 1);
      st.push([nr, nc]);
      added++;
    }

    yield {
      line: 15,
      vars: { r, c, dist: d, 스택: st.length },
      stage: stage(grid, dist, st, now, goal, false),
      note:
        added === 0
          ? st.length > 0
            ? "갈 수 있는 이웃이 없는 막다른 길입니다. 스택에 남은 맨 위 칸으로 되돌아갑니다"
            : "갈 수 있는 이웃이 없습니다"
          : added === 1
            ? `이웃 1칸을 스택 맨 위에 쌓습니다. 그 길로 이어 갑니다`
            : `이웃 ${added}칸을 스택에 쌓습니다. 마지막에 쌓은 칸이 먼저 나옵니다`,
    };
  }

  yield {
    line: DFS_CODE.length,
    vars: { 스택: 0 },
    stage: stage(grid, dist, st, null, goal, false),
    note: "스택이 비었습니다. 갈 수 있는 길이 없습니다",
    done: false,
  };
}

export function dfsGridTape(grid: number[][], start: Cell, goal: Cell): Tape {
  return buildTape(walk(grid, start, goal), DFS_CODE);
}

/**
 * 스택 코드가 도착 칸에서 돌려주는 값. `order` 를 `reversed` 로 하면 이웃을 넣는 순서가 거꾸로다(⑥).
 * 걸음 수는 **그 칸을 처음 발견한 길**의 길이다 — 길을 어떻게 골랐느냐에 따라 달라진다.
 */
export function dfsDist(
  grid: number[][],
  start: Cell,
  goal: Cell,
  order: "default" | "reversed" = "default",
): number {
  const dirs = order === "default" ? DIRS : DIRS_REVERSED;
  const dist = new Map<number, number>([[cellKey(...start), 0]]);
  const st: Cell[] = [start];
  while (st.length) {
    const [r, c] = st.pop()!;
    if (r === goal[0] && c === goal[1]) return dist.get(cellKey(r, c))!;
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inside(grid, nr, nc) || grid[nr][nc] !== 0 || dist.has(cellKey(nr, nc))) continue;
      dist.set(cellKey(nr, nc), dist.get(cellKey(r, c))! + 1);
      st.push([nr, nc]);
    }
  }
  return -1;
}

/**
 * 방문 표시(`not in dist`)를 뺀 코드를 `cap` 번까지만 돌린다. 도착에 닿으면 `reached`.
 * 표시가 없으면 이미 온 칸을 계속 다시 넣어 끝나지 않는다.
 */
export function noMarkPops(grid: number[][], start: Cell, goal: Cell, cap: number): { reached: boolean; pops: number } {
  const st: Cell[] = [start];
  let pops = 0;
  while (st.length && pops < cap) {
    const [r, c] = st.pop()!;
    pops++;
    if (r === goal[0] && c === goal[1]) return { reached: true, pops };
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inside(grid, nr, nc) || grid[nr][nc] !== 0) continue;
      st.push([nr, nc]);
    }
  }
  return { reached: false, pops };
}

/**
 * ④ 중간 예측 관문 — 갈림길에서 **두 칸을 쌓은 다음**, 꺼내는 스텝으로 넘어가기 직전에 묻는다.
 * 없으면 -1.
 */
export function pauseStepIndex(tape: Tape): number {
  let lastPop = 0;
  for (let i = 0; i < tape.steps.length; i++) {
    const s = tape.steps[i];
    if (s.line === 6) lastPop = s.vars.스택;
    if (s.line === 15 && s.vars.스택 - lastPop >= 2) return i + 1;
  }
  return -1;
}

// ── ① 미로 걷기 ──
//
// 독자가 한 칸씩 걷는다. 허용 동작은 DFS 의 동작과 같다 — 안 가 본 이웃 칸으로 한 칸 가거나,
// 더 갈 곳이 없을 때(막다른 길) 지나온 길을 한 칸 되돌아간다. 이미 온 칸에는 다시 못 들어간다.

export type Walk = {
  /** 시작 칸부터 지금 칸까지의 길 */
  path: Cell[];
  /** 한 번이라도 들어간 칸(되돌아 나온 칸 포함)의 키 */
  seen: number[];
  moves: number;
  backs: number;
};

export type MoveResult = { ok: true; walk: Walk } | { ok: false; reason: "far" | "wall" | "seen" };
export type BackResult = { ok: true; walk: Walk } | { ok: false; reason: "free" | "atStart" };

export function startWalk(start: Cell): Walk {
  return { path: [start], seen: [cellKey(...start)], moves: 0, backs: 0 };
}

export const walkSteps = (w: Walk) => w.moves + w.backs;
export const here = (w: Walk): Cell => w.path[w.path.length - 1];

/** 지금 칸에서 아직 안 가 본 열린 이웃 칸 */
export function unseenNeighbors(grid: number[][], w: Walk): Cell[] {
  const [r, c] = here(w);
  const seen = new Set(w.seen);
  const out: Cell[] = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (inside(grid, nr, nc) && grid[nr][nc] === 0 && !seen.has(cellKey(nr, nc))) out.push([nr, nc]);
  }
  return out;
}

export const isStuck = (grid: number[][], w: Walk) => unseenNeighbors(grid, w).length === 0;

export function moveTo(grid: number[][], w: Walk, to: Cell): MoveResult {
  const [r, c] = here(w);
  if (Math.abs(to[0] - r) + Math.abs(to[1] - c) !== 1 || !inside(grid, to[0], to[1])) return { ok: false, reason: "far" };
  if (grid[to[0]][to[1]] !== 0) return { ok: false, reason: "wall" };
  if (w.seen.includes(cellKey(...to))) return { ok: false, reason: "seen" };
  return { ok: true, walk: { ...w, path: [...w.path, to], seen: [...w.seen, cellKey(...to)], moves: w.moves + 1 } };
}

export function backUp(grid: number[][], w: Walk): BackResult {
  if (!isStuck(grid, w)) return { ok: false, reason: "free" };
  if (w.path.length === 1) return { ok: false, reason: "atStart" };
  return { ok: true, walk: { ...w, path: w.path.slice(0, -1), backs: w.backs + 1 } };
}

export type Junction = { cell: Cell; options: Cell[]; steps: number; path: Cell[] };

/** 시작 칸에서 외길을 따라가다 처음 길이 둘 이상으로 갈라지는 칸. 갈림길이 없으면 null. */
export function firstJunction(grid: number[][], start: Cell): Junction | null {
  let w = startWalk(start);
  for (;;) {
    const options = unseenNeighbors(grid, w);
    if (options.length >= 2) return { cell: here(w), options, steps: w.moves, path: w.path };
    if (options.length === 0) return null;
    const next = moveTo(grid, w, options[0]);
    if (!next.ok) return null;
    w = next.walk;
  }
}

/**
 * 갈림길에서 `next` 길로 들어섰을 때 도착까지의 걸음 수(시작부터). 그 길로는 닿을 수 없으면 -1.
 * 갈림길까지 온 길의 칸은 다시 못 지난다.
 */
export function branchSteps(grid: number[][], start: Cell, goal: Cell, j: Junction, next: Cell): number {
  void start;
  const blocked = new Set(j.path.map(([r, c]) => cellKey(r, c)));
  const dist = new Map<number, number>([[cellKey(...next), 0]]);
  const q: Cell[] = [next];
  for (let i = 0; i < q.length; i++) {
    const [r, c] = q[i];
    if (r === goal[0] && c === goal[1]) return j.steps + 1 + dist.get(cellKey(r, c))!;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inside(grid, nr, nc) || grid[nr][nc] !== 0) continue;
      if (blocked.has(cellKey(nr, nc)) || dist.has(cellKey(nr, nc))) continue;
      dist.set(cellKey(nr, nc), dist.get(cellKey(r, c))! + 1);
      q.push([nr, nc]);
    }
  }
  return -1;
}

/**
 * 데모 격자의 첫 갈림길과 두 길의 결과. ① 예측("오른쪽 길로 끝까지 가면?")의 정답과 ② 되짚기의 숫자가 여기서 나온다.
 * 오른쪽 길은 위로 돌아서 도착하고(9걸음), 아래 길은 곧장 도착한다(7걸음).
 */
export function demoBranches() {
  const junction = firstJunction(DEMO_GRID, DEMO_START)!;
  const right = junction.options.find((o) => o[1] > junction.cell[1]) ?? junction.options[junction.options.length - 1];
  const other = junction.options.find((o) => o !== right)!;
  return {
    junction,
    right,
    other,
    rightSteps: branchSteps(DEMO_GRID, DEMO_START, DEMO_GOAL, junction, right),
    otherSteps: branchSteps(DEMO_GRID, DEMO_START, DEMO_GOAL, junction, other),
  };
}
