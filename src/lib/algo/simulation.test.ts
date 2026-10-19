import test from "node:test";
import assert from "node:assert/strict";
import {
  robotTape,
  ROBOT_CODE,
  ROOM,
  START,
  COMMANDS,
  DR,
  DC,
  stepCommand,
  posesOf,
  finalCell,
  unblockedCell,
  distance,
  blockOf,
  firstBlockedIndex,
  endOfVariant,
} from "./simulation.ts";
import { STEP_LIMIT } from "./tape.ts";
import fixture from "./fixtures/simulation.json" with { type: "json" };

// fixture 는 scripts/algo/trace_simulation.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행은 [줄, r, c, d, nr, nc, cmd] 이고 **그 줄을 실행한 뒤**의 값이다(아직 없는 변수는 null).
// 올리는 줄은 5·6·8·9·10·12·14·15 이고, 6번 줄은 명령을 읽을 때마다 그리고 명령이 떨어졌을 때 한 번 더 켜진다.
test("ROBOT_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(ROBOT_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = robotTape(c.commands, c.grid, c.r, c.c);
    const mine = t.steps.map((s) => [
      s.line,
      s.vars.r ?? null,
      s.vars.c ?? null,
      s.vars.d ?? null,
      s.vars.nr ?? null,
      s.vars.nc ?? null,
      s.stage.robot!.cmd,
    ]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("Python 이 낸 답과 finalCell 이 같다", () => {
  for (const c of fixture.cases) {
    const cell = finalCell(c.grid, { r: c.r, c: c.c }, c.commands);
    assert.deepEqual([cell.r, cell.c], c.answer, `케이스: ${c.name}`);
  }
});

test("① 과 ④ 가 같은 방·같은 명령이다 — 끝 칸 (0,1), 처음 칸에서 4칸, 막히지 않았다면 6칸", () => {
  assert.equal(ROOM.length, 5);
  assert.equal(ROOM[0].length, 5);
  assert.deepEqual(START, { r: 3, c: 0 });
  assert.equal(COMMANDS, "FFRFFLFF");
  const end = finalCell(ROOM, START, COMMANDS);
  assert.deepEqual(end, { r: 0, c: 1 });
  assert.equal(distance(START, end), 4);
  const free = unblockedCell(START, COMMANDS);
  assert.deepEqual(free, { r: -1, c: 2 });
  assert.equal(distance(START, free), 6);
});

test("robotTape — 데모 방은 스텝 상한 안에서 끝까지 돈다", () => {
  const t = robotTape(COMMANDS, ROOM, START.r, START.c);
  assert.equal(t.truncated, false);
  assert.ok(t.steps.length >= 25 && t.steps.length <= 45, `스텝 ${t.steps.length}`);
  assert.ok(t.steps.length < STEP_LIMIT);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.vars.r, 0);
  assert.equal(last.vars.c, 1);
});

test("robotTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const [cmds, room] of [
    [COMMANDS, ROOM],
    ["", ROOM],
    ["FRFLF", [[0]]],
  ] as [string, number[][]][]) {
    for (const s of robotTape(cmds, room, 0, 0).steps) assert.ok(s.line >= 1 && s.line <= ROBOT_CODE.length, `line ${s.line}`);
  }
});

test("robotTape — 데모 방에서 막히는 F 는 두 번이다: 벽 한 번, 방 바깥 한 번", () => {
  const t = robotTape(COMMANDS, ROOM, START.r, START.c);
  const blocked = t.steps.filter((s) => s.line === 9 && s.stage.robot!.block);
  assert.deepEqual(
    blocked.map((s) => s.stage.robot!.block),
    ["wall", "edge"],
  );
  // 막힌 F 는 10번 줄(이동)로 이어지지 않고 다음 명령 읽기(6번 줄)로 간다
  const i = firstBlockedIndex(t);
  assert.ok(i > 0);
  assert.equal(t.steps[i].line, 9);
  assert.equal(t.steps[i + 1].line, 6);
  assert.deepEqual([t.steps[i].vars.r, t.steps[i].vars.c], [1, 1]);
  assert.deepEqual([t.steps[i].vars.nr, t.steps[i].vars.nc], [1, 2]);
});

