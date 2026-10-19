import test from "node:test";
import assert from "node:assert/strict";
import { packTape, PACK_CODE, bestPack, lockCombos, lockLog10, LOCK_SECRET, subsetCount } from "./brute-force.ts";
import fixture from "./fixtures/brute-force.json" with { type: "json" };

// fixture 는 scripts/algo/trace_brute_force.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2], after[3], after[4], after[5]];
  });
}

test("PACK_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(PACK_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = packTape(c.weights, c.values, c.limit);
    const mine = t.steps.map((s) => [
      s.line,
      s.vars.mask ?? null,
      s.vars.i ?? null,
      s.vars.w ?? null,
      s.vars.v ?? null,
      s.vars.best ?? null,
    ]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("packTape — 마지막 스텝이 최선의 값이고 done 이다", () => {
  const last = packTape([2, 3, 4], [3, 4, 5], 5).steps.at(-1)!;
  assert.equal(last.vars.best, 7);
  assert.equal(last.done, true);
});

test("packTape — 경우의 수는 2^n 가지를 빠짐없이 훑는다", () => {
  const t = packTape([2, 3, 4], [3, 4, 5], 5);
  const masks = new Set(t.steps.map((s) => s.vars.mask));
  assert.deepEqual([...masks].filter((m) => m !== undefined).sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test("packTape — 담은 칸이 settled 로 그려진다", () => {
  const t = packTape([2, 3, 4], [3, 4, 5], 5);
  // mask=3 (0번·1번) 에서 w 를 더한 스텝
  const s = t.steps.find((x) => x.vars.mask === 3 && x.line === 9)!;
  assert.deepEqual(s.stage.cells, ["settled", "settled", "out"]);
});

test("packTape — 3개 물건은 스텝 상한 안에 끝난다", () => {
  assert.equal(packTape([2, 3, 4], [3, 4, 5], 5).truncated, false);
});

test("packTape — 모든 스텝의 line 이 코드 범위 안에 있다", () => {
  for (const s of packTape([2, 3, 4], [3, 4, 5], 5).steps) {
    assert.ok(s.line >= 1 && s.line <= PACK_CODE.length, `line ${s.line} 범위 밖`);
  }
});

test("bestPack — 한도를 못 맞추면 0 이다", () => {
  assert.equal(bestPack([9], [4], 5), 0);
  assert.equal(bestPack([], [], 5), 0);
});

test("lockCombos — 자릿수가 하나 늘면 열 배다", () => {
  assert.equal(lockCombos(3), 1000);
  assert.equal(lockCombos(4) / lockCombos(3), 10);
  assert.equal(lockCombos(10), 10_000_000_000);
  assert.ok(Math.abs(lockLog10(10) - 10) < 1e-9);
});

test("LOCK_SECRET — 세 자리 숫자다", () => {
  assert.equal(LOCK_SECRET.length, 3);
  assert.ok(LOCK_SECRET.every((d) => d >= 0 && d <= 9));
});

test("subsetCount — 물건 하나가 늘면 두 배다", () => {
  assert.equal(subsetCount(3), 8);
  assert.equal(subsetCount(20), 1_048_576);
});
