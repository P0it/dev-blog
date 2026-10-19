import test from "node:test";
import assert from "node:assert/strict";
import {
  CLIMB_CODE,
  STAIRS,
  PREDICT_STAIR,
  climbTape,
  climbTable,
  climbWith,
  fillChoices,
  waysWithSteps,
  waysCount50,
} from "./dp-1d.ts";
import fixture from "./fixtures/dp-1d.json" with { type: "json" };

// fixture 는 scripts/algo/trace_dp_1d.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | number[] | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2]];
  });
}

test("CLIMB_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(CLIMB_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·i·표 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = climbTape(c.n);
    const mine = t.steps.map((s) => [s.line, s.vars.i ?? null, s.stage.values ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("climbTable — 6칸은 1 1 2 3 5 8 13 이고 앞 두 칸의 합이다", () => {
  assert.deepEqual(climbTable(STAIRS), [1, 1, 2, 3, 5, 8, 13]);
  const t = climbTable(10);
  for (let i = 2; i <= 10; i++) assert.equal(t[i], t[i - 1] + t[i - 2]);
});

test("climbTable — n=50 은 20,365,011,074 가지로 정수로 정확하다", () => {
  assert.equal(climbTable(50)[50], 20_365_011_074);
  assert.equal(waysCount50, 20_365_011_074);
  assert.ok(Number.isSafeInteger(waysCount50));
});

test("climbTable — n 이 1 보다 작으면 거절한다(파이썬도 n=0 이면 IndexError)", () => {
  assert.throws(() => climbTable(0), RangeError);
  assert.throws(() => climbTape(0), RangeError);
});

test("climbTape — 마지막 스텝이 done 이고 표가 완성돼 있다", () => {
  const t = climbTape(STAIRS);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.deepEqual(last.stage.values, climbTable(STAIRS));
  assert.equal(t.truncated, false);
});

test("climbTape — 6칸은 14스텝이라 연타로 끝나지 않는 짧은 길이다", () => {
  assert.equal(climbTape(STAIRS).steps.length, 14);
});

test("climbTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const n of [1, 2, 3, 6, 12]) {
    for (const s of climbTape(n).steps) assert.ok(s.line >= 1 && s.line <= CLIMB_CODE.length);
  }
});

test("climbTape — 5번 줄에서 새로 채운 칸은 current, 앞 두 칸은 compare 로 켜진다", () => {
  const t = climbTape(STAIRS);
  const step = t.steps.find((s) => s.line === 5 && s.vars.i === 4)!;
  assert.equal(step.stage.cells[4], "current");
  assert.equal(step.stage.cells[3], "compare");
  assert.equal(step.stage.cells[2], "compare");
  assert.equal(step.stage.cells[1], "settled");
  assert.equal(step.stage.cells[5], "out");
  assert.equal(step.stage.values![4], 5);
});

test("climbTape — 시작 스텝은 아직 한 칸도 채우지 않은 표다", () => {
  const first = climbTape(STAIRS).steps[0];
  assert.ok((first.stage.values ?? []).every((v) => v === 0));
});

test("fillChoices — 세 지선다에 정답이 정확히 하나이고 정답 값은 앞 두 칸의 합이다", () => {
  const table = climbTable(STAIRS);
  for (let i = 2; i <= STAIRS; i++) {
    const c = fillChoices(table, i);
    assert.equal(c.length, 3);
    assert.equal(c.filter((o) => o.correct).length, 1);
    assert.equal(c.find((o) => o.correct)!.value, table[i]);
    assert.equal(new Set(c.map((o) => o.value)).size, 3, `${i}번 칸 선택지가 겹친다`);
  }
});

test("fillChoices — 정답 위치가 칸마다 돌아 한 자리에만 몰리지 않는다", () => {
  const table = climbTable(STAIRS);
  const at = new Set<number>();
  for (let i = 2; i <= STAIRS; i++) at.add(fillChoices(table, i).findIndex((o) => o.correct));
  assert.equal(at.size, 3);
});

test("fillChoices — 오답은 앞 칸 하나만 쓴 값과 하나 더 센 값이다", () => {
  const table = climbTable(STAIRS);
  const c = fillChoices(table, 4);
  const values = c.map((o) => o.value).sort((a, b) => a - b);
  assert.deepEqual(values, [table[3], table[4], table[4] + 1]);
});

test("PREDICT_STAIR — 4번째 계단은 5가지다", () => {
  assert.equal(climbTable(STAIRS)[PREDICT_STAIR], 5);
});

test("waysWithSteps — 1·2칸이면 3번째 계단이 3가지, 1·2·3칸이면 4가지다", () => {
  assert.equal(waysWithSteps(3, [1, 2]), 3);
  assert.equal(waysWithSteps(3, [1, 2, 3]), 4);
  assert.equal(waysWithSteps(6, [1, 2]), 13);
});

test("waysWithSteps — 시작 자리를 0가지로 두면 틀린 값이 나온다(⑤ 오답, ⑥ 함정)", () => {
  assert.equal(waysWithSteps(3, [1, 2, 3], 0), 2);
});

test("climbWith — 초깃값을 둘 다 0 으로 두면 전부 0, dp[0] 만 0 이면 13 이 아니라 8", () => {
  assert.equal(climbWith(6, 0, 0), 0);
  assert.equal(climbWith(6, 0, 1), 8);
  assert.equal(climbWith(6, 1, 1), 13);
});
