import test from "node:test";
import assert from "node:assert/strict";
import {
  dfsGridTape,
  DFS_CODE,
  dfsDist,
  noMarkPops,
  pauseStepIndex,
  startWalk,
  moveTo,
  backUp,
  isStuck,
  walkSteps,
  firstJunction,
  branchSteps,
  demoBranches,
  DEMO_GRID,
  DEMO_START,
  DEMO_GOAL,
} from "./dfs.ts";
import { shortestSteps, stackSteps } from "./bfs-grid.ts";
import fixture from "./fixtures/dfs.json" with { type: "json" };

// fixture 는 scripts/algo/trace_dfs.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행 모양: ["init", 스택] · ["pop", r, c, 스택, dist] · ["push", r, c, 스택] · ["found", dist] · ["none"]
// pop 은 꺼낸 **뒤**의 스택 길이, push 는 이웃을 다 넣은 **뒤**의 스택 길이다.

test("DFS_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(DFS_CODE, fixture.code);
});

test("Python 과 JS 가 같은 꺼냄·넣음 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = dfsGridTape(c.grid, c.start as [number, number], c.goal as [number, number]);
    const mine = t.steps.map((s) => {
      switch (s.line) {
        case 4:
          return ["init", s.vars.스택];
        case 6:
          return ["pop", s.vars.r, s.vars.c, s.vars.스택, s.vars.dist];
        case 15:
          return ["push", s.vars.r, s.vars.c, s.vars.스택];
        case 8:
          return ["found", s.vars.dist];
        case 16:
          return ["none"];
        default:
          throw new Error(`예상 밖 줄 ${s.line}`);
      }
    });
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("dfsDist — Python 이 돌려준 답과 같다", () => {
  for (const c of fixture.cases) {
    assert.equal(dfsDist(c.grid, c.start as [number, number], c.goal as [number, number]), c.answer, `케이스: ${c.name}`);
  }
});

test("데모 격자 — 스택은 9걸음이고 BFS 의 7걸음보다 멀다(bfs-grid ⑤ 와 같은 값)", () => {
  assert.equal(dfsDist(DEMO_GRID, DEMO_START, DEMO_GOAL), 9);
  assert.equal(dfsDist(DEMO_GRID, DEMO_START, DEMO_GOAL), stackSteps(DEMO_GRID, DEMO_START, DEMO_GOAL));
  assert.equal(shortestSteps(DEMO_GRID, DEMO_START, DEMO_GOAL), 7);
});

test("데모 격자 — 플레이어는 31스텝이고 마지막은 도착이다", () => {
  const t = dfsGridTape(DEMO_GRID, DEMO_START, DEMO_GOAL);
  assert.equal(t.steps.length, 31);
  assert.equal(t.truncated, false);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.vars.dist, 9);
});

test("데모 격자 — 막다른 길(3,0)까지 파고든 뒤에야 도착 칸을 꺼낸다", () => {
  const t = dfsGridTape(DEMO_GRID, DEMO_START, DEMO_GOAL);
  const pops = t.steps.filter((s) => s.line === 6).map((s) => [s.vars.r, s.vars.c]);
  assert.equal(pops.length, 15);
  assert.deepEqual(pops.at(-2), [3, 0]); // 막다른 길
  assert.deepEqual(pops.at(-1), [3, 4]); // 그제야 도착 칸
});

test("모든 스텝의 line 이 코드 범위 안이고 칸 수와 cells 길이가 같다", () => {
  for (const c of fixture.cases) {
    const t = dfsGridTape(c.grid, c.start as [number, number], c.goal as [number, number]);
    for (const s of t.steps) {
      assert.ok(s.line >= 1 && s.line <= DFS_CODE.length, `line ${s.line} 범위 밖`);
      assert.equal(s.stage.cells.length, c.grid.length * c.grid[0].length);
    }
  }
});

