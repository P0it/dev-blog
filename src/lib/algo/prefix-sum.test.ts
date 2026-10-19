import test from "node:test";
import assert from "node:assert/strict";
import {
  prefixTape,
  PREFIX_CODE,
  prefixOf,
  rangeSum,
  VISITS,
  QUESTIONS,
  handClicks,
  bulkOps,
  rangeSumWithoutZero,
} from "./prefix-sum.ts";
import fixture from "./fixtures/prefix-sum.json" with { type: "json" };

// fixture 는 scripts/algo/trace_prefix_sum.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2]];
  });
}

test("PREFIX_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(PREFIX_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = prefixTape(c.arr, c.left, c.right);
    const mine = t.steps.map((s) => [s.line, s.vars.i ?? null, s.vars.ans ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("prefixOf — 맨 앞에 0 이 있고 길이가 n+1 이다", () => {
  assert.deepEqual(prefixOf([3, 1, 4]), [0, 3, 4, 8]);
  assert.deepEqual(prefixOf([]), [0]);
});

test("rangeSum — 뺄셈 한 번이 칸을 하나씩 더한 값과 같다", () => {
  const p = prefixOf(VISITS);
  for (const [l, r] of QUESTIONS) {
    const slow = VISITS.slice(l, r + 1).reduce((a, b) => a + b, 0);
    assert.equal(rangeSum(p, l, r), slow, `${l}~${r}`);
  }
});

test("QUESTIONS — 합이 21·33·39 로 고정돼 있다(화면 문구가 이 숫자를 쓴다)", () => {
  const p = prefixOf(VISITS);
  assert.deepEqual(QUESTIONS.map(([l, r]) => rangeSum(p, l, r)), [21, 33, 39]);
});

test("QUESTIONS — 세 번째 질문은 left=0 이라 맨 앞 0 칸이 쓰인다", () => {
  assert.equal(QUESTIONS[2][0], 0);
});

test("handClicks — 칸 수만큼이고, 세 질문 합계는 23 이다", () => {
  assert.equal(handClicks(2, 6), 5);
  assert.equal(QUESTIONS.reduce((a, [l, r]) => a + handClicks(l, r), 0), 23);
});

test("prefixTape — 마지막 스텝의 ans 가 구간 합이고 done 이다", () => {
  const last = prefixTape(VISITS, 2, 6).steps.at(-1)!;
  assert.equal(last.vars.ans, 21);
  assert.equal(last.done, true);
});

test("prefixTape — 깔린 줄이 한 칸씩 길어져 n+1 칸이 된다", () => {
  const t = prefixTape(VISITS, 2, 6);
  const lens = t.steps.map((s) => s.stage.below?.values.length ?? 0);
  assert.equal(Math.max(...lens), VISITS.length + 1);
  assert.equal(lens[0], 1, "처음엔 [0] 한 칸");
});

test("prefixTape — 질문 단계에서 범위 앞은 dropped, 범위는 settled 다", () => {
  const t = prefixTape(VISITS, 2, 6);
  const s = t.steps.find((x) => x.line === 5)!;
  assert.deepEqual(s.stage.cells.slice(0, 3), ["dropped", "dropped", "settled"]);
  assert.equal(s.stage.cells[6], "settled");
  assert.equal(s.stage.cells[7], "out");
});

test("prefixTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const c of fixture.cases) {
    for (const s of prefixTape(c.arr, c.left, c.right).steps) {
      assert.ok(s.line >= 1 && s.line <= PREFIX_CODE.length, `line ${s.line} 범위 밖`);
    }
  }
});

test("prefixTape — 빈 배열·한 칸에서도 테이프가 생긴다", () => {
  assert.ok(prefixTape([], 0, -1).steps.length >= 1);
  assert.equal(prefixTape([7], 0, 0).steps.at(-1)!.vars.ans, 7);
});

test("prefixTape — 10칸은 스텝 상한 안에 끝난다", () => {
  assert.equal(prefixTape(VISITS, 2, 6).truncated, false);
});

test("bulkOps — 칸 100만·질문 1000개면 10억 대 약 100만이다", () => {
  const o = bulkOps(1_000_000, 1000);
  assert.equal(o.naive, 1_000_000_000);
  assert.equal(o.prefix, 1_002_000);
});

test("rangeSumWithoutZero — 앞에 0 을 안 두고 left=0 이면 음수 인덱스가 맨 뒤를 읽는다", () => {
  // [3, 1, 4] 의 0번~1번 합은 4. 누적합만 두고 cum[right] - cum[left-1] 로 하면 cum[-1] = 8 이 걸린다
  assert.equal(rangeSumWithoutZero([3, 1, 4], 0, 1), -4);
  // left 가 1 이상이면 우연히 맞는다
  assert.equal(rangeSumWithoutZero([3, 1, 4], 1, 2), 5);
});
