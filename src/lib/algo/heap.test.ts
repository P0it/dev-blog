import test from "node:test";
import assert from "node:assert/strict";
import {
  heapTape,
  HEAP_CODE,
  WARD,
  NEWCOMER,
  parentOf,
  shouldRise,
  riseStep,
  pushRises,
  pushed,
  isHeap,
  popMin,
  treeHeight,
} from "./heap.ts";
import fixture from "./fixtures/heap.json" with { type: "json" };

// fixture 는 scripts/algo/trace_heap.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
type Row = [number, number | null, number | null, number[]];
function pythonSteps(trace: Row[]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2], after[3]] as const;
  });
}

test("HEAP_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(HEAP_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·i·p·배열 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = heapTape(c.heap, c.x);
    const py = pythonSteps(c.trace as Row[]);
    assert.equal(t.steps.length, py.length, `케이스: ${c.name} — 스텝 수`);
    t.steps.forEach((s, k) => {
      assert.equal(s.line, py[k][0], `케이스: ${c.name} — ${k}번째 줄`);
      assert.equal(s.vars.i ?? null, py[k][1], `케이스: ${c.name} — ${k}번째 i`);
      assert.equal(s.vars.p ?? null, py[k][2], `케이스: ${c.name} — ${k}번째 p`);
      assert.deepEqual(s.stage.values, py[k][3], `케이스: ${c.name} — ${k}번째 배열`);
    });
  }
});

test("마지막 스텝의 배열이 Python 의 반환값과 같고 힙이다", () => {
  for (const c of fixture.cases) {
    const last = heapTape(c.heap, c.x).steps.at(-1)!;
    assert.deepEqual(last.stage.values, c.result, `케이스: ${c.name}`);
    assert.deepEqual(pushed(c.heap, c.x), c.result, `케이스: ${c.name} — pushed`);
    assert.equal(isHeap(c.result), true, `케이스: ${c.name} — isHeap`);
  }
});

test("① 과 ④ 가 같은 입력이다 — 접수대 6명 + 새 환자 1 은 두 번 올라가 맨 위가 된다", () => {
  assert.deepEqual(WARD, [2, 5, 3, 9, 6, 8]);
  assert.equal(NEWCOMER, 1);
  assert.equal(isHeap(WARD), true);
  assert.equal(pushRises(WARD, NEWCOMER), 2);
  // 실제 heapq.heappush 결과와 같다
  assert.deepEqual(pushed(WARD, NEWCOMER), [1, 5, 2, 9, 6, 8, 3]);
});

test("heapTape — ④ 입력은 14스텝이고 상한에 닿지 않는다", () => {
  const t = heapTape(WARD, NEWCOMER);
  assert.equal(t.steps.length, 14);
  assert.equal(t.truncated, false);
  assert.equal(t.steps.at(-1)!.done, true);
});

test("heapTape — 올라갈 때 부모와 견주는 줄은 6번, 바꾸는 줄은 8번이다", () => {
  const lines = heapTape(WARD, NEWCOMER).steps.map((s) => s.line);
  assert.deepEqual(lines, [2, 3, 4, 5, 6, 8, 9, 4, 5, 6, 8, 9, 4, 10]);
});

test("heapTape — 첫 비교에서 멈추면 break 줄(7번) 다음에 return 줄(10번)로 간다", () => {
  const lines = heapTape(WARD, 4).steps.map((s) => s.line);
  assert.deepEqual(lines, [2, 3, 4, 5, 6, 7, 10]);
});

test("pushRises — 새 환자가 4 이면 부모 3 이 더 급해 한 번도 안 올라간다", () => {
  assert.equal(pushRises(WARD, 4), 0);
  assert.equal(pushRises(WARD, 2), 1);
  assert.equal(pushRises(WARD, 0), 2);
  assert.equal(pushRises([], 7), 0);
});

test("parentOf — 부모 = (자식 − 1) // 2", () => {
  assert.equal(parentOf(1), 0);
  assert.equal(parentOf(2), 0);
  assert.equal(parentOf(5), 2);
  assert.equal(parentOf(6), 2);
});

test("shouldRise·riseStep — 부모보다 급할 때만 한 칸 올라가고, 부모가 더 급하면 멈춘다", () => {
  const start = [...WARD, NEWCOMER];
  assert.equal(shouldRise(start, 6), true);
  const a = riseStep(start, 6);
  assert.equal(a.swapped, true);
  assert.equal(a.i, 2);
  assert.deepEqual(a.heap, [2, 5, 1, 9, 6, 8, 3]);
  const b = riseStep(a.heap, a.i);
  assert.equal(b.i, 0);
  assert.deepEqual(b.heap, [1, 5, 2, 9, 6, 8, 3]);
  assert.equal(shouldRise(b.heap, 0), false);

  const stop = riseStep([...WARD, 4], 6);
  assert.equal(stop.swapped, false);
  assert.equal(stop.i, 6);
});

test("riseStep — 원래 배열을 건드리지 않는다", () => {
  const start = [...WARD, NEWCOMER];
  riseStep(start, 6);
  assert.deepEqual(start, [2, 5, 3, 9, 6, 8, 1]);
});

test("isHeap — 부모가 자식보다 크면 힙이 아니다", () => {
  assert.equal(isHeap([1, 5, 2, 9, 6, 8, 3]), true);
  assert.equal(isHeap([3, 1, 2]), false);
  assert.equal(isHeap([]), true);
});

test("③ popMin — 맨 위를 꺼내고 맨 끝 환자를 올려 내려보내도 힙이다", () => {
  const r = popMin([1, 5, 2, 9, 6, 8, 3]);
  assert.equal(r.min, 1);
  assert.deepEqual(r.heap, [2, 5, 3, 9, 6, 8]);
  assert.equal(isHeap(r.heap), true);
  assert.equal(popMin([7]).min, 7);
  assert.deepEqual(popMin([7]).heap, []);
});

test("treeHeight — 10만 개여도 올라갈 수 있는 층은 16번이다", () => {
  assert.equal(treeHeight(1), 0);
  assert.equal(treeHeight(7), 2);
  assert.equal(treeHeight(100_000), 16);
});

test("heapTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const [h, x] of [
    [[], 7],
    [[2], 2],
    [WARD, 1],
    [WARD, 4],
  ] as [number[], number][]) {
    for (const s of heapTape(h, x).steps) assert.ok(s.line >= 1 && s.line <= HEAP_CODE.length);
  }
});

test("heapTape — 끝나면 새 환자가 선 칸이 settled 다", () => {
  const last = heapTape(WARD, NEWCOMER).steps.at(-1)!;
  assert.equal(last.stage.cells[0], "settled");
  assert.deepEqual(last.stage.values, [1, 5, 2, 9, 6, 8, 3]);
});