test("스택 레인은 스텝의 스택 길이와 같다", () => {
  const t = dfsGridTape(DEMO_GRID, DEMO_START, DEMO_GOAL);
  for (const s of t.steps) {
    if (s.line === 6 || s.line === 15 || s.line === 4) assert.equal(s.stage.queue!.length, s.vars.스택);
  }
});

test("pauseStepIndex — 갈림길에서 두 칸을 쌓은 다음 꺼내는 스텝이다", () => {
  const t = dfsGridTape(DEMO_GRID, DEMO_START, DEMO_GOAL);
  const at = pauseStepIndex(t);
  assert.equal(at, 7);
  assert.equal(t.steps[at].line, 6);
  assert.deepEqual([t.steps[at].vars.r, t.steps[at].vars.c], [1, 2]); // 마지막에 쌓은 오른쪽 칸이 먼저 나온다
});

// ── ① 미로 걷기 ──

test("걷기 — 시작 칸에서는 아래로만 갈 수 있다(오른쪽은 벽)", () => {
  const w = startWalk(DEMO_START);
  assert.equal(moveTo(DEMO_GRID, w, [0, 1]).ok, false);
  const down = moveTo(DEMO_GRID, w, [1, 0]);
  assert.ok(down.ok);
});

test("걷기 — 멀리 있는 칸·벽·이미 온 칸은 막히고 이유를 돌려준다", () => {
  let w = startWalk(DEMO_START);
  const far = moveTo(DEMO_GRID, w, [3, 4]);
  assert.deepEqual([far.ok, !far.ok && far.reason], [false, "far"]);
  const wall = moveTo(DEMO_GRID, w, [0, 1]);
  assert.deepEqual([wall.ok, !wall.ok && wall.reason], [false, "wall"]);
  const m = moveTo(DEMO_GRID, w, [1, 0]);
  assert.ok(m.ok);
  w = m.ok ? m.walk : w;
  const seen = moveTo(DEMO_GRID, w, [0, 0]);
  assert.deepEqual([seen.ok, !seen.ok && seen.reason], [false, "seen"]);
});

test("걷기 — 갈 길이 남았으면 되돌아가지 못하고, 막다른 길에서만 된다", () => {
  let w = startWalk(DEMO_START);
  const go = (to: [number, number]) => {
    const r = moveTo(DEMO_GRID, w, to);
    assert.ok(r.ok, `${to} 로 못 간다`);
    if (r.ok) w = r.walk;
  };
  go([1, 0]);
  const early = backUp(DEMO_GRID, w);
  assert.deepEqual([early.ok, !early.ok && early.reason], [false, "free"]);
  go([1, 1]);
  go([2, 1]);
  go([3, 1]);
  go([3, 0]); // 막다른 길
  assert.equal(isStuck(DEMO_GRID, w), true);
  const back = backUp(DEMO_GRID, w);
  assert.ok(back.ok);
  if (back.ok) w = back.walk;
  assert.deepEqual(w.path.at(-1), [3, 1]);
  assert.equal(w.backs, 1);
  assert.equal(isStuck(DEMO_GRID, w), false); // (3,1) 에는 오른쪽 칸이 남아 있다
});

test("걷기 — 아래 길로 곧장 가면 7걸음, 오른쪽 길로 가면 9걸음에 도착한다", () => {
  const run = (cells: [number, number][]) => {
    let w = startWalk(DEMO_START);
    for (const to of cells) {
      const r = moveTo(DEMO_GRID, w, to);
      assert.ok(r.ok, `${to} 로 못 간다`);
      if (r.ok) w = r.walk;
    }
    return w;
  };
  const down = run([[1, 0], [1, 1], [2, 1], [3, 1], [3, 2], [3, 3], [3, 4]]);
  assert.equal(walkSteps(down), 7);
  const right = run([[1, 0], [1, 1], [1, 2], [0, 2], [0, 3], [0, 4], [1, 4], [2, 4], [3, 4]]);
  assert.equal(walkSteps(right), 9);
  assert.equal(right.path.length - 1, 9);
});

