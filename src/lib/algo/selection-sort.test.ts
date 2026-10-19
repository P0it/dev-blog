import test from "node:test";
import assert from "node:assert/strict";
import {
  selectionSortTape,
  SELECTION_SORT_CODE,
  SELECT_CARDS,
  countSelectionOps,
  selectionLabels,
  compareCountFrom,
  isSmaller,
} from "./selection-sort.ts";
import { countOps as bubbleOps } from "./bubble-sort.ts";
import fixture from "./fixtures/selection-sort.json" with { type: "json" };

// fixture 는 scripts/algo/trace_selection_sort.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행 = [줄, i, j, min_idx, 배열] — **그 줄을 실행한 뒤**의 상태다. 안쪽 반복 머리(5번)는 스텝이 아니라 뺐다.

test("SELECTION_SORT_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(SELECTION_SORT_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·i·j·min_idx·배열 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = selectionSortTape(c.arr);
    const mine = t.steps.map((s) => [
      s.line,
      s.vars.i ?? null,
      s.vars.j ?? null,
      s.vars.min_idx ?? null,
      s.stage.values,
    ]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("selectionSortTape — 끝나면 모든 칸이 settled 이고 값이 정렬돼 있다", () => {
  const t = selectionSortTape([5, 2, 9, 1, 7, 4]);
  const last = t.steps.at(-1)!;
  assert.ok(last.stage.cells.every((c) => c === "settled"));
  assert.deepEqual(last.stage.values, [1, 2, 4, 5, 7, 9]);
  assert.equal(last.done, true);
});

test("selectionSortTape — 손으로 해 본 카드는 37스텝이고 상한 안에 끝난다", () => {
  const t = selectionSortTape(SELECT_CARDS);
  assert.equal(t.steps.length, 37);
  assert.equal(t.truncated, false);
});

test("selectionSortTape — 시작 스텝에는 확정된 칸이 없고 모든 스텝의 line 이 코드 범위 안이다", () => {
  const t = selectionSortTape(SELECT_CARDS);
  assert.ok(t.steps[0].stage.cells.every((c) => c === "out"));
  for (const s of t.steps) assert.ok(s.line >= 1 && s.line <= SELECTION_SORT_CODE.length, `line ${s.line} 범위 밖`);
});

test("selectionSortTape — 첫 바퀴가 끝나면(8번 줄) 맨 앞에 가장 작은 카드 1 이 온다", () => {
  const t = selectionSortTape(SELECT_CARDS);
  const firstSwap = t.steps.find((s) => s.line === 8)!;
  assert.equal(firstSwap.stage.values![0], 1);
  assert.equal(firstSwap.stage.cells[0], "settled");
});

test("selectionSortTape — 후보가 바뀌는 줄(7번)은 더 작은 카드를 만났을 때만 나온다", () => {
  const t = selectionSortTape(SELECT_CARDS);
  const updates = t.steps.filter((s) => s.line === 7);
  assert.equal(updates.length, 4); // 첫 바퀴 2번, 셋째 바퀴 2번
  for (const s of updates) {
    // 후보가 j 로 옮겨 간 직후라 둘이 같은 칸이다
    assert.equal(s.vars.min_idx, s.vars.j);
  }
});

test("selectionSortTape — 빈 배열과 길이 1 도 끝까지 가서 done=true 로 끝난다", () => {
  for (const arr of [[], [7]]) {
    const t = selectionSortTape(arr);
    assert.equal(t.steps.at(-1)!.done, true);
    assert.equal(t.steps.length, 3);
  }
});

test("countSelectionOps — 손으로 해 본 카드는 비교 15번, 실제 교환 2번이다", () => {
  assert.deepEqual(countSelectionOps(SELECT_CARDS), { compares: 15, swaps: 2, codeSwaps: 5 });
});

test("countSelectionOps — 이미 정렬돼 있어도 비교는 15번 그대로, 교환은 0번이다", () => {
  assert.deepEqual(countSelectionOps([1, 2, 4, 5, 7, 9]), { compares: 15, swaps: 0, codeSwaps: 5 });
});

test("countSelectionOps — 거꾸로 선 6장은 3번만 바꾸고, 한 칸씩 돌려 놓은 줄은 최대인 5번 바꾼다", () => {
  assert.equal(countSelectionOps([6, 5, 4, 3, 2, 1]).swaps, 3);
  assert.equal(countSelectionOps([2, 3, 4, 5, 6, 1]).swaps, 5);
});

test("countSelectionOps — 교환은 많아야 n-1 번이고 비교는 항상 n(n-1)/2 번이다", () => {
  for (const arr of [[], [1], [3, 1, 2], [9, 8, 7, 6, 5], [4, 4, 4, 4]]) {
    const n = arr.length;
    const ops = countSelectionOps(arr);
    assert.equal(ops.compares, Math.max(0, (n * (n - 1)) / 2)); // n=0 에서 -0 이 나오지 않게
    assert.ok(ops.swaps <= Math.max(n - 1, 0));
  }
});

test("버블 정렬은 같은 카드를 8번 바꾸고 선택 정렬은 2번 바꾼다 — 비교는 둘 다 15번", () => {
  const bub = bubbleOps(SELECT_CARDS);
  const sel = countSelectionOps(SELECT_CARDS);
  assert.equal(bub.swaps, 8);
  assert.equal(sel.swaps, 2);
  assert.equal(bub.compares, 15);
  assert.equal(sel.compares, 15);
});

test("selectionLabels — 선택 정렬은 안정 정렬이 아니다: 2a 2b 1c → 1c 2b 2a", () => {
  const pairs: [number, string][] = [
    [2, "a"],
    [2, "b"],
    [1, "c"],
  ];
  assert.deepEqual(selectionLabels(pairs, "<"), ["1c", "2b", "2a"]);
});

test("selectionLabels — < 대신 <= 를 쓰면 이미 정렬된 1a 1b 2 에서도 같은 값끼리 자리가 뒤집힌다", () => {
  const pairs: [number, string][] = [
    [1, "a"],
    [1, "b"],
    [2, "c"],
  ];
  assert.deepEqual(selectionLabels(pairs, "<"), ["1a", "1b", "2c"]);
  assert.deepEqual(selectionLabels(pairs, "<="), ["1b", "1a", "2c"]);
});

test("compareCountFrom — range(i + 1, n) 은 15번, range(i, n) 은 자기 자신과도 견줘 20번이다", () => {
  assert.equal(compareCountFrom(6, 1), 15);
  assert.equal(compareCountFrom(6, 0), 20);
});

test("isSmaller — 후보보다 작은 카드만 true, 같은 값은 false 다", () => {
  assert.equal(isSmaller([5, 2, 9], 1, 0), true);
  assert.equal(isSmaller([5, 2, 9], 2, 0), false);
  assert.equal(isSmaller([4, 4], 1, 0), false);
});