test("stepCommand — R 은 +1, L 은 -1 이고 0 번 방향에서 L 은 3 번이 된다", () => {
  const p = { r: 2, c: 2, d: 0 };
  assert.equal(stepCommand(ROOM, p, "R").pose.d, 1);
  assert.equal(stepCommand(ROOM, p, "L").pose.d, 3);
  assert.equal(stepCommand(ROOM, { ...p, d: 3 }, "R").pose.d, 0);
  // 파이썬은 (0 - 1) % 4 가 3 이지만 JS 는 -1 이다. JS 구현은 + 3 으로 같은 값을 낸다
  assert.equal(((0 - 1) % 4 + 4) % 4, 3);
  assert.equal((0 - 1) % 4, -1);
});

test("stepCommand — 앞이 벽이거나 바깥이면 제자리, 이유를 말한다", () => {
  const wallAhead = stepCommand(ROOM, { r: 1, c: 1, d: 1 }, "F");
  assert.deepEqual(wallAhead.pose, { r: 1, c: 1, d: 1 });
  assert.equal(wallAhead.block, "wall");
  const edgeAhead = stepCommand(ROOM, { r: 0, c: 1, d: 0 }, "F");
  assert.deepEqual(edgeAhead.pose, { r: 0, c: 1, d: 0 });
  assert.equal(edgeAhead.block, "edge");
  const open = stepCommand(ROOM, { r: 3, c: 0, d: 0 }, "F");
  assert.deepEqual(open.pose, { r: 2, c: 0, d: 0 });
  assert.equal(open.block, null);
});

test("blockOf — 바깥은 edge, 벽은 wall, 빈 칸은 null", () => {
  assert.equal(blockOf(ROOM, -1, 0), "edge");
  assert.equal(blockOf(ROOM, 0, 5), "edge");
  assert.equal(blockOf(ROOM, 1, 2), "wall");
  assert.equal(blockOf(ROOM, 0, 0), null);
});

test("방향 4 개는 시계 방향이고, 위로 가면 행이 줄어든다", () => {
  assert.deepEqual(DR, [-1, 0, 1, 0]);
  assert.deepEqual(DC, [0, 1, 0, -1]);
  // 네 번 오른쪽으로 돌면 처음 방향이다
  const p = posesOf(ROOM, { r: 2, c: 2 }, "RRRR").at(-1)!;
  assert.equal(p.d, 0);
});

test("① 확인 문제 — L 을 R 로 바꾼 명령은 (2,1) 칸에서 끝난다", () => {
  assert.deepEqual(finalCell(ROOM, START, "FFRFFRFF"), { r: 2, c: 1 });
  // 벽이 없는 방이었다면 두 번 다 막히지 않고 (3,2) 까지 간다
  const open = ROOM.map((row) => row.map(() => 0));
  assert.deepEqual(finalCell(open, START, "FFRFFRFF"), { r: 3, c: 2 });
});

test("robotTape — 명령이 없거나 돌기만 해도 테이프가 생긴다", () => {
  assert.ok(robotTape("", ROOM, 3, 0).steps.length >= 3);
  const t = robotTape("RRLR", ROOM, 2, 2);
  assert.deepEqual([t.steps.at(-1)!.vars.r, t.steps.at(-1)!.vars.c], [2, 2]);
});

test("robotTape — 지나온 칸이 trail 에 순서대로 쌓인다", () => {
  const t = robotTape(COMMANDS, ROOM, START.r, START.c);
  const last = t.steps.at(-1)!.stage.robot!;
  // (3,0) → (2,0) → (1,0) → (1,1) → (0,1)
  assert.deepEqual(last.trail, [15, 10, 5, 6, 1]);
});

// ⑥ 틀리는 자리에 적은 값 — 같은 변형을 실제 파이썬으로 돌린 값과 같다(scripts 로 확인: 경계 검사 없음 → (-1, 1),
// 오른쪽 바깥 → IndexError, 방향 순서 바꿈 → (0, 0)).
test("endOfVariant — 경계 검사를 빼면 에러 없이 (-1, 1) 에 서고, 오른쪽·아래 바깥은 IndexError 다", () => {
  assert.deepEqual(endOfVariant(ROOM, START, COMMANDS, { edgeCheck: false }), { r: -1, c: 1 });
  assert.equal(endOfVariant(ROOM, { r: 4, c: 4 }, "RF", { edgeCheck: false }), "IndexError");
  // 검사를 두면 정답과 같다
  assert.deepEqual(endOfVariant(ROOM, START, COMMANDS), finalCell(ROOM, START, COMMANDS));
});

test("endOfVariant — 방향 순서에서 왼쪽·오른쪽 자리를 바꾸면 같은 명령이 (0, 0) 에서 끝난다", () => {
  assert.deepEqual(endOfVariant(ROOM, START, COMMANDS, { dc: [0, -1, 0, 1] }), { r: 0, c: 0 });
});