test("걷기 — 시작 칸이 막혀 있으면 되돌아갈 곳이 없다고 알린다", () => {
  const blocked = [[0, 1], [1, 1]];
  const w = startWalk([0, 0]);
  assert.equal(isStuck(blocked, w), true);
  const back = backUp(blocked, w);
  assert.deepEqual([back.ok, !back.ok && back.reason], [false, "atStart"]);
});

test("firstJunction — 데모 격자의 첫 갈림길은 (1,1) 이고 두 길이 있다", () => {
  const j = firstJunction(DEMO_GRID, DEMO_START);
  assert.ok(j);
  assert.deepEqual(j!.cell, [1, 1]);
  assert.equal(j!.steps, 2);
  assert.deepEqual(j!.options, [[2, 1], [1, 2]]);
});

test("branchSteps — 아래 길은 7걸음, 오른쪽 길은 돌아서 9걸음이고 둘 다 도착한다", () => {
  const j = firstJunction(DEMO_GRID, DEMO_START)!;
  assert.equal(branchSteps(DEMO_GRID, DEMO_START, DEMO_GOAL, j, [2, 1]), 7);
  assert.equal(branchSteps(DEMO_GRID, DEMO_START, DEMO_GOAL, j, [1, 2]), 9);
});

test("branchSteps — 막다른 길이면 -1 이다", () => {
  const g = [
    [0, 0, 0],
    [0, 1, 1],
    [0, 0, 0],
  ];
  const j = firstJunction(g, [0, 0])!;
  assert.ok(j);
  // (0,0) 은 오른쪽 (0,1) 과 아래 (1,0) 두 길. 도착이 (2,2) 면 오른쪽 길은 막다른 길이다
  assert.equal(branchSteps(g, [0, 0], [2, 2], j, [0, 1]), -1);
  assert.equal(branchSteps(g, [0, 0], [2, 2], j, [1, 0]), 4);
});

// ── ⑥ 틀리는 자리 — Python 으로 확인한 값 ──

test("이웃 순서를 바꾸면 걸음 수가 달라진다(9 → 7)", () => {
  assert.equal(fixture.facts.order_default[0], 9);
  assert.equal(fixture.facts.order_reversed[0], 7);
  assert.equal(dfsDist(DEMO_GRID, DEMO_START, DEMO_GOAL, "reversed"), fixture.facts.order_reversed[0]);
});

test("방문 표시를 빼면 1000번을 꺼내도 도착하지 못한다", () => {
  assert.equal(fixture.facts.no_mark[0], null);
  const cap = fixture.facts.no_mark[1] as number;
  const r = noMarkPops(DEMO_GRID, DEMO_START, DEMO_GOAL, cap);
  assert.equal(r.reached, false);
  assert.equal(r.pops, cap);
});

test("재귀 DFS 는 벽 없는 32×32 에서 기본 한도(1000)에 걸린다", () => {
  assert.equal(fixture.facts.recursion["31"], "ok");
  assert.equal(fixture.facts.recursion["32"], "RecursionError");
});

test("아래 길의 (2,1) 칸을 막으면 길이 하나뿐이라 DFS 도 BFS 도 9걸음이다", () => {
  const walled = DEMO_GRID.map((row) => [...row]);
  walled[2][1] = 1;
  assert.equal(dfsDist(walled, DEMO_START, DEMO_GOAL), 9);
  assert.equal(shortestSteps(walled, DEMO_START, DEMO_GOAL), 9);
});

test("demoBranches — 오른쪽 길 9걸음, 아래 길 7걸음", () => {
  const b = demoBranches();
  assert.deepEqual(b.right, [1, 2]);
  assert.deepEqual(b.other, [2, 1]);
  assert.equal(b.rightSteps, 9);
  assert.equal(b.otherSteps, 7);
});

test("DFS_CODE — 코드가 비어 있지 않다", () => {
  assert.ok(DFS_CODE.length > 10);
});
