import type { CellState, Step, StageState, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * 섬 세기 코드. 칸을 훑다가 안 센 땅을 만나면 count 를 올리고, 그 칸에서 이어진 땅을 큐로 번져 가며 전부 센 칸으로 표시한다.
 * 재귀 DFS 가 아니라 큐를 쓴다 — 큰 지도에서 재귀 깊이 한도에 걸리지 않는다.
 */
export const ISLAND_CODE = [
  "from collections import deque", // 1
  "", // 2
  "def count_islands(grid):", // 3
  "    rows, cols = len(grid), len(grid[0])", // 4
  "    seen = set()", // 5
  "    count = 0", // 6
  "    for r in range(rows):", // 7
  "        for c in range(cols):", // 8
  "            if grid[r][c] == 1 and (r, c) not in seen:", // 9
  "                count += 1", // 10
  "                seen.add((r, c))", // 11
  "                q = deque([(r, c)])", // 12
  "                while q:", // 13
  "                    cr, cc = q.popleft()", // 14
  "                    for dr, dc in ((-1,0),(1,0),(0,-1),(0,1)):", // 15
  "                        nr, nc = cr + dr, cc + dc", // 16
  "                        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1 and (nr, nc) not in seen:", // 17
  "                            seen.add((nr, nc))", // 18
  "                            q.append((nr, nc))", // 19
  "    return count", // 20
];

/**
 * ① 해 보기와 ④ 플레이어가 **같은 지도**를 쓴다. 1 = 땅, 0 = 바다.
 * 위·아래·왼쪽·오른쪽으로 이어진 땅이 섬이라 섬이 3개다(A 3칸, B 3칸, C 2칸).
 * C 의 (3,1) 은 B 의 (2,2) 와 **대각선으로만** 닿는다 — 대각선까지 이으면 B 와 C 가 한 덩어리가 되어 2개가 된다.
 */
export const ISLAND_GRID: number[][] = [
  [1, 1, 0, 0, 0],
  [1, 0, 0, 1, 0],
  [0, 0, 1, 1, 0],
  [0, 1, 0, 0, 0],
  [0, 1, 0, 0, 0],
];
export const ISLAND_ROWS = ISLAND_GRID.length;
export const ISLAND_COLS = ISLAND_GRID[0].length;

const DIRS4: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
const DIRS8: [number, number][] = [...DIRS4, [-1, -1], [-1, 1], [1, -1], [1, 1]];

/** 칸 번호(행 * cols + 열)의 이웃 칸 번호들. 격자 밖은 넣지 않는다. */
export function neighbors(rows: number, cols: number, idx: number, diagonal = false): number[] {
  const r = Math.floor(idx / cols);
  const c = idx % cols;
  const out: number[] = [];
  for (const [dr, dc] of diagonal ? DIRS8 : DIRS4) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
    out.push(nr * cols + nc);
  }
  return out;
}

/** 섬 개수. `diagonal` 이면 대각선까지 이어진 것으로 센다. */
export function countIslands(grid: number[][], diagonal = false): number {
  return islandSizes(grid, diagonal).length;
}

/** 섬마다 칸 수 — 칸을 훑는 순서대로 센 섬 순서다. */
export function islandSizes(grid: number[][], diagonal = false): number[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const seen = new Set<number>();
  const sizes: number[] = [];
  for (let i = 0; i < rows * cols; i++) {
    if (grid[Math.floor(i / cols)][i % cols] !== 1 || seen.has(i)) continue;
    let size = 1;
    seen.add(i);
    const q = [i];
    while (q.length) {
      const cur = q.shift()!;
      for (const n of neighbors(rows, cols, cur, diagonal)) {
        if (grid[Math.floor(n / cols)][n % cols] !== 1 || seen.has(n)) continue;
        seen.add(n);
        q.push(n);
        size++;
      }
    }
    sizes.push(size);
  }
  return sizes;
}

/**
 * ① 해 보기용 — 번지기 한 걸음. `frontier`(방금 칠한 칸)의 상하좌우 땅 중 아직 안 칠한 칸을 `k` 번 섬으로 칠한다.
 * 새로 칠한 칸들이 다음 frontier 가 되고, 더 번질 곳이 없으면 빈 배열이다.
 */
export function spreadOnce(
  land: boolean[],
  cols: number,
  owner: (number | null)[],
  frontier: number[],
  k: number,
): { owner: (number | null)[]; frontier: number[] } {
  const rows = land.length / cols;
  const next = [...owner];
  const added: number[] = [];
  for (const cur of frontier) {
    for (const n of neighbors(rows, cols, cur)) {
      if (!land[n] || next[n] !== null) continue;
      next[n] = k;
      added.push(n);
    }
  }
  return { owner: next, frontier: added };
}

/** 방금 끝난 섬과 **대각선으로만** 닿은, 아직 안 칠한 땅이 남아 있는가. 상하좌우로 닿았다면 이미 칠해졌을 것이다. */
export function diagonalLeft(land: boolean[], cols: number, owner: (number | null)[], islandCells: number[]): boolean {
  const rows = land.length / cols;
  return islandCells.some((cur) => neighbors(rows, cols, cur, true).some((n) => land[n] && owner[n] === null));
}

