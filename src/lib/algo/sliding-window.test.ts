import test from "node:test";
import assert from "node:assert/strict";
import {
  windowTape,
  WINDOW_CODE,
  windowSums,
  maxWindowSum,
  bruteOps,
  slideOps,
  TEMPS,
  WINDOW_K,
} from "./sliding-window.ts";
import fixture from "./fixtures/sliding-window.json" with { type: "json" };

// fixture 는 scripts/algo/trace_sliding_window.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2], after[3]];
  });
}

test("WINDOW_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(WINDOW_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = windowTape(c.arr, c.k);
    const mine = t.steps.map((s) => [s.line, s.vars.i ?? null, s.vars.window ?? null, s.vars.best ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("windowSums — 페이지의 기온 열 칸에서 창 합이 이렇게 이어진다", () => {
  assert.deepEqual(windowSums(TEMPS, WINDOW_K), [10, 15, 16, 23, 16, 14, 12, 13]);
});

test("maxWindowSum — 가장 큰 합은 23 이고 처음 나오는 자리를 돌려준다", () => {
  assert.deepEqual(maxWindowSum(TEMPS, WINDOW_K), { best: 23, start: 3 });
});

test("windowTape — 마지막 스텝이 최대 합이고 done 이며, 가장 좋은 창이 settled 다", () => {
  const last = windowTape(TEMPS, WINDOW_K).steps.at(-1)!;
  assert.equal(last.vars.best, 23);
  assert.equal(last.done, true);
  const settled = last.stage.cells.flatMap((c, i) => (c === "settled" ? [i] : []));
  assert.deepEqual(settled, [3, 4, 5]);
});

test("windowTape — 창은 한 칸씩 오른쪽으로만 밀린다", () => {
  const t = windowTape(TEMPS, WINDOW_K);
  // 줄 6 에서 창 안(current) 맨 왼쪽 칸 번호
  const lefts = t.steps.filter((s) => s.line === 6).map((s) => s.stage.cells.indexOf("current"));
  assert.deepEqual(lefts, [1, 2, 3, 4, 5, 6, 7]);
});

test("windowTape — 첫 창을 직접 더하는 스텝이 있고 그때 window 가 처음 생긴다", () => {
  const t = windowTape(TEMPS, WINDOW_K);
  const first = t.steps.find((s) => s.line === 3)!;
  assert.equal(first.vars.window, 10);
  assert.equal(t.steps.find((s) => s.line === 2)!.vars.window, undefined);
});

test("같은 합이 여럿이면 처음 나온 창을 최고로 둔다", () => {
  assert.deepEqual(maxWindowSum([2, 2, 2, 2], 2), { best: 4, start: 0 });
});

test("창이 칸 수보다 크면 전체를 더한 값을 돌려준다 — 진짜 코드가 그렇게 돈다", () => {
  const last = windowTape([1, 2], 5).steps.at(-1)!;
  assert.equal(last.vars.best, 3);
});

test("k 가 1 보다 작으면 거절한다", () => {
  assert.throws(() => windowTape([1, 2, 3], 0), RangeError);
  assert.throws(() => maxWindowSum([1, 2, 3], 0), RangeError);
});

test("모든 스텝의 line 이 코드 범위 안에 있다", () => {
  for (const arr of [[], [5], TEMPS]) {
    for (const s of windowTape(arr, 3).steps) {
      assert.ok(s.line >= 1 && s.line <= WINDOW_CODE.length, `line ${s.line} 범위 밖`);
    }
  }
});

test("bruteOps·slideOps — 열 칸·창 3 은 24 대 17, 10만 칸·창 1만은 9억 대 19만", () => {
  assert.equal(bruteOps(10, 3), 24);
  assert.equal(slideOps(10, 3), 3 + 2 * 7);
  assert.equal(bruteOps(100_000, 10_000), 90_001 * 10_000);
  assert.equal(slideOps(100_000, 10_000), 10_000 + 2 * 90_000);
});
