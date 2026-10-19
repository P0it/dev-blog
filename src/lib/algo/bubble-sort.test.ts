import test from "node:test";
import assert from "node:assert/strict";
import { bubbleSortTape, BUBBLE_SORT_CODE, countOps, countOpsNoShrink, sortLabels } from "./bubble-sort.ts";

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

// ── ① 해 보기와 ⑥ 틀리는 자리가 말하는 숫자 (실제 Python 으로도 확인한 값) ──

const HANDS = [5, 2, 9, 1, 7, 4];

test("해 보기 배열 — 옆칸 교환은 아무리 잘해도 8번(역전 수)이고 비교는 15번이다", () => {
  const ops = countOps(HANDS);
  assert.equal(ops.swaps, 8);
  assert.equal(ops.compares, 15);
  // 역전 수 = 앞이 뒤보다 큰 쌍의 수. 인접 교환 한 번은 역전 수를 정확히 1 줄인다
  let inv = 0;
  for (let i = 0; i < HANDS.length; i++) for (let j = i + 1; j < HANDS.length; j++) if (HANDS[i] > HANDS[j]) inv++;
  assert.equal(inv, 8);
});

test("countOpsNoShrink — range(n-1-i) 에서 -i 를 빼면 교환은 같고 비교만 25번으로 는다", () => {
  const ops = countOpsNoShrink(HANDS);
  assert.equal(ops.swaps, 8);
  assert.equal(ops.compares, 25);
});

test("countOps — 이미 정렬돼 있어도 비교는 n(n-1)/2 번 그대로다(조기 종료 없음)", () => {
  assert.equal(countOps([1, 2, 3, 4, 5, 6]).compares, 15);
});

test("sortLabels — > 는 같은 값의 원래 순서를 지키고 >= 는 뒤집는다", () => {
  const pairs: [number, string][] = [
    [2, "a"],
    [2, "b"],
    [1, "c"],
  ];
  assert.deepEqual(sortLabels(pairs, ">"), ["1c", "2a", "2b"]);
  assert.deepEqual(sortLabels(pairs, ">="), ["1c", "2b", "2a"]);
});
