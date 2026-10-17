import test from "node:test";
import assert from "node:assert/strict";
import { bfsGridTape, BFS_GRID_CODE, shortestSteps } from "./bfs-grid.ts";

// 0 = 길, 1 = 벽
const OPEN = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
];
const BLOCKED = [
  [0, 1, 0],
  [0, 1, 0],
  [0, 1, 0],
];

test("shortestSteps — 돌아가는 길의 최단 거리를 센다", () => {
  assert.equal(shortestSteps(OPEN, [0, 0], [2, 2]), 4);
});

test("shortestSteps — 시작이 곧 도착이면 0", () => {
  assert.equal(shortestSteps(OPEN, [1, 1], [1, 1]), 0);
});

test("shortestSteps — 벽으로 막히면 -1", () => {
  assert.equal(shortestSteps(BLOCKED, [0, 0], [0, 2]), -1);
});

test("bfsGridTape — 도착하면 마지막 스텝이 done 이고 거리를 들고 있다", () => {
  const t = bfsGridTape(OPEN, [0, 0], [2, 2]);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.vars.dist, 4);
});

test("bfsGridTape — 못 가면 큐가 비고 done 이 false 다", () => {
  const t = bfsGridTape(BLOCKED, [0, 0], [0, 2]);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, false);
  assert.deepEqual(last.stage.queue, []);
});

test("bfsGridTape — 모든 스텝의 line 이 코드 범위 안에 있다", () => {
  const t = bfsGridTape(OPEN, [0, 0], [2, 2]);
  for (const s of t.steps) {
    assert.ok(s.line >= 1 && s.line <= t.code.length, `line ${s.line} 범위 밖`);
  }
});

test("bfsGridTape — 칸 수와 cells 길이가 같다", () => {
  const t = bfsGridTape(OPEN, [0, 0], [2, 2]);
  for (const s of t.steps) assert.equal(s.stage.cells.length, 9);
});

test("BFS_GRID_CODE — 코드가 비어 있지 않다", () => {
  assert.ok(BFS_GRID_CODE.length > 5);
});