/** 바깥 반복문이 대각선·세 번째 이후에도 이미 센 땅을 훑는 첫 스텝 번호 — 예측 관문을 거기에 건다. */
export function firstSeenScanIndex(tape: Tape): number {
  return tape.steps.findIndex((s, i) => s.line === 9 && tape.steps[i + 1]?.line !== 10);
}

type Snap = {
  count: number | null;
  r: number | null;
  c: number | null;
  seen: number | null;
  q: number | null;
  cr: number | null;
  cc: number | null;
};

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. `len(seen)`·`len(q)` 는 그 크기다. */
function varsOf(s: Snap): Record<string, number> {
  const v: Record<string, number> = {};
  if (s.count !== null) v.count = s.count;
  if (s.r !== null) v.r = s.r;
  if (s.c !== null) v.c = s.c;
  if (s.seen !== null) v["len(seen)"] = s.seen;
  if (s.q !== null) v["len(q)"] = s.q;
  if (s.cr !== null) v.cr = s.cr;
  if (s.cc !== null) v.cc = s.cc;
  return v;
}

function stageOf(
  land: boolean[],
  cols: number,
  owner: (number | null)[],
  q: number[],
  scan?: number,
  now?: number,
): StageState {
  const cells: CellState[] = land.map((isLand, i) => {
    if (i === now) return "current";
    if (q.includes(i)) return "waiting";
    if (owner[i] !== null) return "settled";
    return isLand ? "dropped" : "out";
  });
  return { cells, flags: {}, island: { cols, land: [...land], owner: [...owner], queue: [...q], scan, now } };
}

function* walk(grid: number[][]): Generator<Step> {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const land = grid.flat().map((v) => v === 1);
  const owner: (number | null)[] = land.map(() => null);
  const seen = new Set<number>();
  const q: number[] = [];
  const snap: Snap = { count: null, r: null, c: null, seen: 0, q: null, cr: null, cc: null };

  snap.count = 0;
  yield {
    line: 6,
    vars: varsOf(snap),
    stage: stageOf(land, cols, owner, q),
    note: "섬 수를 0개로 시작합니다",
  };

  for (let r = 0; r < rows; r++) {
    snap.r = r;
    for (let c = 0; c < cols; c++) {
      snap.c = c;
      const idx = r * cols + c;
      // 바다 칸은 9번 줄이 실행되어도 스텝으로 올리지 않는다 — 땅인 칸만 올린다
      if (!land[idx]) continue;

      const fresh = !seen.has(idx);
      yield {
        line: 9,
        vars: varsOf(snap),
        stage: stageOf(land, cols, owner, snap.q === null ? [] : q, idx),
        note: fresh
          ? `(${r}, ${c}) 칸은 땅이고 아직 안 센 칸입니다`
          : `(${r}, ${c}) 칸은 땅이지만 이미 센 칸이라 건너뜁니다. count 는 그대로 ${snap.count}입니다`,
      };
      if (!fresh) continue;

      snap.count = (snap.count ?? 0) + 1;
      yield {
        line: 10,
        vars: varsOf(snap),
        stage: stageOf(land, cols, owner, q, idx),
        note: `새 섬입니다. 섬 수가 ${snap.count}개로 오릅니다`,
      };

      const k = snap.count - 1;
      seen.add(idx);
      owner[idx] = k;
      snap.seen = seen.size;
      yield {
        line: 11,
        vars: varsOf(snap),
        stage: stageOf(land, cols, owner, q, idx),
        note: `(${r}, ${c}) 칸에 센 칸이라는 표시를 합니다`,
      };

      q.length = 0;
      q.push(idx);
      snap.q = q.length;
      yield {
        line: 12,
        vars: varsOf(snap),
        stage: stageOf(land, cols, owner, q, idx),
        note: "이 칸에서 번지기를 시작합니다. 큐에 이 칸 하나를 넣습니다",
      };

      while (q.length) {
        const cur = q.shift()!;
        snap.q = q.length;
        const cr = Math.floor(cur / cols);
        const cc = cur % cols;
        snap.cr = cr;
        snap.cc = cc;
        yield {
          line: 14,
          vars: varsOf(snap),
          stage: stageOf(land, cols, owner, q, idx, cur),
          note: `큐 맨 앞 (${cr}, ${cc}) 칸을 꺼냅니다`,
        };

        for (const [dr, dc] of DIRS4) {
          const nr: number = cr + dr;
          const nc: number = cc + dc;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
          const ni = nr * cols + nc;
          if (!land[ni] || seen.has(ni)) continue;
          seen.add(ni);
          owner[ni] = k;
          q.push(ni);
          snap.seen = seen.size;
          snap.q = q.length;
          yield {
            line: 19,
            vars: varsOf(snap),
            stage: stageOf(land, cols, owner, q, idx, cur),
            note: `이웃 (${nr}, ${nc}) 칸은 안 센 땅이라 표시하고 큐에 넣습니다`,
          };
        }
      }
    }
  }

  yield {
    line: ISLAND_CODE.length,
    vars: varsOf(snap),
    stage: stageOf(land, cols, owner, []),
    note: snap.count === 0 ? "칸을 다 훑었습니다. 섬이 없습니다" : `칸을 다 훑었습니다. 섬은 모두 ${snap.count}개입니다`,
    done: true,
  };
}

export function islandTape(grid: number[][]): Tape {
  return buildTape(walk(grid), ISLAND_CODE);
}
