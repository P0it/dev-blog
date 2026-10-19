import type { CellState, StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * 물건을 담을지 말지 **모든 경우**를 나열하는 코드. mask 의 비트 하나가 물건 하나다.
 * 안쪽 반복은 한 줄(sum)로 접었다 — 8가지를 훑는 모습이 먼저 보이게 하려는 것이다.
 */
export const PACK_CODE = [
  "def best_pack(weights, values, limit):", // 1
  "    n = len(weights)", // 2
  "    best = 0", // 3
  "    for mask in range(2 ** n):", // 4
  "        w = sum(weights[i] for i in range(n) if mask >> i & 1)", // 5
  "        v = sum(values[i] for i in range(n) if mask >> i & 1)", // 6
  "        if w <= limit and v > best:", // 7
  "            best = v", // 8
  "    return best", // 9
];

/** 그림 한 장: 이 경우에 담은 물건은 settled. */
function stage(weights: number[], mask: number | null, table: NonNullable<StageState["table"]>): StageState {
  const cells: CellState[] = weights.map((_, k) =>
    mask !== null && (mask >> k) & 1 ? "settled" : "out",
  );
  return { cells, flags: {}, values: [...weights], table };
}

type Vars = { n: number; best: number | null; mask: number | null; w: number | null; v: number | null };

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(s: Vars): Record<string, number> {
  const out: Record<string, number> = { n: s.n };
  if (s.best !== null) out.best = s.best;
  if (s.mask !== null) out.mask = s.mask;
  if (s.w !== null) out.w = s.w;
  if (s.v !== null) out.v = s.v;
  return out;
}

function picked(mask: number, n: number): string {
  const names: number[] = [];
  for (let k = 0; k < n; k++) if ((mask >> k) & 1) names.push(k);
  return names.length ? `${names.join("·")}번 물건` : "아무것도 안 담음";
}

function pickedShort(mask: number, n: number): string {
  const names: number[] = [];
  for (let k = 0; k < n; k++) if ((mask >> k) & 1) names.push(k);
  return names.length ? names.join("·") : "없음";
}

const binary = (m: number, n: number) => m.toString(2).padStart(Math.max(n, 1), "0");

function sums(weights: number[], values: number[], mask: number) {
  let w = 0;
  let v = 0;
  for (let i = 0; i < weights.length; i++) {
    if ((mask >> i) & 1) {
      w += weights[i];
      v += values[i];
    }
  }
  return { w, v };
}

/**
 * 8가지 경우를 한 줄씩 적은 표. `cur` 줄까지는 끝났고 `cur` 줄은 `phase` 만큼 채워졌다.
 *  phase 0: mask 만, 1: 무게까지, 2: 값까지, 3: 한도 판정까지, 4: 최고 값을 바꾼 뒤
 */
export function packTable(
  weights: number[],
  values: number[],
  limit: number,
  cur: number | null,
  phase: number,
  bestMask: number | null,
): NonNullable<StageState["table"]> {
  const n = weights.length;
  const total = 2 ** n;
  const rows: NonNullable<StageState["table"]>["rows"] = [];
  for (let m = 0; m < total; m++) {
    const { w, v } = sums(weights, values, m);
    const over = w > limit;
    const finished = cur === null ? m < total : m < cur;
    const isCur = cur !== null && m === cur;
    const showW = finished || (isCur && phase >= 1);
    const showV = finished || (isCur && phase >= 2);
    const showVerdict = finished || (isCur && phase >= 3);
    const verdict = !showVerdict ? "·" : over ? "✘ 넘음" : m === bestMask ? "✔ 새 최고" : "✔ 최고는 아님";
    let state: "todo" | "current" | "done" | "best" | "over" = "todo";
    if (finished) state = m === bestMask ? "best" : over ? "over" : "done";
    else if (isCur) state = phase >= 4 ? "best" : "current";
    rows.push({
      cells: [`${m} = ${binary(m, n)}`, pickedShort(m, n), showW ? String(w) : "·", showV ? String(v) : "·", verdict],
      state,
    });
  }
  return { head: ["mask", "담은 물건", "무게", "값", `한도 ${limit} 안?`], rows };
}

function* walk(weights: number[], values: number[], limit: number): Generator<Step> {
  const n = weights.length;
  const s: Vars = { n, best: null, mask: null, w: null, v: null };
  const total = 2 ** n;
  let bestMask: number | null = null;
  let finishedAll = false; // 반복이 끝난 뒤에는 모든 줄이 끝난 줄이다
  const at = (line: number, note: string, mask: number | null, phase: number, done?: boolean): Step => ({
    line,
    vars: vars(s),
    stage: stage(weights, mask, packTable(weights, values, limit, mask ?? (finishedAll ? null : -1), phase, bestMask)),
    note,
    ...(done === undefined ? {} : { done }),
  });

  yield at(2, `물건이 ${n}개입니다`, null, 0);
  s.best = 0;
  yield at(3, "가장 좋은 값은 0 에서 시작합니다", null, 0);

  for (let m = 0; m < total; m++) {
    s.mask = m;
    yield at(4, `${m + 1}번째 경우 / ${total}가지 — mask ${m} = ${binary(m, n)}, ${picked(m, n)}`, m, 0);
    const { w, v } = sums(weights, values, m);
    s.w = w;
    yield at(5, `담은 물건의 무게를 더합니다 → ${w}`, m, 1);
    s.v = v;
    yield at(6, `담은 물건의 값을 더합니다 → ${v}`, m, 2);

    const best = s.best ?? 0;
    const ok = w <= limit && v > best;
    yield at(
      7,
      w > limit
        ? `무게 ${josa(w, "이", "가")} 한도 ${josa(limit, "을", "를")} 넘습니다. 버립니다`
        : ok
          ? `무게 ${josa(w, "은", "는")} 한도 안입니다. 값 ${josa(v, "이", "가")} 최고 ${best}보다 큽니다`
          : `한도 안이지만 값 ${josa(v, "이", "가")} 최고 ${josa(best, "을", "를")} 넘지 못합니다`,
      m,
      3,
    );
    if (ok) {
      s.best = v;
      bestMask = m;
      yield at(8, `최고 값을 바꿉니다 → ${v}`, m, 4);
    }
  }

  finishedAll = true;
  yield at(4, "더 볼 경우가 없습니다", null, 0);
  yield at(PACK_CODE.length, `${total}가지를 다 해 봤습니다. 가장 좋은 값은 ${s.best} 입니다`, null, 0, true);
}

export function packTape(weights: number[], values: number[], limit: number): Tape {
  return buildTape(walk(weights, values, limit), PACK_CODE);
}

/** 플레이어 앞에 정적으로 보여 줄 8가지 표(아직 아무것도 안 훑은 상태). */
export function emptyPackTable(weights: number[], values: number[], limit: number) {
  return packTable(weights, values, limit, -1, 0, null);
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

/** 세 자리 자물쇠의 비밀번호. 한 칸씩 훑으면 앞쪽에서는 거의 안 열리는 쪽에 둔다. */
export const LOCK_SECRET = [9, 7, 3];

/** 자물쇠 자릿수에 따른 경우의 수. */
export function lockCombos(digits: number): number {
  return 10 ** digits;
}

/** 경우의 수의 상용로그. */
export function lockLog10(digits: number): number {
  return digits;
}

/** 물건 n 개를 담을지 말지의 경우의 수. */
export function subsetCount(n: number): number {
  return 2 ** n;
}

/** 경우마다 물건 수만큼 더 보므로 실제 일의 양은 n × 2^n 이다. */
export function subsetWork(n: number): number {
  return n * 2 ** n;
}

/** 파이썬은 1초에 1천만~3천만 번쯤 한다. 시간은 보수적으로 1천만 번으로 잡는다. */
export const PY_OPS_PER_SEC = 10_000_000;

/** 걸리는 시간(초)을 사람 말로. 우주 나이(약 138억 년)를 넘으면 그렇게 말한다. */
export function secondsLabel(sec: number): string {
  if (sec <= 1) return "1초 안";
  if (sec < 60) return `${Math.round(sec)}초`;
  if (sec < 3600) return `${Math.round(sec / 60)}분`;
  if (sec < 86400) return `${Math.round(sec / 3600)}시간`;
  if (sec < 86400 * 365) return `${Math.round(sec / 86400)}일`;
  const years = sec / (86400 * 365);
  if (years > 1.38e10) return "우주 나이보다 길다";
  return `${Math.round(years).toLocaleString("ko-KR")}년`;
}

/** 자물쇠 번호 하나. [9,7,3] → "973" */
export function lockKey(dials: number[]): string {
  return dials.join("");
}
