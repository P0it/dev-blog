import test from "node:test";
import assert from "node:assert/strict";
import {
  islandTape,
  ISLAND_CODE,
  ISLAND_GRID,
  ISLAND_ROWS,
  ISLAND_COLS,
  countIslands,
  islandSizes,
  neighbors,
  spreadOnce,
  diagonalLeft,
  firstSeenScanIndex,
} from "./connected-components.ts";
import { STEP_LIMIT } from "./tape.ts";
import fixture from "./fixtures/connected-components.json" with { type: "json" };

// fixture 는 scripts/algo/trace_connected_components.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행은 [줄, count, r, c, len(seen), len(q)] 이고 **그 줄을 실행한 뒤**의 값이다(아직 없는 변수는 null).
// 올리는 줄은 6·9(땅인 칸만)·10·11·12·14·19·20 이다. 바다 칸을 훑는 9번 줄과 안쪽 줄 몇 개는 건너뛴다.
test("ISLAND_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(ISLAND_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = islandTape(c.grid);
    const mine = t.steps.map((s) => [
      s.line,
      s.vars.count ?? null,
      s.vars.r ?? null,
      s.vars.c ?? null,
      s.vars["len(seen)"] ?? null,
      s.vars["len(q)"] ?? null,
    ]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("Python 이 낸 답과 countIslands 가 같다", () => {
  for (const c of fixture.cases) {
    assert.equal(countIslands(c.grid), c.answer, `케이스: ${c.name}`);
  }
});

test("① 과 ④ 가 같은 5×5 지도다 — 4방향으로 섬 3개, 대각선까지 이으면 2개", () => {
  assert.equal(ISLAND_ROWS, 5);
  assert.equal(ISLAND_COLS, 5);
  assert.equal(countIslands(ISLAND_GRID), 3);
  assert.equal(countIslands(ISLAND_GRID, true), 2);
  assert.deepEqual(islandSizes(ISLAND_GRID), [3, 3, 2]);
});

test("islandTape — 데모 지도는 스텝 상한 안에서 끝까지 돈다", () => {
  const t = islandTape(ISLAND_GRID);
  assert.equal(t.truncated, false);
  assert.ok(t.steps.length >= 25 && t.steps.length <= 45, `스텝 ${t.steps.length}`);
  assert.ok(t.steps.length < STEP_LIMIT);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.vars.count, 3);
});

test("islandTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const g of [ISLAND_GRID, [[0]], [[1]], [[1, 0, 1]]]) {
    for (const s of islandTape(g).steps) assert.ok(s.line >= 1 && s.line <= ISLAND_CODE.length, `line ${s.line}`);
  }
});

test("islandTape — 칠한 칸은 섬 번호를 가지고, 끝나면 땅이 전부 칠해져 있다", () => {
  const t = islandTape(ISLAND_GRID);
  const last = t.steps.at(-1)!.stage.island!;
  const landCells = last.land.map((l, i) => (l ? i : -1)).filter((i) => i >= 0);
  assert.equal(landCells.length, 8);
  for (const i of landCells) assert.ok(last.owner[i] !== null, `${i} 번 칸이 안 칠해졌다`);
  assert.deepEqual([...new Set(landCells.map((i) => last.owner[i]))].sort(), [0, 1, 2]);
});

test("islandTape — 이미 센 땅을 만나면 count 가 오르지 않는다", () => {
  const t = islandTape(ISLAND_GRID);
  const idx = firstSeenScanIndex(t);
  assert.ok(idx > 0, "이미 센 땅을 만나는 스텝이 있어야 한다");
  assert.equal(t.steps[idx].line, 9);
  assert.notEqual(t.steps[idx + 1].line, 10, "새 섬이면 바로 10번 줄이 온다 — 이미 센 땅은 아니다");
  assert.equal(t.steps[idx].vars.count, t.steps[idx - 1].vars.count);
  // ④ 플레이어의 예측 관문 자리: 섬 A 를 다 센 뒤 (0,1) 칸을 만나는 스텝
  assert.equal(t.steps[idx].vars.r, 0);
  assert.equal(t.steps[idx].vars.c, 1);
});

test("firstSeenScanIndex — 땅 한 칸뿐이면 이미 센 땅이 없다(-1)", () => {
  assert.equal(firstSeenScanIndex(islandTape([[1]])), -1);
});

test("neighbors — 4방향은 대각선을 넣지 않고, 가장자리는 격자 밖을 넣지 않는다", () => {
  // 5×5 의 0번 칸(0,0) 이웃: 오른쪽(1) 과 아래(5)
  assert.deepEqual([...neighbors(5, 5, 0)].sort((a, b) => a - b), [1, 5]);
  assert.deepEqual([...neighbors(5, 5, 0, true)].sort((a, b) => a - b), [1, 5, 6]);
  // 가운데 12번 칸(2,2)
  assert.equal(neighbors(5, 5, 12).length, 4);
  assert.equal(neighbors(5, 5, 12, true).length, 8);
});

test("spreadOnce — 한 걸음에 4방향 땅만 칠하고, 더 번질 곳이 없으면 frontier 가 빈다", () => {
  const land = ISLAND_GRID.flat().map((v) => v === 1);
  const owner: (number | null)[] = land.map(() => null);
  owner[0] = 0; // 씨앗 (0,0)
  const step1 = spreadOnce(land, ISLAND_COLS, owner, [0], 0);
  assert.deepEqual([...step1.frontier].sort((a, b) => a - b), [1, 5]);
  const step2 = spreadOnce(land, ISLAND_COLS, step1.owner, step1.frontier, 0);
  assert.deepEqual(step2.frontier, []);
  // 섬 하나가 정확히 3칸
  assert.equal(step2.owner.filter((o) => o === 0).length, 3);
});

test("diagonalLeft — 방금 끝난 섬과 대각선으로만 닿은 땅이 남아 있으면 true", () => {
  const land = ISLAND_GRID.flat().map((v) => v === 1);
  // 섬 B = (1,3)(2,2)(2,3) → 번호 8, 12, 13
  const owner: (number | null)[] = land.map(() => null);
  for (const i of [8, 12, 13]) owner[i] = 1;
  assert.equal(diagonalLeft(land, ISLAND_COLS, owner, [8, 12, 13]), true); // (3,1)=16 이 (2,2) 와 대각선
  // 섬 A 는 대각선으로 닿은 남은 땅이 없다
  const ownerA: (number | null)[] = land.map(() => null);
  for (const i of [0, 1, 5]) ownerA[i] = 0;
  assert.equal(diagonalLeft(land, ISLAND_COLS, ownerA, [0, 1, 5]), false);
});

test("countIslands — 빈 칸·꽉 찬 칸·한 줄·대각선뿐인 지도", () => {
  assert.equal(countIslands([[0, 0], [0, 0]]), 0);
  assert.equal(countIslands([[1, 1], [1, 1]]), 1);
  assert.equal(countIslands([[1, 0, 1, 1]]), 2);
  const diag = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  assert.equal(countIslands(diag), 3);
  assert.equal(countIslands(diag, true), 1);
});
