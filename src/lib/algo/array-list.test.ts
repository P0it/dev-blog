import test from "node:test";
import assert from "node:assert/strict";
import {
  insertFrontTape,
  ARRAY_CODE,
  LINE_PEOPLE,
  NEW_PERSON,
  PREDICT_OPTIONS,
  initLine,
  press,
  place,
  insertFrontMoves,
  appendMoves,
  slideTotal,
} from "./array-list.ts";
import fixture from "./fixtures/array-list.json" with { type: "json" };

// fixture 는 scripts/algo/trace_array_list.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수·배열은
// 다음 행에 들어 있다. 마지막 행만 자기 값을 쓴다.
type Row = [number, number | null, number | null, (number | null)[]];

function pythonSteps(trace: Row[]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return { line: row[0], i: after[1], moved: after[2], arr: after[3].map((v) => v ?? 0) };
  });
}

test("ARRAY_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(ARRAY_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = insertFrontTape(c.arr, c.x);
    const mine = t.steps.map((s) => ({ line: s.line, i: s.vars.i ?? null, moved: s.vars.moved ?? null }));
    const theirs = pythonSteps(c.trace as Row[]).map(({ line, i, moved }) => ({ line, i, moved }));
    assert.deepEqual(mine, theirs, `케이스: ${c.name}`);
  }
});

test("Python 과 JS 가 스텝마다 같은 배열을 그린다 (비어 있던 칸은 0 으로)", () => {
  for (const c of fixture.cases) {
    const t = insertFrontTape(c.arr, c.x);
    const mine = t.steps.map((s) => s.stage.values);
    const theirs = pythonSteps(c.trace as Row[]).map((r) => r.arr);
    assert.deepEqual(mine, theirs, `케이스: ${c.name}`);
  }
});

test("insertFrontTape — 마지막 스텝에서 새 사람이 맨 앞이고 나머지는 한 칸씩 뒤다", () => {
  const t = insertFrontTape(LINE_PEOPLE, NEW_PERSON);
  const last = t.steps.at(-1)!;
  assert.deepEqual(last.stage.values, [NEW_PERSON, ...LINE_PEOPLE]);
  assert.equal(last.done, true);
  assert.equal(last.vars.moved, LINE_PEOPLE.length);
});

test("insertFrontTape — 플레이어가 25스텝 안팎이고 상한에 안 걸린다", () => {
  const t = insertFrontTape(LINE_PEOPLE, NEW_PERSON);
  assert.ok(t.steps.length >= 20 && t.steps.length <= 30, `스텝 ${t.steps.length}`);
  assert.equal(t.truncated, false);
});

test("insertFrontTape — 비어 있는 칸(gap)은 처음엔 맨 끝이고 한 칸씩 앞으로 온다", () => {
  const t = insertFrontTape(LINE_PEOPLE, NEW_PERSON);
  assert.equal(t.steps[0].stage.gap, LINE_PEOPLE.length);
  // 7번 칸으로 한 칸 보낸 직후(5번 줄)에는 빈자리가 6번 칸
  const firstMove = t.steps.find((s) => s.line === 5)!;
  assert.equal(firstMove.stage.gap, LINE_PEOPLE.length - 1);
  // 마지막 칸 채운 뒤에는 빈자리가 없다
  assert.equal(t.steps.at(-1)!.stage.gap, undefined);
});

test("insertFrontTape — 기다리는 새 사람은 맨 앞에 세우기 전까지 옆에 보인다", () => {
  const t = insertFrontTape(LINE_PEOPLE, NEW_PERSON);
  assert.deepEqual(t.steps[0].stage.queue, [NEW_PERSON]);
  assert.equal(t.steps.at(-1)!.stage.queue, undefined);
});

test("insertFrontTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const arr of [[], [5], [1, 2, 3]]) {
    for (const s of insertFrontTape(arr, 9).steps) assert.ok(s.line >= 1 && s.line <= ARRAY_CODE.length);
  }
});

// ── ① 해 보기: 빈자리 바로 앞 사람만 밀 수 있다 ──

test("① 빈자리 바로 앞 사람부터 눌러 가면 코드와 같은 결과가 나온다", () => {
  let line = initLine(LINE_PEOPLE);
  for (let i = LINE_PEOPLE.length - 1; i >= 0; i--) {
    const r = press(line, i);
    assert.equal(r.ok, true, `${i}번 칸`);
    line = r.line;
  }
  assert.equal(line.gap, 0);
  assert.equal(line.moved, LINE_PEOPLE.length);
  const done = place(line, NEW_PERSON);
  assert.equal(done.ok, true);
  assert.deepEqual(done.line.slots, [NEW_PERSON, ...LINE_PEOPLE]);
  assert.equal(done.line.placed, true);
});

test("① 앞쪽 사람부터 밀면 뒤 사람을 덮어쓰니 막고 이유를 말한다", () => {
  const line = initLine(LINE_PEOPLE);
  const r = press(line, 0);
  assert.equal(r.ok, false);
  assert.match(r.text, /덮어/);
  assert.deepEqual(r.line, line); // 상태가 안 바뀐다
});

test("① 빈자리·이미 옮긴 사람을 누르면 안내만 하고 상태는 그대로다", () => {
  let line = initLine(LINE_PEOPLE);
  const emptyPress = press(line, LINE_PEOPLE.length); // 빈자리
  assert.equal(emptyPress.ok, false);
  assert.deepEqual(emptyPress.line, line);
  line = press(line, LINE_PEOPLE.length - 1).line;
  const moved = press(line, LINE_PEOPLE.length); // 방금 옮긴 사람
  assert.equal(moved.ok, false);
  assert.deepEqual(moved.line, line);
});

test("① 빈자리가 맨 앞에 오기 전에는 새 사람을 세울 수 없다", () => {
  const line = initLine(LINE_PEOPLE);
  const r = place(line, NEW_PERSON);
  assert.equal(r.ok, false);
  assert.equal(r.line.placed, false);
});

test("① 새 사람을 세운 뒤에는 더 눌러도 아무 일도 없다", () => {
  let line = initLine([2, 3]);
  line = press(line, 1).line;
  line = press(line, 0).line;
  line = place(line, 1).line;
  const r = press(line, 0);
  assert.equal(r.ok, false);
  assert.deepEqual(r.line, line);
});

// ── 횟수 ──

test("insertFrontMoves 는 줄 길이만큼, appendMoves 는 0 번이다", () => {
  assert.equal(insertFrontMoves(7), 7);
  assert.equal(insertFrontMoves(1_000_000), 1_000_000);
  assert.equal(appendMoves(7), 0);
});

test("slideTotal — 빈 줄에서 N 번 맨 앞에 끼우면 0+1+…+(N-1) 번 민다", () => {
  assert.equal(slideTotal(1), 0);
  assert.equal(slideTotal(4), 0 + 1 + 2 + 3);
  assert.equal(slideTotal(100_000), 4_999_950_000);
});

test("실제로 끼워 가며 센 횟수가 slideTotal 과 같다", () => {
  let moved = 0;
  const a: number[] = [];
  for (let k = 0; k < 50; k++) {
    moved += a.length;
    a.unshift(k);
  }
  assert.equal(moved, slideTotal(50));
});

// ── 예측 ──

test("PREDICT_OPTIONS — 정답은 정확히 하나이고 첫 번째(맨 뒤에 붙이기)다", () => {
  assert.equal(PREDICT_OPTIONS.filter((o) => o.correct).length, 1);
  assert.equal(PREDICT_OPTIONS[0].correct, true);
});
