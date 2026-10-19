import test from "node:test";
import assert from "node:assert/strict";
import {
  bfsGridTape,
  BFS_GRID_CODE,
  shortestSteps,
  stackSteps,
  pushCounts,
  openGrid,
  guessOptions,
  DEMO_GRID,
  DEMO_START,
  DEMO_GOAL,
} from "./bfs-grid.ts";
import fixture from "./fixtures/bfs-grid.json" with { type: "json" };

// ── 같은 격자 · 스택 · 표시 시점 ──

test("DEMO_GRID — 큐는 7걸음, 스택은 돌아가서 9걸음이다", () => {
  assert.equal(shortestSteps(DEMO_GRID, DEMO_START, DEMO_GOAL), 7);
  assert.equal(stackSteps(DEMO_GRID, DEMO_START, DEMO_GOAL), 9);
});

test("stackSteps — 길이 하나뿐이면 스택도 최단이다", () => {
  // 오답 선택지 '7걸음 — 큐와 똑같다' 가 실제로 일어나는 입력
  const ONE_ROAD = [
    [0, 0, 0],
    [1, 1, 0],
    [0, 0, 0],
  ];
  assert.equal(stackSteps(ONE_ROAD, [0, 0], [2, 0]), shortestSteps(ONE_ROAD, [0, 0], [2, 0]));
});

test("pushCounts — 꺼낼 때 표시해도 거리는 같고 큐에 넣은 횟수만 늘어난다", () => {
  const g = openGrid(12, 12);
  const r = pushCounts(g, [0, 0], [11, 11]);
  assert.equal(r.earlyDist, 22);
  assert.equal(r.lateDist, 22);
  assert.ok(r.late > r.early, `넣은 횟수 ${r.early} → ${r.late}`);
});

test("pushCounts — 데모 격자에서도 거리는 7 로 같다", () => {
  const r = pushCounts(DEMO_GRID, DEMO_START, DEMO_GOAL);
  assert.equal(r.earlyDist, 7);
  assert.equal(r.lateDist, 7);
  assert.ok(r.late >= r.early);
});

test("guessOptions — 정답이 들어 있고 서로 다르며 정답 위치가 값에 따라 돈다", () => {
  const spots = new Set<number>();
  for (const best of [2, 3, 4, 5, 7, 9]) {
    const o = guessOptions(best);
    assert.equal(o.length, 3);
    assert.equal(new Set(o).size, 3, `중복: ${o}`);
    assert.ok(o.includes(best));
    assert.ok(o.every((v) => v >= 1));
    spots.add(o.indexOf(best));
  }
  assert.ok(spots.size >= 2, "정답이 늘 같은 자리면 위치로 찍는다");
  assert.ok(guessOptions(-1).includes(-1));
});

test("BFS_GRID_CODE — 범위 검사 줄이 코드에 있다(⑥ 설명과 맞는다)", () => {
  assert.ok(BFS_GRID_CODE.some((l) => l.includes("0 <= nr < rows")));
  assert.ok(BFS_GRID_CODE.at(-1)!.includes("return -1"));
});

// ── Python 대조 ──
// scripts/algo/trace_bfs_grid.py 가 화면에 보이는 코드 그대로를 exec 해서 답을 뽑는다.
test("Python 코드와 JS 코드 배열이 한 글자도 다르지 않다", () => {
  assert.deepEqual(BFS_GRID_CODE, fixture.code);
});

test("실제 Python 이 낸 답과 shortestSteps·테이프가 같다", () => {
  for (const c of fixture.cases) {
    const start = c.start as [number, number];
    const goal = c.goal as [number, number];
    assert.equal(shortestSteps(c.grid, start, goal), c.answer, `shortestSteps: ${c.name}`);
    const last = bfsGridTape(c.grid, start, goal).steps.at(-1)!;
    assert.equal(last.done === true ? last.vars.dist : -1, c.answer, `tape: ${c.name}`);
  }
});
