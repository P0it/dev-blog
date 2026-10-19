import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * ① 해 보기와 ④ 플레이어가 함께 쓰는 입력. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다.
 * 바나나 더미 넷을 8시간 안에 다 먹는다. 한 시간에 한 더미만 먹고, 남아도 그 시간은 끝난다.
 */
export const PILES = [3, 6, 7, 11];
export const LIMIT_HOURS = 8;

/** 화면에 보여 주는 Python 코드. 아래 제너레이터가 이 줄 번호를 따라간다. 6번 줄은 빈 줄이다. */
export const PARAM_CODE = [
  "def can_finish(piles, speed, h):", // 1
  "    hours = 0", // 2
  "    for p in piles:", // 3
  "        hours += (p + speed - 1) // speed", // 4
  "    return hours <= h", // 5
  "", // 6
  "def min_speed(piles, h):", // 7
  "    lo, hi = 1, max(piles)", // 8
  "    while lo < hi:", // 9
  "        mid = (lo + hi) // 2", // 10
  "        if can_finish(piles, mid, h):", // 11
  "            hi = mid", // 12
  "        else:", // 13
  "            lo = mid + 1", // 14
  "    return lo", // 15
];

// ── 시간 계산 ──

/** 속도 speed 로 더미마다 걸리는 시간. 남아도 그 시간은 끝나니 올림이다. */
export function pileHours(piles: number[], speed: number): number[] {
  return piles.map((p) => Math.ceil(p / speed));
}

export function hoursFor(piles: number[], speed: number): number {
  return pileHours(piles, speed).reduce((a, b) => a + b, 0);
}

export function canFinish(piles: number[], speed: number, h: number): boolean {
  return hoursFor(piles, speed) <= h;
}

