import test from "node:test";
import assert from "node:assert/strict";
import { bubbleSortTape, BUBBLE_SORT_CODE, countOps } from "./bubble-sort.ts";

test("bubbleSortTape — 마지막 스텝에서 모든 칸이 settled 다", () => {
  const t = bubbleSortTape([5, 3, 8, 1]);
  const last = t.steps.at(-1)!;
  assert.ok(last.stage.cells.every((c) => c === "settled"), "끝나면 전부 확정이어야 한다");
});

test("bubbleSortTape — 실제로 정렬된 순서가 된다", () => {
  const t = bubbleSortTape([5, 3, 8, 1, 9, 2]);
  assert.deepEqual(t.steps.at(-1)!.stage.values, [1, 2, 3, 5, 8, 9]);
});

test("bubbleSortTape — 모든 스텝의 line 이 코드 범위 안에 있다", () => {
  const t = bubbleSortTape([5, 3, 8, 1]);
  for (const s of t.steps) {
    assert.ok(s.line >= 1 && s.line <= t.code.length, `line ${s.line} 범위 밖`);
  }
});

test("bubbleSortTape — 길이 1 과 빈 배열에서도 테이프가 생긴다", () => {
  assert.ok(bubbleSortTape([7]).steps.length >= 1);
  assert.ok(bubbleSortTape([]).steps.length >= 1);
});

test("countOps — 이미 정렬돼 있으면 교환이 0 이다", () => {
  const ops = countOps([1, 2, 3, 4, 5]);
  assert.equal(ops.swaps, 0);
});

test("countOps — 역순이면 비교가 n(n-1)/2 이고 교환도 같다", () => {
  const n = 6;
  const ops = countOps([6, 5, 4, 3, 2, 1]);
  assert.equal(ops.compares, (n * (n - 1)) / 2);
  assert.equal(ops.swaps, (n * (n - 1)) / 2);
});

test("BUBBLE_SORT_CODE — 코드가 비어 있지 않다", () => {
  assert.ok(BUBBLE_SORT_CODE.length > 3);
});
