import test from "node:test";
import assert from "node:assert/strict";
import { pairsTape, PAIRS_CODE, ops, log10Ops, pairCount, timeLabel, fitsInSecond, opsLabel } from "./big-o.ts";
import fixture from "./fixtures/big-o.json" with { type: "json" };

test("PAIRS_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(PAIRS_CODE, fixture.code);
});

// Python 의 line 이벤트는 그 줄을 실행하기 전에 찍힌다 — 변수는 다음 행에서 읽는다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2], after[3]];
  });
}

test("Python 과 JS 가 같은 줄·같은 변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = pairsTape(c.arr);
    const mine = t.steps.map((s) => [s.line, s.vars.i ?? null, s.vars.j ?? null, s.vars.count ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("pairsTape — 같은 값이 없으면 n(n-1)/2 번 견준다", () => {
  const t = pairsTape([4, 7, 1, 9, 3, 6]);
  assert.equal(t.steps.at(-1)!.vars.count, pairCount(6));
  assert.equal(t.steps.at(-1)!.done, false);
});

test("pairsTape — 같은 값을 찾으면 거기서 멈춘다", () => {
  const t = pairsTape([4, 7, 1, 7, 3]);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.ok(last.stage.cells.filter((c) => c === "settled").length === 2);
});

test("pairsTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const arr of [[], [5], [1, 2, 3, 4]]) {
    for (const s of pairsTape(arr).steps) assert.ok(s.line >= 1 && s.line <= PAIRS_CODE.length);
  }
});

test("ops — 칸이 열 배가 되면 선형은 10배, 제곱은 100배다", () => {
  assert.equal(ops("linear", 1000) / ops("linear", 100), 10);
  assert.equal(ops("square", 1000) / ops("square", 100), 100);
});

test("timeLabel·fitsInSecond — 10만 칸에서 제곱은 1초를 넘고 n log n 은 안이다", () => {
  assert.equal(fitsInSecond(log10Ops("square", 100_000)), false);
  assert.equal(fitsInSecond(log10Ops("nlogn", 100_000)), true);
  assert.equal(timeLabel(log10Ops("square", 100_000)), "2분");
  assert.equal(timeLabel(Math.log10(pairCount(100_000))), "50초");
  assert.equal(timeLabel(log10Ops("nlogn", 100_000)), "1초 안");
});

test("2^n — 숫자로 못 담는 크기도 라벨이 나온다", () => {
  assert.equal(ops("exp", 5000), Infinity);
  assert.equal(opsLabel(log10Ops("exp", 100)), "10^30");
  assert.equal(timeLabel(log10Ops("exp", 100)), "우주 나이보다 길다");
});