/** 제한 시간 안에 다 먹는 가장 느린 속도. 가장 큰 더미 하나가 한 시간이면 되는 속도(max)가 상한이다. */
export function minSpeed(piles: number[], h: number): number {
  let lo = 1;
  let hi = Math.max(...piles);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (canFinish(piles, mid, h)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

// ── ④ 플레이어 ──

/**
 * 칸 하나가 속도 하나다(칸 i 는 속도 i+1).
 *  - lo 보다 느린 속도: 안 되는 것으로 확정(dropped)
 *  - hi 보다 빠른 속도: 되는 것으로 확정(settled)
 *  - mid: 지금 시험하는 속도(current)
 */
function stage(len: number, lo: number, hi: number, mid: number | null, end = false) {
  const cells: CellState[] = [];
  for (let i = 0; i < len; i++) {
    const speed = i + 1;
    if (end && speed === lo) cells.push("current");
    else if (speed < lo) cells.push("dropped");
    else if (speed > hi) cells.push("settled");
    else if (mid !== null && speed === mid) cells.push("current");
    else cells.push("out");
  }
  const flags: Record<string, number> = { lo: lo - 1, hi: hi - 1 };
  if (mid !== null) flags.mid = mid - 1;
  return { cells, flags };
}

/**
 * Python 과 스텝이 한 줄씩 맞물리게 흘린다.
 *
 *  - `can_finish` 안(2~5번 줄)은 **한 스텝으로 묶는다**. 11번 줄 스텝이 그 호출 전체이고 `hours` 가 거기서 정해진다
 *  - `while` 조건이 실패하는 순간도 한 스텝이다. 그 뒤에 `return lo` 가 온다
 *  - `else:` 줄은 Python 에서 줄 이벤트가 없다. 가지가 갈리면 바로 `lo = mid + 1`(14번 줄)로 간다
 *  - `mid`·`hours` 는 한 번 정해지면 다음 값이 정해질 때까지 변수로 남는다
 */
function* walk(piles: number[], h: number): Generator<Step> {
  const len = Math.max(...piles);
  let lo = 1;
  let hi = len;
  let mid: number | null = null;
  let hours: number | null = null;

  const vars = (): Record<string, number> => {
    const v: Record<string, number> = { lo, hi };
    if (mid !== null) v.mid = mid;
    if (hours !== null) v.hours = hours;
    return v;
  };

  yield {
    line: 8,
    vars: vars(),
    stage: stage(len, lo, hi, mid),
    note: `속도 후보는 1부터 ${hi}까지입니다. 가장 큰 더미가 ${hi}개라 그보다 빠를 필요는 없습니다`,
  };

  while (true) {
    const goes = lo < hi;
    yield {
      line: 9,
      vars: vars(),
      stage: stage(len, lo, hi, mid),
      note: goes ? "후보가 둘 이상 남았습니다" : `lo 와 hi 가 만났습니다. 가장 느린 속도는 ${lo}입니다`,
    };
    if (!goes) break;

    mid = (lo + hi) >> 1;
    yield {
      line: 10,
      vars: vars(),
      stage: stage(len, lo, hi, mid),
      note: `가운데 속도 ${josa(mid, "을", "를")} 시험합니다`,
    };

    // can_finish 호출 전체를 한 스텝으로 — 더미마다 시간을 구해 더한다
    const per = pileHours(piles, mid);
    hours = per.reduce((a, b) => a + b, 0);
    const ok = hours <= h;
    yield {
      line: 11,
      vars: vars(),
      stage: stage(len, lo, hi, mid),
      note: `속도가 ${mid}일 때 ${per.join(" + ")} = ${hours}시간. ${ok ? `${h}시간 이하라 됩니다` : `${h}시간을 넘어 안 됩니다`}`,
    };

    if (ok) {
      hi = mid;
      yield {
        line: 12,
        vars: vars(),
        stage: stage(len, lo, hi, mid),
        note: `됐으니 ${mid} 도 답일 수 있습니다. 버리지 않고 hi 를 ${hi} 에 둡니다`,
      };
    } else {
      lo = mid + 1;
      yield {
        line: 14,
        vars: vars(),
        stage: stage(len, lo, hi, mid),
        note: `안 되니 ${mid} 이하는 전부 안 됩니다. lo 를 ${lo} 에 둡니다`,
      };
    }
  }

  yield {
    line: PARAM_CODE.length,
    vars: vars(),
    stage: stage(len, lo, hi, mid, true),
    note: `${h}시간 안에 먹을 수 있는 가장 느린 속도는 ${lo}입니다`,
    done: true,
  };
}

export function paramTape(piles: number[], h: number): Tape {
  return buildTape(walk(piles, h), PARAM_CODE);
}

// ── ① 속도 골라 보기 ──

/** 시도한 속도 → 8시간 안에 되었는지 */
export type Tried = Record<number, boolean>;

export type SpeedStatus = { ok: boolean; direct: boolean };

/**
 * 한 속도의 상태. 직접 해 본 것(`direct`)이거나, 해 보지 않아도 아는 것이다.
 *  - 되는 속도보다 빠른 속도는 해 보지 않아도 된다(더 빠르면 시간이 늘 리 없다)
 *  - 안 되는 속도보다 느린 속도는 해 보지 않아도 안 된다
 */
export function speedStatus(tried: Tried, speed: number): SpeedStatus | null {
  if (tried[speed] !== undefined) return { ok: tried[speed], direct: true };
  for (const [k, ok] of Object.entries(tried)) {
    const t = Number(k);
    if (ok && t < speed) return { ok: true, direct: false };
    if (!ok && t > speed) return { ok: false, direct: false };
  }
  return null;
}

/** 되는 속도를 직접 해 봤고 바로 아래가 안 되는 걸 아는 속도(= 가장 느린 속도). 아직이면 null. */
export function boundaryFound(tried: Tried): number | null {
  const oks = Object.entries(tried)
    .filter(([, ok]) => ok)
    .map(([k]) => Number(k))
    .sort((a, b) => a - b);
  for (const s of oks) {
    if (s === 1) return 1;
    if (speedStatus(tried, s - 1)?.ok === false) return s;
  }
  return null;
}

/** 아직 모르는 속도 범위 [from, to]. 비었으면 from > to. */
export function remainingRange(tried: Tried, max: number): [number, number] {
  let lowFail = 0;
  let highOk = max + 1;
  for (const [k, ok] of Object.entries(tried)) {
    const t = Number(k);
    if (ok) highOk = Math.min(highOk, t);
    else lowFail = Math.max(lowFail, t);
  }
  return [lowFail + 1, highOk - 1];
}

/** 한 번 해 본 결과 한 줄. 더미마다 걸린 시간과 합. */
export function trialMessage(piles: number[], speed: number, h: number): string {
  const per = pileHours(piles, speed);
  const total = per.reduce((a, b) => a + b, 0);
  const parts = piles.map((p, i) => `${p}→${per[i]}시간`).join(" + ");
  return `속도가 ${speed}일 때 ${parts} = ${total}시간. ${total <= h ? `${h}시간 안에 됩니다` : `${h}시간 안에 안 됩니다`}`;
}

/** 해 본 뒤 다음에 어디를 볼지. 안 되는 쪽도, 되는 쪽도 한쪽이 통째로 사라진다는 걸 말한다. */
export function trialHint(tried: Tried, speed: number, max: number): string {
  const ok = tried[speed];
  const [from, to] = remainingRange(tried, max);
  const left =
    from > to
      ? "더 해 볼 속도가 없습니다."
      : from === to
        ? `이제 ${from}만 남았습니다.`
        : `이제 ${from}~${to} 만 남았습니다.`;
  return ok
    ? `되니까 ${speed}보다 빠른 속도는 해 볼 필요가 없습니다. ${left}`
    : `안 되니까 ${speed}보다 느린 속도는 해 볼 필요가 없습니다. ${left}`;
}

/** 해 보지 않아도 되는 속도를 눌렀을 때 이유. */
export function skipMessage(tried: Tried, speed: number): string {
  const st = speedStatus(tried, speed);
  if (!st) return "";
  if (st.ok) {
    const base = Object.entries(tried)
      .filter(([k, ok]) => ok && Number(k) < speed)
      .map(([k]) => Number(k))
      .sort((a, b) => b - a)[0];
    return `속도가 ${base}일 때 되니, 더 빠른 ${josa(speed, "은", "는")} 해 볼 필요 없이 됩니다`;
  }
  const base = Object.entries(tried)
    .filter(([k, ok]) => !ok && Number(k) > speed)
    .map(([k]) => Number(k))
    .sort((a, b) => a - b)[0];
  return `속도가 ${base}일 때 안 되니, 더 느린 ${josa(speed, "은", "는")} 해 볼 필요 없이 안 됩니다`;
}
