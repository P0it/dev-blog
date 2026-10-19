import test from "node:test";
import assert from "node:assert/strict";
import { factorialTape, FACTORIAL_CODE } from "./recursion.ts";
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
