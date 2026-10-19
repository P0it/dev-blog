import test from "node:test";
import assert from "node:assert/strict";
import {
  boundTape,
  BOUND_LEFT_CODE,
  BOUND_RIGHT_CODE,
  BOUND_ARR,
  bisectLeft,
  bisectRight,
  gapAnswer,
  explainGap,
  type BoundVariant,
} from "./bisect-bounds.ts";
import fixture from "./fixtures/bisect-bounds.json" with { type: "json" };

// ── Python 대조 ──
// fixture 는 scripts/algo/trace_bisect_bounds.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, i) => {
    const after = i + 1 < trace.length ? trace[i + 1] : row;
    return [row[0], after[1], after[2], after[3]];
  });
}

test("Python 코드와 JS 코드 배열이 한 글자도 다르지 않다", () => {
  assert.deepEqual(BOUND_LEFT_CODE, fixture.leftCode);
  assert.deepEqual(BOUND_RIGHT_CODE, fixture.rightCode);
});

test("Python 과 JS 가 같은 줄·같은 변수 시퀀스를 낸다 (왼쪽·오른쪽 코드 모두)", () => {
  for (const c of fixture.cases) {
    const t = boundTape(c.arr, c.x, c.variant as BoundVariant);
    const mine = t.steps.map((s) => [s.line, s.vars.lo ?? null, s.vars.hi ?? null, s.vars.mid ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("마지막 스텝의 lo 가 파이썬이 돌려준 값이다", () => {
  for (const c of fixture.cases) {
    const t = boundTape(c.arr, c.x, c.variant as BoundVariant);
    assert.equal(t.steps.at(-1)!.vars.lo, c.result, `케이스: ${c.name}`);
  }
});

test("bisectLeft·bisectRight 가 파이썬 결과와 같다", () => {
  for (const c of fixture.cases) {
    const got = c.variant === "left" ? bisectLeft(c.arr, c.x) : bisectRight(c.arr, c.x);
    assert.equal(got, c.result, `케이스: ${c.name}`);
  }
});

test("같은 값 셋 — 왼쪽 틈 1, 오른쪽 틈 4, 개수는 4 − 1 = 3", () => {
  assert.equal(bisectLeft(BOUND_ARR, 2), 1);
  assert.equal(bisectRight(BOUND_ARR, 2), 4);
});

test("없는 값은 두 틈이 같은 자리다", () => {
  assert.equal(bisectLeft(BOUND_ARR, 4), 5);
  assert.equal(bisectRight(BOUND_ARR, 4), 5);
});

test("모든 스텝의 line 이 코드 범위 안이고, 6칸 입력은 25스텝 안이다", () => {
  for (const variant of ["left", "right"] as const) {
    for (const x of [0, 1, 2, 3, 4, 5, 6]) {
      const t = boundTape(BOUND_ARR, x, variant);
      for (const s of t.steps) assert.ok(s.line >= 1 && s.line <= t.code.length, `line ${s.line} 범위 밖`);
      assert.ok(t.steps.length <= 25, `${variant}/${x}: ${t.steps.length}스텝`);
      assert.equal(t.truncated, false);
    }
  }
});

test("빈 배열·길이 1 에서도 테이프가 생기고 lo 는 0 또는 1 이다", () => {
  assert.equal(boundTape([], 1, "left").steps.at(-1)!.vars.lo, 0);
  assert.equal(boundTape([5], 5, "left").steps.at(-1)!.vars.lo, 0);
  assert.equal(boundTape([5], 5, "right").steps.at(-1)!.vars.lo, 1);
});

test("오른쪽 코드는 왼쪽 코드에서 비교 한 줄만 다르다", () => {
  const diff = BOUND_LEFT_CODE.map((l, i) => (l === BOUND_RIGHT_CODE[i] ? null : i + 1)).filter((x) => x !== null);
  assert.deepEqual(diff, [1, 5]);
});

test("첫 스텝은 아무 칸도 버리지 않은 상태다(전부 out)", () => {
  const t = boundTape(BOUND_ARR, 2, "left");
  assert.ok(t.steps[0].stage.cells.every((c) => c === "out"));
});

// ── ① 틈 고르기 ──
test("gapAnswer — 2 의 덩어리는 1번 틈에서 시작해 4번 틈에서 끝난다", () => {
  assert.equal(gapAnswer(BOUND_ARR, 2, "left"), 1);
  assert.equal(gapAnswer(BOUND_ARR, 2, "right"), 4);
  assert.equal(gapAnswer(BOUND_ARR, 4, "left"), 5);
  assert.equal(gapAnswer(BOUND_ARR, 4, "right"), 5);
});

test("explainGap — 맞는 틈은 ok, 틀린 틈은 왜 틀렸는지 카드 값으로 말한다", () => {
  assert.equal(explainGap(BOUND_ARR, 2, "left", 1).ok, true);
  const early = explainGap(BOUND_ARR, 2, "left", 0);
  assert.equal(early.ok, false);
  assert.match(early.text, /1/); // 이 틈 오른쪽의 1 이 2 보다 작다
  const late = explainGap(BOUND_ARR, 2, "left", 3);
  assert.equal(late.ok, false);
  assert.match(late.text, /2/); // 이 틈 왼쪽에 2 이상인 카드가 있다
  const rEarly = explainGap(BOUND_ARR, 2, "right", 2);
  assert.equal(rEarly.ok, false);
  const rLate = explainGap(BOUND_ARR, 2, "right", 5);
  assert.equal(rLate.ok, false);
  assert.match(rLate.text, /3/); // 이 틈 왼쪽에 2 보다 큰 3 이 있다
});

test("explainGap — 틈 번호가 범위를 벗어나도 터지지 않는다", () => {
  assert.equal(explainGap(BOUND_ARR, 2, "left", 0).ok, false);
  assert.equal(explainGap(BOUND_ARR, 6, "left", 6).ok, true);
  assert.equal(explainGap(BOUND_ARR, 0, "right", 0).ok, true);
});
