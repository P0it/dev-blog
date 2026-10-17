import test from "node:test";
import assert from "node:assert/strict";
import { clampStep } from "./clamp-step.ts";

test("clampStep — 시작 전(-1)보다 아래로 못 간다", () => {
  assert.equal(clampStep(-5, 10), -1);
  assert.equal(clampStep(-1, 10), -1);
});

test("clampStep — 마지막 스텝을 넘지 않는다", () => {
  assert.equal(clampStep(99, 10), 9);
  assert.equal(clampStep(9, 10), 9);
});

test("clampStep — 빈 테이프에서는 항상 시작 전이다", () => {
  assert.equal(clampStep(0, 0), -1);
  assert.equal(clampStep(5, 0), -1);
  assert.equal(clampStep(-3, 0), -1);
});

test("clampStep — 범위 안이면 그대로 둔다", () => {
  assert.equal(clampStep(4, 10), 4);
});
