import test from "node:test";
import assert from "node:assert/strict";
import { respond, worstCaseGuesses, type Range } from "./up-down.ts";

const FULL: Range = { lo: 1, hi: 100 };

test("respond — 작게 불렀으면 더 크다고 답하고 아래쪽을 잘라낸다", () => {
  const r = respond(42, 30, FULL);
  assert.equal(r.verdict, "higher");
  assert.deepEqual(r.range, { lo: 31, hi: 100 });
});

test("respond — 크게 불렀으면 더 작다고 답하고 위쪽을 잘라낸다", () => {
  const r = respond(42, 70, FULL);
  assert.equal(r.verdict, "lower");
  assert.deepEqual(r.range, { lo: 1, hi: 69 });
});

test("respond — 맞히면 범위가 그 수 하나로 좁혀진다", () => {
  const r = respond(42, 42, FULL);
  assert.equal(r.verdict, "hit");
  assert.deepEqual(r.range, { lo: 42, hi: 42 });
});

test("respond — 이미 좁혀진 범위를 되돌리지 않는다", () => {
  const narrowed: Range = { lo: 40, hi: 50 };
  assert.deepEqual(respond(42, 10, narrowed).range, { lo: 40, hi: 50 });
  assert.deepEqual(respond(42, 90, narrowed).range, { lo: 40, hi: 50 });
});

test("worstCaseGuesses — 100개는 일곱 번이면 하나만 남는다", () => {
  assert.equal(worstCaseGuesses(100), 7);
});

test("worstCaseGuesses — 경계", () => {
  assert.equal(worstCaseGuesses(1), 1);
  assert.equal(worstCaseGuesses(2), 2);
  assert.equal(worstCaseGuesses(127), 7); // 2^7 - 1
  assert.equal(worstCaseGuesses(128), 8);
  assert.equal(worstCaseGuesses(0), 0);
});
