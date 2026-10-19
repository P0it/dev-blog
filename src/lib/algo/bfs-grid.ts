import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

export type Cell = [number, number];

export const BFS_GRID_CODE = [
  "from collections import deque", // 1
  "", // 2
  "def bfs(grid, start, goal):", // 3
  "    rows, cols = len(grid), len(grid[0])", // 4
  "    q = deque([start])", // 5
  "    dist = {start: 0}", // 6
  "    while q:", // 7
  "        r, c = q.popleft()", // 8
  "        if (r, c) == goal:", // 9
  "            return dist[(r, c)]", // 10
  "        for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):", // 11
  "            nr, nc = r + dr, c + dc", // 12
  "            if not (0 <= nr < rows and 0 <= nc < cols):", // 13
  "                continue", // 14
  "            if grid[nr][nc] == 0 and (nr, nc) not in dist:", // 15
  "                dist[(nr, nc)] = dist[(r, c)] + 1", // 16
  "                q.append((nr, nc))", // 17
  "    return -1", // 18
];

/**
 * ① 해 보기와 ④ 플레이어가 **같은 격자**를 쓴다. 0 = 길, 1 = 벽.
 * 길이 둘이라 큐는 7걸음, 스택은 9걸음으로 돌아간다 — ⑤ 확인 문제의 재료다.
 */
export const DEMO_GRID: number[][] = [
  [0, 1, 0, 0, 0],
  [0, 0, 0, 1, 0],
  [1, 0, 1, 0, 0],
  [0, 0, 0, 0, 0],
];
export const DEMO_START: Cell = [0, 0];
export const DEMO_GOAL: Cell = [3, 4];

const DIRS: Cell[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

const key = (r: number, c: number) => r * 1000 + c;

/** 큐가 번지는 걸 그대로 센다. 테이프와 같은 순서로 돈다. */
export function shortestSteps(grid: number[][], start: Cell, goal: Cell): number {
  const dist = new Map<number, number>([[key(...start), 0]]);
  const q: Cell[] = [start];
  while (q.length) {
    const [r, c] = q.shift()!;
    if (r === goal[0] && c === goal[1]) return dist.get(key(r, c))!;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= grid.length || nc >= grid[0].length) continue;
      if (grid[nr][nc] !== 0 || dist.has(key(nr, nc))) continue;
      dist.set(key(nr, nc), dist.get(key(r, c))! + 1);
      q.push([nr, nc]);
    }
  }
  return -1;
}

function stage(
  grid: number[][],
  dist: Map<number, number>,
  q: Cell[],
  now: Cell | null,
  goal: Cell,
  found: boolean,
) {
  const inQueue = new Set(q.map(([r, c]) => key(r, c)));
  const cells: CellState[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === 1) cells.push("dropped"); // 벽
      else if (found && r === goal[0] && c === goal[1]) cells.push("settled");
      else if (now && r === now[0] && c === now[1]) cells.push("current");
      else if (inQueue.has(key(r, c))) cells.push("waiting");
      else if (dist.has(key(r, c))) cells.push("compare"); // 이미 다녀간 칸
      else cells.push("out");
    }
  }
  return {
    cells,
    flags: {} as Record<string, number>,
    queue: q.map(([r, c]) => dist.get(key(r, c)) ?? 0),
  };
}

function* walk(grid: number[][], start: Cell, goal: Cell): Generator<Step> {
  const dist = new Map<number, number>([[key(...start), 0]]);
  const q: Cell[] = [start];

  yield {
    line: 5,
    vars: { 큐: q.length },
    stage: stage(grid, dist, q, null, goal, false),
    note: "시작 칸 하나를 큐에 넣습니다",
  };

  while (q.length) {
    const now = q.shift()!;
    const [r, c] = now;
    const d = dist.get(key(r, c))!;

    yield {
      line: 8,
      vars: { r, c, dist: d, 큐: q.length },
      stage: stage(grid, dist, q, now, goal, false),
      note: `큐 맨 앞을 꺼냅니다. ${d}걸음 떨어진 칸입니다`,
    };

    if (r === goal[0] && c === goal[1]) {
      yield {
        line: 10,
        vars: { r, c, dist: d, 큐: q.length },
        stage: stage(grid, dist, q, now, goal, true),
        note: `도착했습니다. ${d}걸음입니다`,
        done: true,
      };
      return;
    }

    let added = 0;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= grid.length || nc >= grid[0].length) continue;
      if (grid[nr][nc] !== 0 || dist.has(key(nr, nc))) continue;
      dist.set(key(nr, nc), d + 1);
      q.push([nr, nc]);
      added++;
    }

    yield {
      line: 17,
      vars: { r, c, dist: d, 큐: q.length },
      stage: stage(grid, dist, q, now, goal, false),
      note:
        added === 0
          ? "갈 수 있는 이웃이 없습니다"
          : `이웃 ${added}칸을 큐 뒤에 붙입니다. 전부 ${d + 1}걸음입니다`,
    };
  }

  yield {
    line: BFS_GRID_CODE.length,
    vars: { 큐: 0 },
    stage: stage(grid, dist, q, null, goal, false),
    note: "큐가 비었습니다. 갈 수 있는 길이 없습니다",
    done: false,
  };
}

