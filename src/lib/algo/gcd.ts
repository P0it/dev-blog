import type { StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * 최대공약수(유클리드 호제법). 한 번 도는 일(`a, b = b, a % b`)이 그림으로는 "남은 바닥에 가장 큰 정사각형을
 * 몫만큼 깔고 나머지 바닥만 남기는" 한 줄이다. 그래서 ① 해 보기와 ④ 플레이어가 같은 바닥(48×18)을 쓴다.
 */
export const GCD_CODE = [
  "def gcd(a, b):", // 1
  "    while b:", // 2
  "        a, b = b, a % b", // 3
  "    return a", // 4
];

export function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

/** 최소공배수. 0 이 있으면 0. */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return (a / gcd(a, b)) * b;
}

/** 나머지가 0 이 될 때까지 몇 번 도는지. */
export function euclidCount(a: number, b: number): number {
  let n = 0;
  while (b) {
    [a, b] = [b, a % b];
    n++;
  }
  return n;
}

// ── 타일 바닥 배치 ──

export type Square = { x: number; y: number; s: number; k: number };
export type Region = { x: number; y: number; w: number; h: number };
/** 유클리드 한 번 도는 일. `q` = 몫(깐 정사각형 수), `squares` = 이 반복에서 깐 정사각형, `region` = 남은 바닥. */
export type Round = { k: number; a: number; b: number; q: number; squares: Square[]; region: Region | null };

/**
 * `a0`·`b0` 로 시작하는 유클리드 반복마다 정사각형을 어떻게 까는지 미리 계산한다.
 * 바닥은 긴 변 `w` × 짧은 변 `h` 다. 한 번 돌 때 짧은 변 크기 정사각형을 긴 변 방향으로 `q` 개 깔고,
 * 남은 바닥(긴 변과 짧은 변이 바뀔 수 있다)이 다음 반복의 바닥이 된다. 작은 수가 앞이면 첫 반복은 몫이 0 이라 자리만 바뀐다.
 */
export function layout(a0: number, b0: number): { w: number; h: number; rounds: Round[] } {
  const w = Math.max(a0, b0);
  const h = Math.min(a0, b0);
  let region: Region | null = h > 0 ? { x: 0, y: 0, w, h } : null;
  const rounds: Round[] = [];
  let a = a0;
  let b = b0;
  let k = 0;
  while (b) {
    k++;
    const q = Math.floor(a / b);
    const squares: Square[] = [];
    if (q > 0 && region) {
      const s = b;
      const horizontal = region.w >= region.h;
      for (let i = 0; i < q; i++) {
        squares.push(horizontal ? { x: region.x + i * s, y: region.y, s, k } : { x: region.x, y: region.y + i * s, s, k });
      }
      const next: Region = horizontal
        ? { ...region, x: region.x + q * s, w: region.w - q * s }
        : { ...region, y: region.y + q * s, h: region.h - q * s };
      region = next.w === 0 || next.h === 0 ? null : next;
    }
    rounds.push({ k, a, b, q, squares, region });
    [a, b] = [b, a % b];
  }
  return { w, h, rounds };
}

/** `done` 번 돈 뒤의 무대. `isNow` 면 방금 깐 반복의 정사각형을 켠다. */
function tilesStage(L: ReturnType<typeof layout>, done: number, isNow: boolean): StageState {
  const placed = L.rounds.slice(0, done);
  const region = done === 0 ? (L.h > 0 ? { x: 0, y: 0, w: L.w, h: L.h } : null) : placed[done - 1].region;
  return {
    cells: [],
    flags: {},
    tiles: {
      w: L.w,
      h: L.h,
      squares: placed.flatMap((r) => r.squares),
      region,
      now: isNow && done > 0 ? placed[done - 1].k : 0,
    },
  };
}

function* walk(a0: number, b0: number): Generator<Step> {
  const L = layout(a0, b0);
  let a = a0;
  let b = b0;
  let done = 0;

  yield {
    line: 2,
    vars: { a, b },
    stage: tilesStage(L, 0, false),
    note: b === 0 ? "b 가 0 입니다. 반복하지 않고 끝냅니다" : `b = ${b} — 0 이 아니라서 반복합니다`,
  };

  while (b) {
    const [oa, ob] = [a, b];
    const round = L.rounds[done];
    done++;
    [a, b] = [b, a % b];
    const rest = round.region ? `남은 바닥은 ${round.region.w}×${round.region.h} 입니다` : "남은 바닥이 없습니다";
    const tail =
      round.q > 0
        ? `한 변 ${ob} 짜리 정사각형 ${round.q}개를 깔면 ${rest}`
        : `${josa(oa, "이", "가")} ${ob} 보다 작아서 정사각형은 못 깔고 자리만 바뀝니다`;
    yield {
      line: 3,
      vars: { a, b },
      stage: tilesStage(L, done, true),
      note: `${josa(oa, "을", "를")} ${josa(ob, "으로", "로")} 나눈 나머지는 ${b} 입니다. 그래서 a = ${a}, b = ${b}. ${tail}`,
    };
    yield {
      line: 2,
      vars: { a, b },
      stage: tilesStage(L, done, false),
      note: b === 0 ? "b 가 0 이 됐습니다. 반복을 끝냅니다" : `b = ${b} — 아직 0 이 아닙니다`,
    };
  }

  yield {
    line: 4,
    vars: { a, b },
    stage: tilesStage(L, done, false),
    note: a === 0 ? "둘 다 0 이라 최대공약수는 0 입니다" : `최대공약수는 ${a} 입니다`,
    done: true,
  };
}

