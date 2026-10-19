import test from "node:test";
import assert from "node:assert/strict";
import {
  sieveTape,
  SIEVE_CODE,
  SIEVE_N,
  primesUpTo,
  multiplesOf,
  initialErased,
  pressNumber,
  smallestOpen,
  remainingCount,
  largestPress,
  innerWrites,
  outerChecks,
  sieveWithout01,
} from "./sieve.ts";
import { STEP_LIMIT } from "./tape.ts";
import fixture from "./fixtures/sieve.json" with { type: "json" };

// fixture 는 scripts/algo/trace_sieve.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행은 [줄, i, j, 지운 수] 이고 **그 줄을 실행한 뒤**의 값이다(아직 없는 변수는 null).
// 올리는 줄은 2·3·5·6·7·8 이다. 4번 줄(for i)은 올리지 않고, 안쪽 반복은 소수 i 하나당 6번·7번 줄 두 스텝으로 묶는다.
test("SIEVE_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(SIEVE_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·변수 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = sieveTape(c.n);
    const mine = t.steps.map((s) => [s.line, s.vars.i ?? null, s.vars.j ?? null, s.vars["지운 수"] ?? null]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("Python 이 낸 소수 목록과 primesUpTo 가 같다", () => {
  for (const c of fixture.cases) {
    assert.deepEqual(primesUpTo(c.n), c.primes, `케이스: ${c.name}`);
  }
});

test("① 과 ④ 가 같은 60 이다 — 60 이하 소수는 17개", () => {
  assert.equal(SIEVE_N, 60);
  assert.equal(primesUpTo(60).length, 17);
  assert.deepEqual(primesUpTo(60).slice(0, 6), [2, 3, 5, 7, 11, 13]);
  assert.equal(primesUpTo(60).at(-1), 59);
  assert.equal(primesUpTo(100).length, 25);
});

test("sieveTape — 데모 입력은 스텝 상한 안에서 끝까지 돈다", () => {
  const t = sieveTape(SIEVE_N);
  assert.equal(t.truncated, false);
  assert.ok(t.steps.length >= 15 && t.steps.length <= 30, `스텝 ${t.steps.length}`);
  assert.ok(t.steps.length < STEP_LIMIT);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, true);
  assert.equal(last.line, SIEVE_CODE.length);
  // 59 개(2~60) 중 42 개를 지워 17 개가 남는다
  assert.equal(last.vars["지운 수"], 42);
});

test("sieveTape — 모든 스텝의 line 이 코드 범위 안이다", () => {
  for (const n of [1, 2, 3, 4, 60]) {
    for (const s of sieveTape(n).steps) assert.ok(s.line >= 1 && s.line <= SIEVE_CODE.length, `n=${n} line ${s.line}`);
  }
});

test("sieveTape — 소수 i 마다 6번·7번 줄이 한 번씩, 지워진 i 는 5번 줄만", () => {
  const t = sieveTape(60);
  const by = (line: number) => t.steps.filter((s) => s.line === line).map((s) => s.vars.i);
  assert.deepEqual(by(5), [2, 3, 4, 5, 6, 7]);
  assert.deepEqual(by(6), [2, 3, 5, 7]);
  assert.deepEqual(by(7), [2, 3, 5, 7]);
});

test("sieveTape — 7번 줄 스텝은 새로 지운 칸을 fresh 로 싣고 그 칸이 지워져 있다", () => {
  const t = sieveTape(60);
  const s7 = t.steps.filter((s) => s.line === 7);
  assert.equal(s7[0].stage.sieve!.fresh!.length, 29); // 2 의 배수 4,6,…,60
  assert.equal(s7[1].stage.sieve!.fresh!.length, 9); // 3 의 배수 중 9 부터 새로 지운 것
  for (const s of s7) for (const m of s.stage.sieve!.fresh!) assert.equal(s.stage.sieve!.erased[m], true);
});

test("sieveTape — 마지막 스텝에서 지워지지 않은 수가 소수 목록과 같다", () => {
  const last = sieveTape(60).steps.at(-1)!.stage.sieve!;
  const open = last.erased.map((e, m) => (!e ? m : -1)).filter((m) => m >= 2);
  assert.deepEqual(open, primesUpTo(60));
});

test("multiplesOf — 자기 자신은 빼고 n 이하 배수만", () => {
  assert.deepEqual(multiplesOf(7, 60), [14, 21, 28, 35, 42, 49, 56]);
  assert.deepEqual(multiplesOf(11, 60), [22, 33, 44, 55]);
  assert.deepEqual(multiplesOf(2, 5), [4]);
  assert.deepEqual(multiplesOf(5, 5), []);
});

test("pressNumber — 배수를 지우고 새로 지운 것만 fresh 로 돌려준다", () => {
  const e0 = initialErased(60);
  assert.equal(e0[0] && e0[1], true);
  assert.equal(remainingCount(e0, 60), 59);
  const a = pressNumber(e0, 2, 60);
  assert.equal(a.fresh.length, 29);
  assert.equal(remainingCount(a.erased, 60), 30);
  const b = pressNumber(a.erased, 3, 60);
  assert.deepEqual(b.fresh, [9, 15, 21, 27, 33, 39, 45, 51, 57]);
  // 원본 배열은 건드리지 않는다
  assert.equal(e0[4], false);
});

test("2·3·5·7 을 누르면 17 개가 남고, 11 을 눌러도 바뀌는 게 없다", () => {
  let erased = initialErased(60);
  for (const p of [2, 3, 5, 7]) erased = pressNumber(erased, p, 60).erased;
  assert.equal(remainingCount(erased, 60), 17);
  const eleven = pressNumber(erased, 11, 60);
  assert.deepEqual(eleven.fresh, []);
  assert.equal(remainingCount(eleven.erased, 60), 17);
});

test("smallestOpen — 지워지지 않았고 아직 안 누른 가장 작은 수", () => {
  let erased = initialErased(60);
  const picked = new Set<number>();
  assert.equal(smallestOpen(erased, picked, 60), 2);
  erased = pressNumber(erased, 2, 60).erased;
  picked.add(2);
  assert.equal(smallestOpen(erased, picked, 60), 3);
  for (const p of [3, 5, 7]) {
    erased = pressNumber(erased, p, 60).erased;
    picked.add(p);
  }
  assert.equal(smallestOpen(erased, picked, 60), 11);
  for (const p of [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59]) picked.add(p);
  assert.equal(smallestOpen(erased, picked, 60), null);
});

test("largestPress — 누르면 뭔가 지워지는 가장 큰 소수는 p×p ≤ n 인 것", () => {
  assert.equal(largestPress(60), 7);
  assert.equal(largestPress(100), 7);
  assert.equal(largestPress(121), 11);
  assert.equal(largestPress(3), null);
});

test("innerWrites — i*i 부터가 i*2 부터보다 적게 지운다(Python 으로 잰 값과 같다)", () => {
  assert.equal(innerWrites(60, "square"), 57);
  assert.equal(innerWrites(60, "double"), 66);
  assert.equal(innerWrites(1_000_000, "square"), 2_122_048);
  assert.equal(innerWrites(1_000_000, "double"), 2_197_839);
});

test("outerChecks — 바깥 반복은 √n 까지와 n 까지가 크게 다르다", () => {
  assert.equal(outerChecks(60, "sqrt"), 6);
  assert.equal(outerChecks(60, "n"), 59);
  assert.equal(outerChecks(1_000_000, "sqrt"), 999);
  assert.equal(outerChecks(1_000_000, "n"), 999_999);
});

test("sieveWithout01 — 0 과 1 을 처리하지 않으면 소수 목록에 0 과 1 이 끼어든다", () => {
  const bad = sieveWithout01(60);
  assert.equal(bad.length, 19);
  assert.deepEqual(bad.slice(0, 3), [0, 1, 2]);
});