/**
 * 큐 대신 스택(맨 뒤에서 꺼냄)을 쓴 코드. 도착에 처음 닿았을 때의 걸음 수를 돌려준다.
 * 넣을 때 표시하는 건 BFS 와 같다 — 꺼내는 쪽만 다르다.
 */
export function stackSteps(grid: number[][], start: Cell, goal: Cell): number {
  const dist = new Map<number, number>([[key(...start), 0]]);
  const st: Cell[] = [start];
  while (st.length) {
    const [r, c] = st.pop()!;
    if (r === goal[0] && c === goal[1]) return dist.get(key(r, c))!;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= grid.length || nc >= grid[0].length) continue;
      if (grid[nr][nc] !== 0 || dist.has(key(nr, nc))) continue;
      dist.set(key(nr, nc), dist.get(key(r, c))! + 1);
      st.push([nr, nc]);
    }
  }
  return -1;
}

/**
 * 큐에 넣은 횟수를 센다 — 도착 칸을 꺼낼 때까지.
 * `early` 는 넣을 때 표시(BFS 코드), `late` 는 꺼낼 때 표시. 거리는 둘 다 같다.
 */
export function pushCounts(
  grid: number[][],
  start: Cell,
  goal: Cell,
): { early: number; late: number; earlyDist: number; lateDist: number } {
  const inside = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < grid.length && c < grid[0].length && grid[r][c] === 0;

  // 넣을 때 표시
  let early = 1;
  let earlyDist = -1;
  {
    const dist = new Map<number, number>([[key(...start), 0]]);
    const q: Cell[] = [start];
    while (q.length) {
      const [r, c] = q.shift()!;
      if (r === goal[0] && c === goal[1]) {
        earlyDist = dist.get(key(r, c))!;
        break;
      }
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inside(nr, nc) || dist.has(key(nr, nc))) continue;
        dist.set(key(nr, nc), dist.get(key(r, c))! + 1);
        q.push([nr, nc]);
        early++;
      }
    }
  }

  // 꺼낼 때 표시: 아직 꺼내지 않은 칸이면 몇 번이든 넣는다. 걸음 수는 큐에 같이 싣는다.
  let late = 1;
  let lateDist = -1;
  {
    const seen = new Set<number>();
    const q: [Cell, number][] = [[start, 0]];
    while (q.length) {
      const [[r, c], d] = q.shift()!;
      if (seen.has(key(r, c))) continue;
      seen.add(key(r, c));
      if (r === goal[0] && c === goal[1]) {
        lateDist = d;
        break;
      }
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inside(nr, nc) || seen.has(key(nr, nc))) continue;
        q.push([[nr, nc], d + 1]);
        late++;
      }
    }
  }
  return { early, late, earlyDist, lateDist };
}

/** 벽 없는 격자. */
export function openGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

/**
 * ① 예측 선택지. 정답 하나와 틀린 값 둘을 세 칸에 섞는다.
 * 정답 위치가 늘 같으면 위치로 찍는다 — 정답 값에 따라 돌려 놓는다. -1 은 '닿을 수 없다'.
 */
export function guessOptions(best: number): number[] {
  const pool = best < 0 ? [-1, 6, 9] : [best, best + 2, best - 2 >= 1 ? best - 2 : best + 4];
  const shift = Math.abs(best) % 3;
  return pool.map((_, i) => pool[(i + shift) % 3]);
}

export function bfsGridTape(grid: number[][], start: Cell, goal: Cell): Tape {
  return buildTape(walk(grid, start, goal), BFS_GRID_CODE);
}
