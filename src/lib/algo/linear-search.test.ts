import test from "node:test";
import assert from "node:assert/strict";
import {
  searchTape,
  SEARCH_CODE,
  SEARCH_ARR,
  SEARCH_TARGET,
  SEARCH_MISSING,
  linearSearch,
  opensNeeded,
  canOpen,
} from "./linear-search.ts";
import fixture from "./fixtures/linear-search.json" with { type: "json" };

// fixture 는 scripts/algo/trace_linear_search.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1]];
  });
}

test("SEARCH_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(SEARCH_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = searchTape(c.arr, c.target);
    const mine = t.steps.map((s) => [s.line, s.vars.i ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("① 과 ④ 가 같은 입력이다 — 번호 4 는 아홉 번째 칸(8번)에 있다", () => {
  assert.equal(SEARCH_ARR.length, 12);
  assert.equal(linearSearch(SEARCH_ARR, SEARCH_TARGET), 8);
  assert.equal(opensNeeded(SEARCH_ARR, SEARCH_TARGET), 9);
});

test("opensNeeded — 없는 번호는 칸을 전부 열어야 알 수 있다", () => {
  assert.equal(linearSearch(SEARCH_ARR, SEARCH_MISSING), -1);
  assert.equal(opensNeeded(SEARCH_ARR, SEARCH_MISSING), SEARCH_ARR.length);
});

test("linearSearch — 같은 값이 여럿이면 첫 위치만 돌려준다", () => {
  assert.equal(linearSearch([3, 8, 3], 3), 0);
});

test("canOpen — 열 수 있는 칸은 아직 안 연 칸 중 맨 앞 하나뿐이다", () => {
  assert.equal(canOpen(0, 0), true);
  assert.equal(canOpen(0, 1), false);
  assert.equal(canOpen(3, 3), true);
  assert.equal(canOpen(3, 2), false);
  assert.equal(canOpen(3, 5), false);
});

test("searchTape — 찾으면 done=true 와 한 칸만 settled, 못 찾으면 done=false", () => {
  const found = searchTape(SEARCH_ARR, SEARCH_TARGET);
  assert.equal(found.steps.at(-1)!.done, true);
  assert.equal(found.steps.at(-1)!.stage.cells.filter((c) => c === "settled").length, 1);
  const missing = searchTape(SEARCH_ARR, SEARCH_MISSING);
  assert.equal(missing.steps.at(-1)!.done, false);
  assert.ok(missing.steps.at(-1)!.stage.cells.every((c) => c === "dropped"));
});

test("searchTape — 지나간 칸은 dropped, 지금 보는 칸은 current, 아직 안 본 칸은 out 이다", () => {
  const t = searchTape(SEARCH_ARR, SEARCH_TARGET);
  const mid = t.steps.find((s) => s.line === 3 && s.vars.i === 2)!;
  assert.deepEqual(mid.stage.cells.slice(0, 4), ["dropped", "dropped", "current", "out"]);
});

test("searchTape — 시작 스텝에는 아직 본 칸이 없다", () => {
  const first = searchTape(SEARCH_ARR, SEARCH_TARGET).steps[0];
  assert.ok(first.stage.cells.every((c) => c !== "dropped"));
});

test("searchTape — 12칸에서 9칸째를 찾는 데 스텝이 19개이고 상한 안이다", () => {
  const t = searchTape(SEARCH_ARR, SEARCH_TARGET);
  assert.equal(t.steps.length, 19);
  assert.equal(t.truncated, false);
});

test("searchTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const target of [4, 13, 7, 1]) {
    for (const s of searchTape(SEARCH_ARR, target).steps) {
      assert.ok(s.line >= 1 && s.line <= SEARCH_CODE.length, `line ${s.line} 범위 밖`);
    }
  }
});

test("searchTape — 빈 배열과 길이 1 에서도 테이프가 생기고 올바르게 끝난다", () => {
  assert.equal(searchTape([], 5).steps.at(-1)!.done, false);
  assert.equal(searchTape([5], 5).steps.at(-1)!.done, true);
});
