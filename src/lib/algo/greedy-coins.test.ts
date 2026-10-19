import test from "node:test";
import assert from "node:assert/strict";
import {
  COIN_CODE,
  COIN_SET_A,
  COIN_SET_B,
  allowedCoin,
  bestCoins,
  coinSum,
  coinTape,
  greedyCoins,
  sortedDesc,
} from "./greedy-coins.ts";
import fixture from "./fixtures/greedy-coins.json" with { type: "json" };

// fixture 는 scripts/algo/trace_greedy_coins.py 가 실제 Python 을 settrace 로 돌려 만든다.
// 행 = [줄, amount, coin, given] — **그 줄을 실행한 뒤**의 상태다. `for coin` 머리(4번)는 스텝이 아니라 뺐다.

test("COIN_CODE — Python 코드와 한 글자도 다르지 않다", () => {
  assert.deepEqual(COIN_CODE, fixture.code);
});

test("Python 과 JS 가 같은 줄·amount·coin·given 시퀀스를 낸다", () => {
  for (const c of fixture.cases) {
    const t = coinTape(c.coins, c.amount);
    const mine = t.steps.map((s) => [s.line, s.vars.amount, s.vars.coin ?? null, s.stage.coins!.given]);
    assert.deepEqual(mine, c.trace, `케이스: ${c.name}`);
  }
});

test("세트 A 1260원 — 500 500 100 100 50 10, 6개이고 25스텝이다", () => {
  const t = coinTape(COIN_SET_A.coins, COIN_SET_A.amount);
  assert.equal(t.steps.length, 25);
  assert.equal(t.truncated, false);
  assert.deepEqual(greedyCoins(COIN_SET_A.coins, COIN_SET_A.amount), { given: [500, 500, 100, 100, 50, 10], left: 0 });
  assert.equal(t.steps.at(-1)!.done, true);
});

test("세트 B 6원 — 큰 동전부터 주면 3개(4 1 1), 모든 경우를 따지면 2개(3 3)다", () => {
  const t = coinTape(COIN_SET_B.coins, COIN_SET_B.amount);
  assert.equal(t.steps.length, 15);
  assert.deepEqual(greedyCoins(COIN_SET_B.coins, COIN_SET_B.amount).given, [4, 1, 1]);
  assert.deepEqual(bestCoins(COIN_SET_B.coins, COIN_SET_B.amount), [3, 3]);
  assert.equal(coinSum([4, 1, 1]), "4 + 1 + 1");
});

test("세트 A 는 큰 동전부터가 맞다 — 가장 적은 개수와 같다", () => {
  const g = greedyCoins(COIN_SET_A.coins, COIN_SET_A.amount).given;
  assert.equal(bestCoins(COIN_SET_A.coins, COIN_SET_A.amount)!.length, g.length);
});

test("allowedCoin — 줄 수 있는 동전 중 가장 큰 것, 없으면 null", () => {
  assert.equal(allowedCoin([1, 3, 4], 6), 4);
  assert.equal(allowedCoin([1, 3, 4], 2), 1);
  assert.equal(allowedCoin([5, 10], 3), null);
  assert.equal(allowedCoin([10, 50, 100, 500], 60), 50);
});

test("⑤ 확인 문제 — 1·5·12원으로 15원은 큰 동전부터 4개(12 1 1 1), 최적은 3개(5 5 5)다", () => {
  assert.deepEqual(greedyCoins([1, 5, 12], 15).given, [12, 1, 1, 1]);
  assert.deepEqual(bestCoins([1, 5, 12], 15), [5, 5, 5]);
});

test("⑥ 정렬하지 않으면 틀린다 — 세트 B 6원이 1원 여섯 개가 된다", () => {
  assert.equal(greedyCoins([1, 3, 4], 6, false).given.length, 6);
  assert.equal(greedyCoins([1, 3, 4], 6, true).given.length, 3);
});

test("⑥ 거슬러 줄 수 없는 경우 — 에러 없이 끝나고 남은 돈이 남는다, 최적은 null 이다", () => {
  assert.deepEqual(greedyCoins([5, 10], 12), { given: [10], left: 2 });
  assert.equal(bestCoins([5, 10], 12), null);
  const t = coinTape([5, 10], 12);
  const last = t.steps.at(-1)!;
  assert.equal(last.done, false);
  assert.match(last.note, /거슬러 주지 못했습니다/);
});

test("coinTape — 모든 스텝의 line 이 코드 범위 안이고 시작 스텝에는 쓴 동전이 없다", () => {
  const t = coinTape(COIN_SET_B.coins, COIN_SET_B.amount);
  for (const s of t.steps) assert.ok(s.line >= 1 && s.line <= COIN_CODE.length, `line ${s.line} 범위 밖`);
  assert.deepEqual(t.steps[0].stage.coins!.given, []);
  assert.deepEqual(t.steps[0].stage.coins!.values, [4, 3, 1]);
});

test("coinTape — 동전을 큰 것부터 늘어놓는다(원본은 건드리지 않는다)", () => {
  const input = [1, 3, 4];
  assert.deepEqual(sortedDesc(input), [4, 3, 1]);
  assert.deepEqual(input, [1, 3, 4]);
});

test("coinTape — 0원이나 동전이 없는 입력에서도 테이프가 생긴다", () => {
  assert.ok(coinTape([4, 3, 1], 0).steps.length >= 1);
  assert.ok(coinTape([], 5).steps.length >= 1);
});
