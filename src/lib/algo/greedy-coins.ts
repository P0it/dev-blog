import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * `for coin in coins` 줄(4번)은 스텝으로 올리지 않는다. 그 줄이 하는 일(coin 배정)은 바로 뒤 5번 줄의 상태에
 * 이미 들어 있고, 올리면 동전이 바뀔 때마다 스텝이 하나씩 늘기만 한다. 동전 이름 뒤에는 늘 "원"이 붙어
 * 받침이 정해져 있어서(…원은·…원을) 조사는 josa() 없이 쓴다.
 */
export const COIN_CODE = [
  "def greedy_coins(coins, amount):", // 1
  "    coins = sorted(coins, reverse=True)", // 2
  "    given = []", // 3
  "    for coin in coins:", // 4
  "        while amount >= coin:", // 5
  "            amount -= coin", // 6
  "            given.append(coin)", // 7
  "    return given", // 8
];

export type CoinSet = { key: "A" | "B"; coins: number[]; amount: number };

/** 세트 A — 큰 동전이 작은 동전의 배수라 큰 동전부터 주면 맞다. ① 해 보기와 ④ 플레이어가 같이 쓴다. */
export const COIN_SET_A: CoinSet = { key: "A", coins: [10, 50, 100, 500], amount: 1260 };
/** 세트 B — 4 가 3 의 배수가 아니라 큰 동전부터 주면 틀린다. */
export const COIN_SET_B: CoinSet = { key: "B", coins: [1, 3, 4], amount: 6 };

/** 큰 동전부터 내림차순. 원본은 건드리지 않는다. */
export function sortedDesc(coins: number[]): number[] {
  return [...coins].sort((a, b) => b - a);
}

/** 지금 줄 수 있는 동전 중 가장 큰 것. 줄 수 있는 동전이 없으면 null. ① 의 허용 동작 = 알고리즘의 동작. */
export function allowedCoin(coins: number[], remaining: number): number | null {
  const ok = sortedDesc(coins).find((c) => c <= remaining);
  return ok === undefined ? null : ok;
}

/** 큰 동전부터 주는 방법의 결과. `left` 가 0 이 아니면 다 거슬러 주지 못한 것이다. */
export function greedyCoins(coins: number[], amount: number, sort = true): { given: number[]; left: number } {
  const order = sort ? sortedDesc(coins) : [...coins];
  const given: number[] = [];
  let left = amount;
  for (const c of order) {
    while (left >= c) {
      left -= c;
      given.push(c);
    }
  }
  return { given, left };
}

/** 모든 경우를 따져 가장 적은 개수로 거슬러 준 동전들(DP). 거슬러 줄 수 없으면 null. */
export function bestCoins(coins: number[], amount: number): number[] | null {
  const INF = Number.POSITIVE_INFINITY;
  const dp: number[] = [0, ...Array<number>(amount).fill(INF)];
  const pick: number[] = Array<number>(amount + 1).fill(0);
  for (let a = 1; a <= amount; a++) {
    for (const c of sortedDesc(coins)) {
      if (c <= a && dp[a - c] + 1 < dp[a]) {
        dp[a] = dp[a - c] + 1;
        pick[a] = c;
      }
    }
  }
  if (dp[amount] === INF) return null;
  const out: number[] = [];
  for (let a = amount; a > 0; a -= pick[a]) out.push(pick[a]);
  return out;
}

/** 동전을 `4 + 1 + 1` 꼴로. */
export function coinSum(given: number[]): string {
  return given.join(" + ");
}

/** 동전 줄에서 지금 보는 동전은 current, 이미 끝낸 동전은 settled, 아직 안 본 동전은 out. */
function stage(values: number[], at: number | null, given: number[], left: number) {
  const cells: CellState[] = values.map((_, k) => {
    if (at === null) return "out";
    if (k < at) return "settled";
    if (k === at) return "current";
    return "out";
  });
  return { cells, flags: {}, values, coins: { values, at, given: [...given], left } };
}

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(amount: number, coin: number | null) {
  const v: Record<string, number> = { amount };
  if (coin !== null) v.coin = coin;
  return v;
}

function* walk(input: number[], amount0: number): Generator<Step> {
  const values = sortedDesc(input);
  const given: number[] = [];
  let amount = amount0;
  let coin: number | null = null;

  yield {
    line: 2,
    vars: vars(amount, null),
    stage: stage(values, null, given, amount),
    note: values.length === 0 ? "동전이 하나도 없습니다" : `동전을 큰 것부터 늘어놓습니다 — ${values.join("원 ")}원`,
  };
  yield {
    line: 3,
    vars: vars(amount, null),
    stage: stage(values, null, given, amount),
    note: "낸 동전을 담을 바구니를 비워 둡니다",
  };

  for (let k = 0; k < values.length; k++) {
    coin = values[k];
    while (true) {
      const can = amount >= coin;
      yield {
        line: 5,
        vars: vars(amount, coin),
        stage: stage(values, k, given, amount),
        note: can
          ? `남은 ${amount}원에 ${coin}원을 낼 수 있습니다`
          : amount === 0
            ? `남은 돈이 0원이라 ${coin}원을 낼 일이 없습니다`
            : `${coin}원은 남은 ${amount}원보다 큽니다. 다음 동전으로 넘어갑니다`,
      };
      if (!can) break;
      amount -= coin;
      yield {
        line: 6,
        vars: vars(amount, coin),
        stage: stage(values, k, given, amount),
        note: `${coin}원을 빼서 남은 돈이 ${amount}원이 됩니다`,
      };
      given.push(coin);
      yield {
        line: 7,
        vars: vars(amount, coin),
        stage: stage(values, k, given, amount),
        note: `${coin}원을 바구니에 담습니다. 지금 ${given.length}개입니다`,
      };
    }
  }

  yield {
    line: COIN_CODE.length,
    vars: vars(amount, coin),
    stage: stage(values, values.length === 0 ? null : values.length - 1, given, amount),
    note:
      amount === 0
        ? `${amount0}원을 모두 ${given.length}개로 거슬러 줬습니다: ${coinSum(given)}`
        : `${given.length}개를 줬지만 남은 ${amount}원은 거슬러 주지 못했습니다`,
    done: amount === 0,
  };
}

export function coinTape(coins: number[], amount: number): Tape {
  return buildTape(walk(coins, amount), COIN_CODE);
}
