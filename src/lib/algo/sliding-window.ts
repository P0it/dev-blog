import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/** ①과 ④가 같이 쓰는 입력 — 열흘 동안의 기온과 창 크기. */
export const TEMPS = [3, 5, 2, 8, 6, 9, 1, 4, 7, 2];
export const WINDOW_K = 3;

/**
 * 길이 k 인 창을 오른쪽으로 한 칸씩 밀며 합을 이어 간다.
 * 처음 한 번만 k 칸을 다 더하고, 그 뒤로는 나가는 값 하나를 빼고 들어오는 값 하나를 더한다.
 */
export const WINDOW_CODE = [
  "def max_window_sum(arr, k):", // 1
  "    n = len(arr)", // 2
  "    window = sum(arr[:k])", // 3
  "    best = window", // 4
  "    for i in range(k, n):", // 5
  "        window += arr[i] - arr[i - k]", // 6
  "        best = max(best, window)", // 7
  "    return best", // 8
];

type Range = { lo: number; hi: number }; // [lo, hi) 반열린 구간

/**
 * 그림 한 장. `win` 안은 current, 나간 칸은 dropped, 들어올 칸은 compare,
 * 가장 좋은 창은 settled. 깃발 i 는 새로 들어오는 칸이다.
 */
function stage(
  values: number[],
  win: Range | null,
  opts: { incoming?: number | null; outgoing?: number | null; best?: Range | null; flag?: number | null } = {},
) {
  const n = values.length;
  const cells: CellState[] = values.map((_, k) => {
    if (opts.best && k >= opts.best.lo && k < opts.best.hi) return "settled";
    if (k === opts.incoming) return "compare";
    if (k === opts.outgoing) return "dropped";
    if (win && k >= win.lo && k < win.hi) return "current";
    return "out";
  });
  const flags: Record<string, number> = {};
  if (opts.flag !== null && opts.flag !== undefined && opts.flag < n) flags.i = opts.flag;
  return { cells, flags, values: [...values] };
}

type Vars = { n: number; window: number | null; best: number | null; i: number | null };

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(s: Vars): Record<string, number> {
  const out: Record<string, number> = { n: s.n };
  if (s.window !== null) out.window = s.window;
  if (s.best !== null) out.best = s.best;
  if (s.i !== null) out.i = s.i;
  return out;
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

function* walk(input: number[], k: number): Generator<Step> {
  if (!(k >= 1)) throw new RangeError("창 크기 k 는 1 이상이어야 한다");
  const arr = [...input];
  const n = arr.length;
  const s: Vars = { n, window: null, best: null, i: null };
  const at = (line: number, note: string, win: Range | null, opts: Parameters<typeof stage>[2] = {}, done?: boolean): Step => ({
    line,
    vars: vars(s),
    stage: stage(arr, win, opts),
    note,
    ...(done === undefined ? {} : { done }),
  });

  yield at(2, `칸이 ${josa(n, "", "")}개입니다`, null);

  // 파이썬의 arr[:k] 는 칸 수보다 k 가 커도 에러 없이 전체를 돌려준다
  const first: Range = { lo: 0, hi: Math.min(k, n) };
  s.window = sum(arr.slice(0, k));
  yield at(
    3,
    k > n ? `창이 칸 수보다 큽니다. 전부 더해 ${s.window} 입니다` : `처음 ${josa(k, "", "")}칸은 직접 더합니다 → ${s.window}`,
    first,
  );

  s.best = s.window;
  let bestRange: Range = first;
  yield at(4, `지금까지 가장 큰 합은 ${s.window} 입니다`, first);

  for (let i = k; i < n; i++) {
    s.i = i;
    const out = i - k;
    yield at(
      5,
      `${i}번 칸이 들어오고 ${out}번 칸이 나갑니다`,
      { lo: out, hi: i },
      { incoming: i, outgoing: out, flag: i },
    );

    s.window = (s.window ?? 0) + arr[i] - arr[out];
    yield at(
      6,
      `${josa(arr[out], "을", "를")} 빼고 ${josa(arr[i], "을", "를")} 더합니다 → ${s.window}`,
      { lo: out + 1, hi: i + 1 },
      { outgoing: out, flag: i },
    );

    const prev = s.best ?? 0;
    if (s.window > prev) {
      s.best = s.window;
      bestRange = { lo: out + 1, hi: i + 1 };
    }
    yield at(
      7,
      s.window > prev ? `${josa(s.window, "이", "가")} 최고 ${prev}보다 큽니다. 최고를 바꿉니다` : `${josa(s.window, "은", "는")} 최고 ${prev}${s.window === prev ? "와 같습니다" : "보다 작습니다"}. 그대로 둡니다`,
      { lo: out + 1, hi: i + 1 },
      { flag: i },
    );
  }

  // 반복이 끝나는 자리 — 더 들어올 칸이 없다
  yield at(5, "더 들어올 칸이 없습니다", n > k ? { lo: n - k, hi: n } : first);

  yield at(
    WINDOW_CODE.length,
    `가장 큰 합은 ${s.best} 입니다`,
    null,
    { best: bestRange },
    true,
  );
}

export function windowTape(arr: number[], k: number): Tape {
  return buildTape(walk(arr, k), WINDOW_CODE);
}

/** 테이프 없이 — 창을 한 칸씩 밀었을 때의 합을 처음 창부터 차례로. */
export function windowSums(arr: number[], k: number): number[] {
  if (!(k >= 1)) throw new RangeError("창 크기 k 는 1 이상이어야 한다");
  if (arr.length < k) return [];
  const out = [sum(arr.slice(0, k))];
  for (let i = k; i < arr.length; i++) out.push(out[out.length - 1] + arr[i] - arr[i - k]);
  return out;
}

/** 가장 큰 합과 그 창이 시작하는 칸. 같은 합이면 먼저 나온 창. */
export function maxWindowSum(arr: number[], k: number): { best: number; start: number } {
  const sums = windowSums(arr, k);
  if (sums.length === 0) return { best: sum(arr), start: 0 };
  let start = 0;
  sums.forEach((v, i) => {
    if (v > sums[start]) start = i;
  });
  return { best: sums[start], start };
}

/** 창마다 k 칸을 다시 더하면 숫자를 만지는 횟수. */
export function bruteOps(n: number, k: number): number {
  return (n - k + 1) * k;
}

/** 처음 창만 다 더하고, 그 뒤로는 한 칸 밀 때마다 빼기 하나·더하기 하나. */
export function slideOps(n: number, k: number): number {
  return k + 2 * (n - k);
}
