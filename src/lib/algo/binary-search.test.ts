import test from "node:test";
import assert from "node:assert/strict";
import { buildTape } from "./tape.ts";
import { binarySearchTape, BINARY_SEARCH_CODE } from "./binary-search.ts";
import type { Step } from "./types.ts";

test("binarySearchTape — 찾는 값이 있을 때 done 으로 끝난다", () => {
  const t = binarySearchTape([7, 12, 19, 23, 31, 42, 55, 68, 71, 90], 42);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.vars.mid, 5);
  assert.equal(t.truncated, false);
});

test("binarySearchTape — 모든 스텝의 line 이 코드 범위 안에 있다", () => {
  const t = binarySearchTape([7, 12, 19, 23, 31, 42, 55, 68, 71, 90], 42);
  assert.ok(t.steps.length > 0);
  for (const s of t.steps) {
    assert.ok(s.line >= 1 && s.line <= t.code.length, `line ${s.line} 이 범위 밖`);
  }
});

test("binarySearchTape — 못 찾으면 return -1 줄까지 간다", () => {
  const t = binarySearchTape([1, 3, 5], 4);
  const last = t.steps.at(-1)!;
  assert.equal(last.line, BINARY_SEARCH_CODE.length);
  assert.equal(last.done, false);
});

test("binarySearchTape — 빈 배열에서도 테이프가 생긴다", () => {
  const t = binarySearchTape([], 1);
  assert.ok(t.steps.length >= 1);
  assert.equal(t.steps.at(-1)!.done, false);
  assert.equal(t.truncated, false);
});

test("binarySearchTape — 길이 1 배열에서 찾고 못 찾고 둘 다 끝난다", () => {
  assert.equal(binarySearchTape([5], 5).steps.at(-1)!.done, true);
  assert.equal(binarySearchTape([5], 9).steps.at(-1)!.done, false);
});

test("binarySearchTape — 버린 범위는 dropped, 찾은 칸은 settled 다", () => {
  const t = binarySearchTape([7, 12, 19, 23, 31, 42, 55, 68, 71, 90], 42);
  const last = t.steps.at(-1)!;
  // 42 는 5번 칸. 왼쪽 0~4 는 전부 잘려 나갔다
  assert.equal(last.stage.cells[0], "dropped");
  assert.equal(last.stage.cells[4], "dropped");
  assert.equal(last.stage.cells[5], "settled");
});

test("buildTape — 상한에 닿으면 truncated 로 끊는다", () => {
  function* forever(): Generator<Step> {
    for (let i = 0; ; i++) {
      yield { line: 1, vars: { i }, stage: { cells: [], flags: {} }, note: "." };
    }
  }
  const t = buildTape(forever(), ["x"], 10);
  assert.equal(t.steps.length, 10);
  assert.equal(t.truncated, true);
});

test("buildTape — 상한에 닿지 않으면 truncated 가 false 다", () => {
  function* three(): Generator<Step> {
    for (let i = 0; i < 3; i++) {
      yield { line: 1, vars: { i }, stage: { cells: [], flags: {} }, note: "." };
    }
  }
  const t = buildTape(three(), ["x"], 10);
  assert.equal(t.steps.length, 3);
  assert.equal(t.truncated, false);
});

// ── Python 대조 ──
// fixture 는 scripts/algo/trace_binary_search.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
import fixture from "./fixtures/binary-search.json" with { type: "json" };

function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, i) => {
    const after = i + 1 < trace.length ? trace[i + 1] : row;
    return [row[0], after[1], after[2], after[3]];
  });
}

test("Python 코드와 JS 코드 배열이 한 글자도 다르지 않다", () => {
  assert.deepEqual(BINARY_SEARCH_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·같은 변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = binarySearchTape(c.arr, c.target);
    const mine = t.steps.map((s) => [
      s.line,
      s.vars.left ?? null,
      s.vars.right ?? null,
      s.vars.mid ?? null,
    ]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("비교 스텝은 같은 수를 두 번 말하지 않는다", () => {
  const t = binarySearchTape([7, 12, 19, 23, 31, 42, 55, 68, 71, 90], 42);
  const compare = t.steps.filter((s) => s.line === 5).map((s) => s.note);
  assert.equal(compare.at(-1), "5번 칸의 42가 찾는 값일까요?");
  assert.equal(compare[0], "4번 칸의 31이 찾는 값일까요?");
});

test("시작 스텝은 아무 칸도 건드리지 않은 상태다", () => {
  const t = binarySearchTape([7, 12, 19, 23, 31, 42, 55, 68, 71, 90], 42);
  assert.ok(t.steps[0].stage.cells.every((c) => c === "out"), "첫 스텝은 전부 out 이어야 한다");
});

// ── ⑥ 틀리는 자리 — 등호를 뺀 코드(<) ──
import { BINARY_SEARCH_LT_CODE } from "./binary-search.ts";

const ARR = [7, 12, 19, 23, 31, 42, 55, 68, 71, 90];

test("등호를 뺀 코드 — 맨 끝 90 은 배열에 있는데 한 칸 남은 순간을 안 보고 -1 이다", () => {
  const ok = binarySearchTape(ARR, 90);
  assert.equal(ok.steps.at(-1)!.done, true);
  // 정상 코드는 한 칸(left == right == 9) 남은 순간을 본다
  assert.ok(ok.steps.some((s) => s.vars.left === 9 && s.vars.right === 9 && s.line === 3));
  const bad = binarySearchTape(ARR, 90, "lt");
  assert.equal(bad.steps.at(-1)!.done, false);
  assert.equal(bad.code[2], "    while left < right:");
  assert.match(bad.steps.at(-1)!.note, /배열에 있는데/);
});

test("등호를 뺀 코드 — 없는 값 50 은 정상 코드와 같이 -1 이다", () => {
  assert.equal(binarySearchTape(ARR, 50).steps.at(-1)!.done, false);
  assert.equal(binarySearchTape(ARR, 50, "lt").steps.at(-1)!.done, false);
  assert.equal(binarySearchTape(ARR, 50, "lt").steps.at(-1)!.note, "이 줄에는 없습니다");
});

test("BINARY_SEARCH_LT_CODE — 3번 줄만 다르다", () => {
  const diff = BINARY_SEARCH_LT_CODE.filter((l, i) => l !== BINARY_SEARCH_CODE[i]);
  assert.equal(diff.length, 1);
});

test("후보 칸 수를 알려 준다 — 게임의 '남은 후보'와 같은 말이다", () => {
  const t = binarySearchTape(ARR, 42);
  assert.equal(t.steps.find((s) => s.line === 3)!.note, "후보 10칸이 남았습니다");
});
