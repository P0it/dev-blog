import test from "node:test";
import assert from "node:assert/strict";
import { blocksAt } from "./pause-gate.ts";

test("blocksAt — 관문 바로 앞에서 다음을 누르면 막힌다", () => {
  assert.equal(blocksAt(8, 1, 9, false), true);
});

test("blocksAt — 이미 답했으면 막지 않는다", () => {
  assert.equal(blocksAt(8, 1, 9, true), false);
});

test("blocksAt — 관문이 없으면 막지 않는다", () => {
  assert.equal(blocksAt(8, 1, undefined, false), false);
});

test("blocksAt — 뒤로 가거나 관문 뒤에서는 막지 않는다", () => {
  assert.equal(blocksAt(8, -1, 9, false), false);
  assert.equal(blocksAt(9, 1, 9, false), false);
  assert.equal(blocksAt(10, 1, 9, false), false);
});

test("blocksAt — 관문 앞쪽 먼 곳에서 한 칸 가는 것은 막지 않는다", () => {
  assert.equal(blocksAt(3, 1, 9, false), false);
});
