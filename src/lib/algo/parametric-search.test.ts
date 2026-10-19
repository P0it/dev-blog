import test from "node:test";
import assert from "node:assert/strict";
import {
  PILES,
  LIMIT_HOURS,
  PARAM_CODE,
  paramTape,
  hoursFor,
  pileHours,
  canFinish,
  minSpeed,
  speedStatus,
  boundaryFound,
  remainingRange,
  trialMessage,
} from "./parametric-search.ts";
import fixture from "./fixtures/parametric-search.json" with { type: "json" };

// ── Python 대조 ──
// fixture 는 scripts/algo/trace_parametric_search.py 가 실제 Python 을 settrace 로 돌려 만든다.
// Python 의 line 이벤트는 그 줄을 **실행하기 전**에 찍히므로, 줄 L 을 실행한 뒤의 변수는
// 다음 행에 들어 있다. 마지막 행만 자기 변수를 쓴다. hours 는 can_finish 가 끝날 때 붙들어 둔 값이다.
function pythonSteps(trace: (number | null)[][]) {
  return trace.map((row, i) => {
    const after = i + 1 < trace.length ? trace[i + 1] : row;
    return [row[0], after[1], after[2], after[3], after[4]];
  });
}

test("Python 코드와 JS 코드 배열이 한 글자도 다르지 않다", () => {
  assert.deepEqual(PARAM_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·같은 변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = paramTape(c.piles, c.h);
    const mine = t.steps.map((s) => [s.line, s.vars.lo ?? null, s.vars.hi ?? null, s.vars.mid ?? null, s.vars.hours ?? null]);
    assert.deepEqual(mine, pythonSteps(c.trace), `케이스: ${c.name}`);
  }
});

test("마지막 스텝의 lo 가 파이썬이 돌려준 값이다", () => {
  for (const c of fixture.cases) {
    assert.equal(paramTape(c.piles, c.h).steps.at(-1)!.vars.lo, c.result, `케이스: ${c.name}`);
    assert.equal(minSpeed(c.piles, c.h), c.result, `케이스: ${c.name}`);
  }
});

test("모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const c of fixture.cases) {
    for (const s of paramTape(c.piles, c.h).steps) {
      assert.ok(s.line >= 1 && s.line <= PARAM_CODE.length, `line ${s.line} 범위 밖`);
    }
  }
});

test("① 과 ④ 의 입력: 더미 3·6·7·11, 8시간 — 답은 4, 플레이어는 25스텝 안", () => {
  assert.deepEqual(PILES, [3, 6, 7, 11]);
  assert.equal(LIMIT_HOURS, 8);
  assert.equal(minSpeed(PILES, LIMIT_HOURS), 4);
  const t = paramTape(PILES, LIMIT_HOURS);
  assert.ok(t.steps.length <= 25, `스텝 ${t.steps.length}`);
  assert.equal(t.steps.at(-1)!.done, true);
  assert.equal(t.truncated, false);
});

// ── 시간 계산 ──

test("한 시간에 한 더미만 — 남아도 그 시간은 끝난다(올림)", () => {
  assert.deepEqual(pileHours(PILES, 5), [1, 2, 2, 3]);
  assert.equal(hoursFor(PILES, 5), 8);
  assert.deepEqual(
    Array.from({ length: 11 }, (_, i) => hoursFor(PILES, i + 1)),
    [27, 15, 10, 8, 8, 6, 5, 5, 5, 5, 4],
  );
});

test("canFinish — 속도 3 은 10시간이라 안 되고 4 는 8시간이라 된다", () => {
  assert.equal(canFinish(PILES, 3, 8), false);
  assert.equal(canFinish(PILES, 4, 8), true);
});

test("빠를수록 걸리는 시간은 늘지 않는다(되다 안 되다 하지 않는다)", () => {
  for (const piles of [PILES, [30, 11, 23, 4, 20], [1], [10, 10, 10]]) {
    let prev = Infinity;
    for (let s = 1; s <= Math.max(...piles); s++) {
      const h = hoursFor(piles, s);
      assert.ok(h <= prev, `속도 ${s}`);
      prev = h;
    }
  }
});

test("올림을 빼고 내림으로 계산하면 답이 3 으로 틀린다(⑥ 의 수치)", () => {
  const floorHours = (s: number) => PILES.reduce((a, p) => a + Math.floor(p / s), 0);
  assert.equal(floorHours(3), 8);
  assert.equal(hoursFor(PILES, 3), 10);
});

test("상한을 3 으로 잡으면 3 이 나오는데 3 으로는 10시간이 걸린다(⑥ 의 수치)", () => {
  let lo = 1;
  let hi = 3;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (canFinish(PILES, mid, LIMIT_HOURS)) hi = mid;
    else lo = mid + 1;
  }
  assert.equal(lo, 3);
  assert.equal(hoursFor(PILES, lo), 10);
});

test("hi = mid - 1 로 쓰면 6시간 제한에서 5 가 나온다(⑥ 의 수치)", () => {
  let lo = 1;
  let hi = Math.max(...PILES);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (canFinish(PILES, mid, 6)) hi = mid - 1;
    else lo = mid + 1;
  }
  assert.equal(lo, 5);
  assert.equal(minSpeed(PILES, 6), 6);
});

// ── ① 해 보기 판정 ──

test("speedStatus — 되는 속도보다 빠른 것은 해 보지 않아도 되고, 안 되는 속도보다 느린 것은 해 보지 않아도 안 된다", () => {
  const tried = { 5: true, 3: false };
  assert.deepEqual(speedStatus(tried, 5), { ok: true, direct: true });
  assert.deepEqual(speedStatus(tried, 9), { ok: true, direct: false });
  assert.deepEqual(speedStatus(tried, 3), { ok: false, direct: true });
  assert.deepEqual(speedStatus(tried, 1), { ok: false, direct: false });
  assert.equal(speedStatus(tried, 4), null);
});

test("boundaryFound — 되는 속도를 직접 해 봤고 바로 아래가 안 되는 걸 알면 찾은 것이다", () => {
  assert.equal(boundaryFound({}), null);
  assert.equal(boundaryFound({ 5: true }), null);
  assert.equal(boundaryFound({ 5: true, 3: false }), null); // 4 는 아직 모른다
  assert.equal(boundaryFound({ 5: true, 3: false, 4: true }), 4);
  assert.equal(boundaryFound({ 5: true, 4: true, 3: false }), 4);
  assert.equal(boundaryFound({ 1: true }), 1); // 가장 느린 속도가 곧 경계
  assert.equal(boundaryFound({ 6: true, 5: true, 4: true }), null); // 3 을 안 해 봤다
});

test("remainingRange — 아직 모르는 속도 범위", () => {
  assert.deepEqual(remainingRange({}, 11), [1, 11]);
  assert.deepEqual(remainingRange({ 5: true }, 11), [1, 4]);
  assert.deepEqual(remainingRange({ 5: true, 3: false }, 11), [4, 4]);
  assert.deepEqual(remainingRange({ 5: true, 3: false, 4: true }, 11), [4, 3]); // 비었다
});

test("trialMessage — 더미별 시간과 합이 한 문장에 나온다", () => {
  const m = trialMessage(PILES, 5, LIMIT_HOURS);
  assert.match(m, /3→1시간/);
  assert.match(m, /11→3시간/);
  assert.match(m, /8시간/);
});
