import test from "node:test";
import assert from "node:assert/strict";
import {
  keyTape,
  KEY_CODE,
  CARDS,
  TARGET_ORDER,
  keyOf,
  keyText,
  applySort,
  isTarget,
  orderNames,
  sortedByKey,
  tiesAfter,
} from "./python-sort.ts";
import fixture from "./fixtures/python-sort.json" with { type: "json" };

// fixture 는 scripts/algo/trace_python_sort.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2]];
  });
}

test("KEY_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(KEY_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·score·keyed 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const cards = c.cards.map(([name, score]) => ({ name: name as string, score: score as number }));
    const t = keyTape(cards);
    const mine = t.steps.map((s) => [s.line, s.vars.score ?? null, s.vars.keyed ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("Python 이 돌려준 순서와 JS 의 마지막 스텝·sortedByKey 가 같다", () => {
  for (const c of fixture.cases) {
    const cards = c.cards.map(([name, score]) => ({ name: name as string, score: score as number }));
    assert.deepEqual(orderNames(sortedByKey(cards)), c.order, `케이스: ${c.name}`);
    const last = keyTape(cards).steps.at(-1)!;
    assert.ok(last.stage.table, "마지막 스텝에 표가 있다");
    assert.deepEqual(
      last.stage.table!.rows.map((r) => r.cells[0]),
      c.order,
      `표의 순서: ${c.name}`,
    );
  }
});

test("목표 순서 — 점수 높은 순, 같은 점수면 이름순", () => {
  assert.deepEqual(TARGET_ORDER, ["lee", "tom", "amy", "kim", "zed", "bob"]);
  assert.deepEqual(orderNames(sortedByKey(CARDS)), TARGET_ORDER);
});

test("keyOf·keyText — 점수는 부호를 바꾸고 이름은 그대로", () => {
  assert.deepEqual(keyOf({ name: "lee", score: 90 }), [-90, "lee"]);
  assert.equal(keyText({ name: "lee", score: 90 }), "(-90, 'lee')");
});

test("applySort — 이름순 다음 점수순이면 목표 순서가 된다(안정 정렬)", () => {
  const afterName = applySort(CARDS, "name");
  assert.deepEqual(orderNames(afterName), ["amy", "bob", "kim", "lee", "tom", "zed"]);
  const afterScore = applySort(afterName, "score");
  assert.deepEqual(orderNames(afterScore), TARGET_ORDER);
  assert.ok(isTarget(afterScore));
});

test("applySort — 점수순 다음 이름순이면 점수 정렬이 지워진다", () => {
  const afterScore = applySort(CARDS, "score");
  assert.deepEqual(orderNames(afterScore), ["lee", "tom", "kim", "amy", "zed", "bob"]);
  const afterName = applySort(afterScore, "name");
  assert.ok(!isTarget(afterName));
});

test("applySort — 점수순을 이름순 뒤에 한 번 더 누르면 같은 점수끼리 이름순이 살아남는다", () => {
  const a = applySort(applySort(applySort(CARDS, "score"), "name"), "score");
  assert.ok(isTarget(a));
});

test("applySort — 원래 줄을 바꾸지 않는다", () => {
  const before = orderNames(CARDS);
  applySort(CARDS, "name");
  assert.deepEqual(orderNames(CARDS), before);
});

test("tiesAfter — 이름순을 먼저 하고 점수순을 나중에 하면 80점끼리 이름순", () => {
  assert.deepEqual(tiesAfter("name", 80), ["amy", "kim", "zed"]);
  assert.deepEqual(tiesAfter("original", 80), ["kim", "amy", "zed"]);
});

test("keyTape — 모든 스텝의 line 이 코드 범위 안에 있다", () => {
  for (const cards of [[], [CARDS[0]], CARDS]) {
    for (const s of keyTape(cards).steps) {
      assert.ok(s.line >= 1 && s.line <= KEY_CODE.length, `line ${s.line} 범위 밖`);
    }
  }
});

test("keyTape — 여섯 장이면 22스텝이고 연타로 끝나지 않을 만큼 짧다", () => {
  const t = keyTape(CARDS);
  assert.equal(t.steps.length, 22);
  assert.equal(t.truncated, false);
});

test("keyTape — 정렬하기 전 표는 원래 순서, 정렬 뒤에는 목표 순서와 순위가 붙는다", () => {
  const t = keyTape(CARDS);
  const sortStep = t.steps.find((s) => s.line === 6)!;
  const before = t.steps[t.steps.indexOf(sortStep) - 1];
  assert.deepEqual(
    before.stage.table!.rows.map((r) => r.cells[0]),
    CARDS.map((c) => c.name),
  );
  assert.deepEqual(
    sortStep.stage.table!.rows.map((r) => r.cells[0]),
    TARGET_ORDER,
  );
  assert.deepEqual(
    sortStep.stage.table!.rows.map((r) => r.cells[3]),
    ["1", "2", "3", "4", "5", "6"],
  );
});

test("keyTape — 마지막 스텝은 done 이고 순서를 돌려준다", () => {
  const last = keyTape(CARDS).steps.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.line, KEY_CODE.length);
});

test("keyTape — 빈 목록과 한 장에서도 테이프가 생긴다", () => {
  assert.ok(keyTape([]).steps.length >= 3);
  assert.ok(keyTape([CARDS[0]]).steps.length >= 3);
});
