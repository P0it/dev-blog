import test from "node:test";
import assert from "node:assert/strict";
import {
  quickSortTape,
  QUICK_SORT_CODE,
  QUICK_CARDS,
  QUICK_SORTED,
  countQuickOps,
  quickLabels,
  isSmallerThanPivot,
} from "./quick-sort.ts";
import { pairCount } from "./big-o.ts";
import fixture from "./fixtures/quick-sort.json" with { type: "json" };

// fixture 는 scripts/algo/trace_quick_sort.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행 = [줄, lo, hi, pivot, i, j, 배열]. 루트는 줄마다, 더 깊은 호출은 10번 줄만(그 줄을 실행한 뒤 상태).
// 루트의 11·12번 줄은 호출 직전 상태다. JS 테이프는 이 행들 뒤에 "전부 자리를 잡았습니다" 스텝 하나를 더 붙인다.

test("QUICK_SORT_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(QUICK_SORT_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·lo·hi·pivot·i·j·배열 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = quickSortTape(c.arr);
    const mine = t.steps
      .slice(0, -1) // 마지막 마무리 스텝은 Python 행이 없다
      .map((s) => [
        s.line,
        s.vars.lo ?? null,
        s.vars.hi ?? null,
        s.vars.pivot ?? null,
        s.vars.i ?? null,
        s.vars.j ?? null,
        s.stage.values,
      ]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("quickSortTape — 끝나면 모든 칸이 settled 이고 값이 정렬돼 있다", () => {
  for (const arr of [QUICK_CARDS, QUICK_SORTED, [7, 6, 5, 4, 3, 2, 1], [2, 2, 1], [4, 4, 4, 4]]) {
    const t = quickSortTape(arr);
    const last = t.steps.at(-1)!;
    assert.ok(last.stage.cells.every((c) => c === "settled"), `${arr} 끝에서 전부 확정이어야 한다`);
    assert.deepEqual(last.stage.values, [...arr].sort((a, b) => a - b));
    assert.equal(last.done, true);
  }
});

test("quickSortTape — 손으로 해 본 카드는 25스텝이고 상한 안에 끝난다", () => {
  const t = quickSortTape(QUICK_CARDS);
  assert.equal(t.steps.length, 25);
  assert.equal(t.truncated, false);
});

test("quickSortTape — 첫 분할이 끝나면(10번 줄) 기준 6 이 4번 칸에 확정되고 왼쪽엔 작은 카드 네 장이 있다", () => {
  const t = quickSortTape(QUICK_CARDS);
  const placed = t.steps.find((s) => s.line === 10)!;
  assert.deepEqual(placed.stage.values, [5, 3, 2, 1, 6, 8, 9]);
  assert.equal(placed.stage.cells[4], "settled");
  assert.equal(placed.vars.i, 4);
  // 왼쪽 네 장은 6 보다 작고 오른쪽 두 장은 6 보다 크다
  assert.ok(placed.stage.values!.slice(0, 4).every((v) => v < 6));
  assert.ok(placed.stage.values!.slice(5).every((v) => v > 6));
});

test("quickSortTape — 비교 줄(7번)은 기준(맨 앞 카드)과 j 번째 카드를 견주는 스텝이다", () => {
  const t = quickSortTape(QUICK_CARDS);
  const compares = t.steps.filter((s) => s.line === 7);
  assert.equal(compares.length, 6);
  for (const s of compares) {
    assert.equal(s.stage.cells[s.vars.j], "compare");
    assert.equal(s.stage.cells[0], "current");
  }
});

test("quickSortTape — 시작 스텝에는 확정된 칸이 없고 모든 스텝의 line 이 코드 범위 안이다", () => {
  const t = quickSortTape(QUICK_CARDS);
  assert.ok(t.steps[0].stage.cells.every((c) => c === "out"));
  for (const s of t.steps) assert.ok(s.line >= 1 && s.line <= QUICK_SORT_CODE.length, `line ${s.line} 범위 밖`);
});

test("quickSortTape — 빈 배열과 길이 1 도 끝까지 가서 done=true 로 끝난다", () => {
  for (const arr of [[], [7]]) {
    const t = quickSortTape(arr);
    assert.equal(t.steps.at(-1)!.done, true);
    assert.equal(t.steps.length, 3);
  }
});

test("isSmallerThanPivot — 같은 값은 작지 않다(코드의 < 와 같다)", () => {
  assert.equal(isSmallerThanPivot(3, 6), true);
  assert.equal(isSmallerThanPivot(6, 6), false);
  assert.equal(isSmallerThanPivot(8, 6), false);
});

test("countQuickOps — 손으로 해 본 카드는 첫 분할로 왼쪽 4장·오른쪽 2장, 비교는 13번이다", () => {
  const o = countQuickOps(QUICK_CARDS);
  assert.equal(o.firstLeft, 4);
  assert.equal(o.firstRight, 2);
  assert.equal(o.compares, 13);
  assert.equal(o.depth, 4);
});

test("countQuickOps — 이미 정렬된 카드는 왼쪽 0장·오른쪽 6장으로 쏠리고 비교가 n(n-1)/2 번이다", () => {
  const o = countQuickOps(QUICK_SORTED);
  assert.equal(o.firstLeft, 0);
  assert.equal(o.firstRight, 6);
  assert.equal(o.compares, pairCount(QUICK_SORTED.length));
  assert.equal(o.depth, 6);
});

test("countQuickOps — 거꾸로 선 카드도 쏠린다(왼쪽 6장·오른쪽 0장)", () => {
  const o = countQuickOps([7, 6, 5, 4, 3, 2, 1]);
  assert.equal(o.firstLeft, 6);
  assert.equal(o.firstRight, 0);
});

test("countQuickOps — 비교 횟수는 테이프의 7번 줄 스텝 수와 같다", () => {
  for (const arr of [QUICK_CARDS, QUICK_SORTED]) {
    // 테이프는 루트 분할만 줄마다 낸다. 루트 비교 = n - 1
    const t = quickSortTape(arr);
    assert.equal(t.steps.filter((s) => s.line === 7).length, arr.length - 1);
  }
});

test("quickLabels — 같은 값의 순서가 뒤집힌다(안정 정렬이 아니다)", () => {
  const got = quickLabels([
    [2, "a"],
    [1, "b"],
    [1, "c"],
  ]);
  assert.deepEqual(got, ["1c", "1b", "2a"]);
});

test("quickLabels — 이미 정렬돼 있고 같은 값이 없으면 그대로다", () => {
  assert.deepEqual(
    quickLabels([
      [1, "a"],
      [2, "b"],
      [3, "c"],
    ]),
    ["1a", "2b", "3c"],
  );
});