export function gcdTape(a: number, b: number): Tape {
  return buildTape(walk(a, b), GCD_CODE);
}

// ── ① 직접 해 보기 ──

/** ① 해 보기와 ④ 플레이어가 같이 쓰는 바닥 — 48×18. */
export const HAND = { a: 48, b: 18 };

/** 예상 선택지. 정답(6)은 세 번째 — 3 은 공통 약수이긴 하지만 가장 크지 않고, 9 는 48 을 나누지 못한다. */
export const PREDICT_OPTIONS: { value: number; label: string; correct: boolean }[] = [
  { value: 3, label: "한 변 3", correct: false },
  { value: 9, label: "한 변 9", correct: false },
  { value: 6, label: "한 변 6", correct: true },
];

export type HandOption = { label: string; correct: boolean; reason: string };
export type HandRow = {
  /** 이 줄을 깔기 전의 남은 바닥 */
  region: Region;
  /** 정답 정사각형의 한 변과 개수 */
  s: number;
  n: number;
  options: HandOption[];
};

/**
 * ① 해 보기의 줄들. 줄마다 "지금 남은 바닥을 채울 수 있는 가장 큰 정사각형" 한 종류와 개수를 고른다.
 * 정답 위치가 줄마다 돈다(첫째 → 셋째 → 둘째) — 위치로 찍을 수 없게 한다.
 */
export function handRows(): HandRow[] {
  const L = layout(HAND.a, HAND.b);
  let before: Region = { x: 0, y: 0, w: L.w, h: L.h };
  const rows: HandRow[] = [];
  for (const round of L.rounds) {
    if (round.q === 0) continue;
    const s = round.squares[0].s;
    const n = round.q;
    const long = Math.max(before.w, before.h);
    const short = Math.min(before.w, before.h);
    const right: HandOption = {
      label: `한 변 ${s} 짜리 ${n}개`,
      correct: true,
      reason: `한 변 ${s} 짜리가 이 바닥에 들어가는 가장 큰 정사각형입니다`,
    };
    const tooMany: HandOption = {
      label: `한 변 ${s} 짜리 ${n + 1}개`,
      correct: false,
      reason: `${s} × ${n + 1} = ${josa(s * (n + 1), "이라서", "라서")} 긴 변 ${josa(long, "을", "를")} 넘어요`,
    };
    const tooBig: HandOption = {
      label: `한 변 ${long} 짜리 1개`,
      correct: false,
      reason: `짧은 변이 ${josa(short, "이라서", "라서")} 한 변 ${long} 짜리는 들어가지 않아요`,
    };
    const i = rows.length;
    const order = [
      [right, tooMany, tooBig],
      [tooMany, tooBig, right],
      [tooBig, right, tooMany],
    ][i % 3];
    rows.push({ region: before, s, n, options: order });
    if (round.region) before = round.region;
  }
  return rows;
}

// ── ④ 플레이어의 예측 관문 ──

export type PauseSpec = {
  /** 이 스텝으로 넘어가기 전에 묻는다 */
  at: number;
  /** 묻는 순간의 a, b */
  a: number;
  b: number;
  right: [number, number];
  wrongs: [number, number][];
};

/** 두 번째 `a, b = b, a % b` 앞에서 "다음 a, b 는?"을 묻는다. 반복이 두 번 미만이면 null. */
export function pauseSpec(tape: Tape): PauseSpec | null {
  const idx = tape.steps.map((s, i) => (s.line === 3 ? i : -1)).filter((i) => i >= 0);
  if (idx.length < 2) return null;
  const at = idx[1];
  const { a, b } = tape.steps[at - 1].vars;
  const right: [number, number] = [b, a % b];
  const w1: [number, number] = [a % b, b];
  let w2: [number, number] = [b, Math.floor(a / b)];
  if (w2[0] === right[0] && w2[1] === right[1]) w2 = [b + 1, a % b];
  return { at, a, b, right, wrongs: [w1, w2] };
}
