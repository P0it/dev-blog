import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/** 물건을 담을지 말지 **모든 경우**를 나열하는 코드. mask 의 비트 하나가 물건 하나다. */
export const PACK_CODE = [
  "def best_pack(weights, values, limit):", // 1
  "    n = len(weights)", // 2
  "    best = 0", // 3
  "    for mask in range(2 ** n):", // 4
  "        w = v = 0", // 5
  "        for i in range(n):", // 6
  "            if mask >> i & 1:", // 7
  "                w += weights[i]", // 8
  "                v += values[i]", // 9
  "        if w <= limit and v > best:", // 10
  "            best = v", // 11
  "    return best", // 12
];

/** 그림 한 장: 이 경우에 담은 물건은 settled, 지금 보는 물건에 i 깃발. */
function stage(weights: number[], mask: number | null, i: number | null) {
  const cells: CellState[] = weights.map((_, k) =>
    mask !== null && (mask >> k) & 1 ? "settled" : "out",
  );
  const flags: Record<string, number> = {};
  if (i !== null) flags.i = i;
  return { cells, flags, values: [...weights] };
}

type Vars = { n: number; best: number | null; mask: number | null; i: number | null; w: number | null; v: number | null };

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(s: Vars): Record<string, number> {
  const out: Record<string, number> = { n: s.n };
  if (s.best !== null) out.best = s.best;
  if (s.mask !== null) out.mask = s.mask;
  if (s.i !== null) out.i = s.i;
  if (s.w !== null) out.w = s.w;
  if (s.v !== null) out.v = s.v;
  return out;
}

function picked(mask: number, n: number): string {
  const names: number[] = [];
  for (let k = 0; k < n; k++) if ((mask >> k) & 1) names.push(k);
  return names.length ? `${names.join("·")}번 물건` : "아무것도 안 담음";
}

function* walk(weights: number[], values: number[], limit: number): Generator<Step> {
  const n = weights.length;
  const s: Vars = { n, best: null, mask: null, i: null, w: null, v: null };
  const total = 2 ** n;
  const at = (line: number, note: string, mask: number | null, i: number | null, done?: boolean): Step => ({
    line,
    vars: vars(s),
    stage: stage(weights, mask, i),
    note,
    ...(done === undefined ? {} : { done }),
  });

  yield at(2, `물건이 ${n}개입니다`, null, null);
  s.best = 0;
  yield at(3, "가장 좋은 값을 0 으로 시작합니다", null, null);

  for (let m = 0; m < total; m++) {
    s.mask = m;
    yield at(4, `${m + 1}번째 경우 / ${total}가지 — ${picked(m, n)}`, m, null);
    s.w = 0;
    s.v = 0;
    yield at(5, "무게와 값을 0 으로 비웁니다", m, null);

    for (let k = 0; k < n; k++) {
      s.i = k;
      yield at(6, `${k}번 물건을 볼 차례입니다`, m, k);
      const inIt = ((m >> k) & 1) === 1;
      yield at(7, inIt ? `이 경우에 ${k}번 물건이 들어 있습니다` : `이 경우에 ${k}번 물건은 없습니다`, m, k);
      if (inIt) {
        s.w = (s.w ?? 0) + weights[k];
        yield at(8, `무게에 ${weights[k]} 을 더합니다 → ${s.w}`, m, k);
        s.v = (s.v ?? 0) + values[k];
        yield at(9, `값에 ${values[k]} 을 더합니다 → ${s.v}`, m, k);
      }
    }
    yield at(6, `${picked(m, n)} 를 다 봤습니다`, m, null);

    const w = s.w ?? 0;
    const v = s.v ?? 0;
    const best = s.best ?? 0;
    const ok = w <= limit && v > best;
    yield at(
      10,
      w > limit ? `무게 ${w} 가 한도 ${limit} 을 넘습니다. 버립니다` : ok ? `무게 ${w} 는 한도 안이고 값 ${v} 가 최고 ${best} 보다 큽니다` : `한도 안이지만 값 ${v} 가 최고 ${best} 를 넘지 못합니다`,
      m,
      null,
    );
    if (ok) {
      s.best = v;
      yield at(11, `최고 값을 ${v} 로 바꿉니다`, m, null);
    }
  }

  yield at(4, "더 볼 경우가 없습니다", null, null);
  yield at(PACK_CODE.length, `${total}가지를 다 해 봤습니다. 가장 좋은 값은 ${s.best} 입니다`, null, null, true);
}

export function packTape(weights: number[], values: number[], limit: number): Tape {
  return buildTape(walk(weights, values, limit), PACK_CODE);
}

/** 테이프 없이 답만. 비교용·테스트용. */
export function bestPack(weights: number[], values: number[], limit: number): number {
  const n = weights.length;
  let best = 0;
  for (let mask = 0; mask < 2 ** n; mask++) {
    let w = 0;
    let v = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        w += weights[i];
        v += values[i];
      }
    }
    if (w <= limit && v > best) best = v;
  }
  return best;
}

// ── ① 자물쇠 ──

/** 세 자리 자물쇠의 비밀번호. 앞자리부터 0·2·6 이라 한 칸씩 훑어도 수십 번이면 열린다. */
export const LOCK_SECRET = [0, 2, 6];

/** 자물쇠 자릿수에 따른 경우의 수. */
export function lockCombos(digits: number): number {
  return 10 ** digits;
}

/** 경우의 수의 상용로그 — 시간 라벨(timeLabel)이 받는 값이다. */
export function lockLog10(digits: number): number {
  return digits;
}

/** 물건 n 개를 담을지 말지의 경우의 수. */
export function subsetCount(n: number): number {
  return 2 ** n;
}
