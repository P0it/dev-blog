import test from "node:test";
import assert from "node:assert/strict";
import { factorialTape, FACTORIAL_CODE, firstReturnGate, fibTree, countCalls, countOf } from "./recursion.ts";
import fixture from "./fixtures/recursion.json" with { type: "json" };

// fixture 는 scripts/algo/trace_recursion.py 가 실제 Python 을 settrace 로 돌려 만든다.
// line 이벤트는 줄을 실행하기 전에, return 이벤트는 값을 돌려주는 순간에 찍힌다.

test("FACTORIAL_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(FACTORIAL_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·n·돌려주는 값 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = factorialTape(c.n);
    const mine = t.steps.map((s) => [s.line, s.vars.n, s.vars.ret ?? null]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("호출 탑 — 가장 높을 때 n 층이고, 끝에서는 층이 하나 남는다", () => {
  const t = factorialTape(4);
  const heights = t.steps.map((s) => s.stage.frames!.length);
  assert.equal(Math.max(...heights), 4);
  assert.equal(heights.at(-1), 1);
});

test("호출 탑 — 맨 위 층의 n 이 4 → 1 로 내려갔다가 1 → 4 로 되돌아온다", () => {
  const t = factorialTape(4);
  const tops = t.steps.map((s) => s.stage.frames!.at(-1)!.n);
  const down = tops.indexOf(1);
  assert.deepEqual([...new Set(tops.slice(0, down + 1))], [4, 3, 2, 1]);
  assert.deepEqual([...new Set(tops.slice(down))], [1, 2, 3, 4]);
});

test("돌려주는 값 — 마지막 스텝이 n! 이고 done 이다", () => {
  const last = factorialTape(4).steps.at(-1)!;
  assert.equal(last.vars.ret, 24);
  assert.equal(last.done, true);
  assert.equal(factorialTape(5).steps.at(-1)!.vars.ret, 120);
});

test("n = 1 — 호출이 한 번이고 바로 1 을 돌려준다", () => {
  const t = factorialTape(1);
  assert.equal(t.steps.length, 3);
  assert.equal(t.steps.at(-1)!.vars.ret, 1);
});

test("모든 스텝의 line 이 코드 범위 안에 있다", () => {
  for (const s of factorialTape(4).steps) {
    assert.ok(s.line >= 1 && s.line <= FACTORIAL_CODE.length, `line ${s.line} 범위 밖`);
  }
});

test("n 이 1 보다 작으면 거절한다 — 진짜 코드는 멈추지 않는다", () => {
  assert.throws(() => factorialTape(0), RangeError);
});

test("파이썬 기본 재귀 한도 — 페이지에 적은 숫자가 실제 값이다", () => {
  assert.equal(fixture.recursionLimit, 1000);
});

test("firstReturnGate — 관문 스텝은 바깥 층이 처음으로 곱하는 순간이다", () => {
  const t = factorialTape(4);
  const g = firstReturnGate(t);
  assert.equal(g, 9);
  // 관문 바로 앞 스텝은 가장 안쪽 층(n=1)이 1 을 돌려준 순간
  assert.equal(t.steps[g - 1].vars.n, 1);
  assert.equal(t.steps[g - 1].vars.ret, 1);
  // 관문 스텝은 factorial(2) = 2 × 1 = 2
  assert.equal(t.steps[g].vars.n, 2);
  assert.equal(t.steps[g].vars.ret, 2);
});

test("fibTree(4) — 호출이 9번이고 fib(2) 를 두 번 되풀이한다", () => {
  const t = fibTree(4);
  assert.equal(countCalls(t), 9);
  assert.equal(countOf(t, 2), 2);
  assert.equal(countOf(t, 1), 3);
  assert.equal(countOf(t, 0), 2);
});

test("fibTree — 0 과 1 은 더 부르지 않고, 음수는 거절한다", () => {
  assert.deepEqual(fibTree(0), { n: 0, kids: [] });
  assert.equal(countCalls(fibTree(1)), 1);
  assert.throws(() => fibTree(-1), RangeError);
});
