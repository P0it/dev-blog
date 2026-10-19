import type { CellState, Step, StageState, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * 에라토스테네스의 체 코드. `is_prime[k]` 가 True 인 수가 소수다.
 * 바깥 반복은 √n 까지만 돈다 — 8 이상의 합성수는 이미 더 작은 소수의 배수로 지워져 있다.
 * 안쪽 반복은 `i * i` 부터 시작한다 — `i * 2` ~ `i * (i - 1)` 은 더 작은 수가 이미 지웠다.
 */
export const SIEVE_CODE = [
  "def sieve(n):", // 1
  "    is_prime = [True] * (n + 1)", // 2
  "    is_prime[0] = is_prime[1] = False", // 3
  "    for i in range(2, int(n ** 0.5) + 1):", // 4
  "        if is_prime[i]:", // 5
  "            for j in range(i * i, n + 1, i):", // 6
  "                is_prime[j] = False", // 7
  "    return [k for k in range(n + 1) if is_prime[k]]", // 8
];

/** ① 해 보기와 ④ 플레이어가 같은 수 격자를 쓴다 — 1~60. 60 이하 소수는 17개다. */
export const SIEVE_N = 60;

/** `for i in range(2, int(n ** 0.5) + 1)` 의 마지막 i. */
const top = (n: number) => Math.floor(Math.sqrt(n));

/** n 이하 소수. 체와 같은 방법으로 구한다(테스트가 Python 이 낸 목록과 맞춘다). */
export function primesUpTo(n: number): number[] {
  const erased = initialErased(n);
  for (let i = 2; i <= top(n); i++) {
    if (erased[i]) continue;
    for (let j = i * i; j <= n; j += i) erased[j] = true;
  }
  const out: number[] = [];
  for (let m = 2; m <= n; m++) if (!erased[m]) out.push(m);
  return out;
}

/** p 의 배수 중 n 이하 — 자기 자신(p)은 뺀다. */
export function multiplesOf(p: number, n: number): number[] {
  const out: number[] = [];
  for (let m = 2 * p; m <= n; m += p) out.push(m);
  return out;
}

/** 처음 상태 — 0 과 1 은 소수가 아니라서 처음부터 지워져 있다. 인덱스가 곧 수다. */
export function initialErased(n: number): boolean[] {
  const erased = Array<boolean>(Math.max(n, 1) + 1).fill(false);
  erased[0] = true;
  erased[1] = true;
  return erased;
}

/** p 의 배수를 지운다. 새로 지운 수만 `fresh` 로 돌려주고, 받은 배열은 건드리지 않는다. */
export function pressNumber(erased: boolean[], p: number, n: number): { erased: boolean[]; fresh: number[] } {
  const next = [...erased];
  const fresh: number[] = [];
  for (const m of multiplesOf(p, n)) {
    if (next[m]) continue;
    next[m] = true;
    fresh.push(m);
  }
  return { erased: next, fresh };
}

/** 지워지지 않았고 아직 누르지 않은 가장 작은 수(2 이상). 없으면 null. */
export function smallestOpen(erased: boolean[], picked: Set<number>, n: number): number | null {
  for (let m = 2; m <= n; m++) if (!erased[m] && !picked.has(m)) return m;
  return null;
}

/** 2~n 중 지워지지 않고 남은 수의 개수. */
export function remainingCount(erased: boolean[], n: number): number {
  let c = 0;
  for (let m = 2; m <= n; m++) if (!erased[m]) c++;
  return c;
}

/** 누르면 뭔가 지워지는 가장 큰 소수 — p × p ≤ n 인 가장 큰 소수. 없으면 null. */
export function largestPress(n: number): number | null {
  let best: number | null = null;
  for (const p of primesUpTo(top(n))) if (p * p <= n) best = p;
  return best;
}

/** 안쪽 반복이 `is_prime[j] = False` 를 실행하는 횟수. 소수가 아닌 i 는 안쪽 반복이 없다. */
export function innerWrites(n: number, start: "square" | "double"): number {
  const erased = initialErased(n);
  let writes = 0;
  for (let i = 2; i <= top(n); i++) {
    if (erased[i]) continue;
    for (let j = start === "square" ? i * i : i * 2; j <= n; j += i) {
      erased[j] = true;
      writes++;
    }
  }
  return writes;
}

/** 바깥 반복이 도는 횟수 — `range(2, int(n ** 0.5) + 1)` 대 `range(2, n + 1)`. */
export function outerChecks(n: number, limit: "sqrt" | "n"): number {
  return Math.max(0, (limit === "sqrt" ? top(n) : n) - 1);
}

/** 3번 줄(0 과 1 을 False 로)을 빼먹은 체 — 소수 목록에 0 과 1 이 끼어든다. */
export function sieveWithout01(n: number): number[] {
  const erased = Array<boolean>(n + 1).fill(false);
  for (let i = 2; i <= top(n); i++) {
    if (erased[i]) continue;
    for (let j = i * i; j <= n; j += i) erased[j] = true;
  }
  const out: number[] = [];
  for (let m = 0; m <= n; m++) if (!erased[m]) out.push(m);
  return out;
}

type Snap = { i: number | null; j: number | null; erasedCount: number };

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. `지운 수` 는 `is_prime[2:]` 안의 False 개수다. */
function varsOf(s: Snap): Record<string, number> {
  const v: Record<string, number> = {};
  if (s.i !== null) v.i = s.i;
  if (s.j !== null) v.j = s.j;
  v["지운 수"] = s.erasedCount;
  return v;
}

function stageOf(
  n: number,
  erased: boolean[],
  extra: { i?: number; plan?: number[]; fresh?: number[]; done?: boolean } = {},
): StageState {
  const cells: CellState[] = [];
  for (let m = 1; m <= n; m++) {
    if (extra.done && !erased[m]) cells.push("settled");
    else if (m === extra.i) cells.push("current");
    else if (extra.fresh?.includes(m)) cells.push("compare");
    else cells.push(erased[m] ? "dropped" : "out");
  }
  return { cells, flags: {}, sieve: { n, erased: [...erased], ...extra } };
}

function* walk(n: number): Generator<Step> {
  const erased = initialErased(n);
  const snap: Snap = { i: null, j: null, erasedCount: 0 };
  const erasedCount = () => {
    let c = 0;
    for (let m = 2; m <= n; m++) if (erased[m]) c++;
    return c;
  };

  // 2번 줄 — 0 부터 n 까지 칸을 전부 True 로 둔다. 아직 지운 게 없다. 1 은 3번 줄에서 지워진다.
  const raw = [...erased];
  raw[0] = false;
  raw[1] = false;
  yield {
    line: 2,
    vars: varsOf(snap),
    stage: stageOf(n, raw),
    note: `0 부터 ${n} 까지 ${n + 1}칸을 모두 True(소수 후보)로 둡니다`,
  };
  yield {
    line: 3,
    vars: varsOf(snap),
    stage: stageOf(n, erased),
    note: "0 과 1 은 소수가 아니라서 False 로 바꿉니다. 1 이 처음부터 지워져 있는 까닭입니다",
  };

  for (let a = 2; a <= top(n); a++) {
    snap.i = a;
    snap.erasedCount = erasedCount();
    yield {
      line: 5,
      vars: varsOf(snap),
      stage: stageOf(n, erased, { i: a }),
      note: erased[a]
        ? `i 는 ${a}입니다. ${josa(a, "은", "는")} 이미 지워져 있어서 안쪽 반복을 건너뜁니다`
        : `i 는 ${a}입니다. ${josa(a, "은", "는")} 지워지지 않고 남아 있습니다`,
    };
    if (erased[a]) continue;

    const plan: number[] = [];
    for (let m = a * a; m <= n; m += a) plan.push(m);
    snap.j = a * a;
    yield {
      line: 6,
      vars: varsOf(snap),
      stage: stageOf(n, erased, { i: a, plan }),
      note: `${a}의 배수를 ${a * a}부터 ${a}칸씩 지웁니다. ${a * a}보다 작은 배수는 더 작은 수가 이미 지웠습니다`,
    };

    const fresh: number[] = [];
    for (const m of plan) {
      if (erased[m]) continue;
      erased[m] = true;
      fresh.push(m);
    }
    snap.j = plan[plan.length - 1];
    snap.erasedCount = erasedCount();
    yield {
      line: 7,
      vars: varsOf(snap),
      stage: stageOf(n, erased, { i: a, fresh }),
      note: `${a}의 배수를 지웠습니다. 새로 지운 수는 ${fresh.length}개입니다`,
    };
  }

  const left = remainingCount(erased, n);
  yield {
    line: SIEVE_CODE.length,
    vars: varsOf(snap),
    stage: stageOf(n, erased, { done: true }),
    note: `체가 끝났습니다. 남은 수 ${left}개가 소수입니다`,
    done: true,
  };
}

export function sieveTape(n: number): Tape {
  return buildTape(walk(n), SIEVE_CODE);
}
