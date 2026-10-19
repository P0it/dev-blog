import test from "node:test";
import assert from "node:assert/strict";
import {
  packTape,
  PACK_CODE,
  bestPack,
  lockCombos,
  lockLog10,
  LOCK_SECRET,
  lockKey,
  subsetCount,
  subsetWork,
  secondsLabel,
} from "./brute-force.ts";
import fixture from "./fixtures/brute-force.json" with { type: "json" };

// fixture 는 scripts/algo/trace_brute_force.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, k) => {
    const after = k + 1 < trace.length ? trace[k + 1] : row;
    return [row[0], after[1], after[2], after[3], after[4]];
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
  // mask=3 (0번·1번) 에서 무게를 더한 스텝
  const s = t.steps.find((x) => x.vars.mask === 3 && x.line === 5)!;
  assert.deepEqual(s.stage.cells, ["settled", "settled", "out"]);
});

test("packTape — 3개 물건은 스텝 상한 안에 끝나고 25~45 스텝이다(연타로 끝나지 않게)", () => {
  const t = packTape([2, 3, 4], [3, 4, 5], 5);
  assert.equal(t.truncated, false);
  assert.ok(t.steps.length >= 25 && t.steps.length <= 45, `스텝 ${t.steps.length}`);
});

test("packTable — 처음에는 8줄이 전부 todo 이고 끝나면 전부 끝난 줄이다", () => {
  const t = packTape([2, 3, 4], [3, 4, 5], 5);
  const first = t.steps[0].stage.table!;
  assert.equal(first.rows.length, 8);
  assert.ok(first.rows.every((r) => r.state === "todo"));
  const last = t.steps.at(-1)!.stage.table!;
  assert.ok(last.rows.every((r) => r.state !== "todo" && r.state !== "current"));
  // 최고 값 7 은 mask=3(0번·1번) 이다
  assert.equal(last.rows.filter((r) => r.state === "best").length, 1);
  assert.equal(last.rows[3].state, "best");
  assert.equal(last.rows[5].state, "over"); // 0번·2번은 무게 6 이라 한도 5 를 넘는다
});

test("packTable — mask 3 은 011 이다", () => {
  const first = packTape([2, 3, 4], [3, 4, 5], 5).steps[0].stage.table!;
  assert.equal(first.rows[3].cells[0], "3 = 011");
  assert.equal(first.rows[3].cells[1], "0·1");
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

test("LOCK_SECRET — 세 자리 숫자이고 앞쪽(000부터 세는 쪽)에서 멀다", () => {
  assert.equal(LOCK_SECRET.length, 3);
  assert.ok(LOCK_SECRET.every((d) => d >= 0 && d <= 9));
  assert.ok(Number(lockKey(LOCK_SECRET)) >= 900, "000 부터 세면 900번째 이후에 열려야 한다");
});

test("secondsLabel — 1천만 번/초 기준 시간 표기", () => {
  assert.equal(secondsLabel(0.1), "1초 안");
  assert.equal(secondsLabel(1000), "17분");
  assert.equal(secondsLabel(1e10 / 1), "317년");
  assert.equal(secondsLabel(1e30), "우주 나이보다 길다");
});

test("subsetWork — 물건 20개는 약 2천만 번이다(경우마다 물건 수만큼 더 본다)", () => {
  assert.equal(subsetWork(20), 20 * 1_048_576);
  assert.ok(subsetWork(25) > 8e8);
});

test("subsetCount — 물건 하나가 늘면 두 배다", () => {
  assert.equal(subsetCount(3), 8);
  assert.equal(subsetCount(20), 1_048_576);
});
