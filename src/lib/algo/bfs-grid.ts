import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

export type Cell = [number, number];

export const BFS_GRID_CODE = [
  "from collections import deque", // 1
  "", // 2
  "def bfs(grid, start, goal):", // 3
  "    q = deque([start])", // 4
  "    dist = {start: 0}", // 5
  "    while q:", // 6
  "        r, c = q.popleft()", // 7
  "        if (r, c) == goal:", // 8
  "            return dist[(r, c)]", // 9
  "        for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):", // 10
  "            nr, nc = r + dr, c + dc", // 11
  "            if grid[nr][nc] == 0 and (nr, nc) not in dist:", // 12
  "                dist[(nr, nc)] = dist[(r, c)] + 1", // 13
  "                q.append((nr, nc))", // 14
  "    return -1", // 15
];

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
    line: 4,
    vars: { 큐: q.length },
    stage: stage(grid, dist, q, null, goal, false),
    note: "시작 칸 하나를 큐에 넣습니다",
  };

  while (q.length) {
    const now = q.shift()!;
    const [r, c] = now;
    const d = dist.get(key(r, c))!;

    yield {
      line: 7,
      vars: { r, c, dist: d, 큐: q.length },
      stage: stage(grid, dist, q, now, goal, false),
      note: `큐 맨 앞을 꺼냅니다. ${d}걸음 떨어진 칸입니다`,
    };

    if (r === goal[0] && c === goal[1]) {
      yield {
        line: 9,
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
      line: 14,
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

export function bfsGridTape(grid: number[][], start: Cell, goal: Cell): Tape {
  return buildTape(walk(grid, start, goal), BFS_GRID_CODE);
}
