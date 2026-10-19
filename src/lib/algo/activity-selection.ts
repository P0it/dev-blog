import type { CellState, StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/** 회의 하나 — [시작 시각, 끝 시각]. 끝에 시작하는 회의는 겹치지 않는다(반쯤 열린 구간). */
export type Meeting = [number, number];

/** 끝나는 시간이 빠른 회의부터 고르는 코드. 한 줄이 한 가지만 한다. */
export const MEET_CODE = [
  "def max_meetings(meetings):", // 1
  "    meetings.sort(key=lambda m: (m[1], m[0]))", // 2
  "    count = 0", // 3
  "    end = 0", // 4
  "    for s, e in meetings:", // 5
  "        if s >= end:", // 6
  "            count += 1", // 7
  "            end = e", // 8
  "    return count", // 9
];

/**
 * ① 해 보기와 ④ 플레이어가 함께 쓰는 회의. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다.
 *
 * 세 기준이 서로 다르게 갈리게 짠 입력이다(실제 Python 으로 확인):
 * 시작이 빠른 순 1개(A) · 짧은 순 2개(B E) · 끝나는 시간 순 3개(B C F, 최선).
 */
export const MEETINGS: Meeting[] = [
  [9, 16],
  [10, 11],
  [11, 15],
  [12, 17],
  [13, 16],
  [15, 20],
];

/** 시간표에 그리는 시각 범위(시). */
export const AXIS = { from: 9, to: 20 };

export const NAMES = ["A", "B", "C", "D", "E", "F"];

const nameOf = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : `#${i}`);

/** 회의 둘이 겹치는가. 한쪽이 끝나는 시각에 다른 쪽이 시작하면 겹치지 않는다. */
export function overlaps(a: Meeting, b: Meeting): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

// ── 테이프 ──

type Row = { name: string; s: number; e: number };

function stage(rows: Row[], cells: CellState[], end: number | undefined): StageState {
  return {
    cells: [...cells],
    flags: {},
    timeline: { rows, ...(end === undefined ? {} : { end }) },
  };
}

type Vars = { s: number | null; e: number | null; count: number | null; end: number | null };

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(v: Vars): Record<string, number> {
  const out: Record<string, number> = {};
  if (v.s !== null) out.s = v.s;
  if (v.e !== null) out.e = v.e;
  if (v.count !== null) out.count = v.count;
  if (v.end !== null) out.end = v.end;
  return out;
}

function* walk(meetings: Meeting[]): Generator<Step> {
  // 끝나는 시간 순(끝이 같으면 시작 순)으로 줄을 세운다. 이름은 처음 순서대로 붙어 있다.
  const rows: Row[] = meetings
    .map(([s, e], i) => ({ name: nameOf(i), s, e }))
    .sort((a, b) => a.e - b.e || a.s - b.s);
  const n = rows.length;
  const cells: CellState[] = rows.map(() => "out");
  const v: Vars = { s: null, e: null, count: null, end: null };
  let picked: number | undefined; // 지금까지 고른 회의 가운데 가장 늦은 끝

  const at = (line: number, note: string, done?: boolean): Step => ({
    line,
    vars: vars(v),
    stage: stage(rows, cells, picked),
    note,
    ...(done === undefined ? {} : { done }),
  });

  yield at(2, "끝나는 시간이 빠른 순으로 줄을 세웠습니다. 끝이 같으면 시작이 빠른 쪽이 먼저입니다");

  v.count = 0;
  yield at(3, "고른 회의 수는 0에서 시작합니다");

  v.end = 0;
  yield at(4, "마지막으로 고른 회의의 끝은 0시로 둡니다. 아직 고른 회의가 없습니다");

  for (let k = 0; k < n; k++) {
    v.s = rows[k].s;
    v.e = rows[k].e;
    cells[k] = "current";
    yield at(5, `${rows[k].name} 회의를 봅니다. ${v.s}시에 시작해서 ${v.e}시에 끝납니다`);

    const ok = v.s >= v.end!;
    const first = picked === undefined;
    if (ok) {
      yield at(
        6,
        first
          ? "아직 고른 회의가 없으니 고릅니다"
          : `시작 ${v.s}시는 지금 끝 ${v.end}시 이후입니다. 겹치지 않으니 고릅니다`,
      );
      v.count!++;
      yield at(7, `고른 회의가 ${v.count}개가 됩니다`);
      v.end = v.e;
      cells[k] = "settled";
      picked = v.e;
      yield at(8, `지금 끝을 ${v.e}시로 바꿉니다`);
    } else {
      cells[k] = "dropped";
      yield at(6, `시작 ${v.s}시는 지금 끝 ${v.end}시보다 앞입니다. 겹치니 건너뜁니다`);
    }
  }

  yield at(5, "볼 회의가 더 없습니다");
  yield at(MEET_CODE.length, `${v.count}개를 잡았습니다`, true);
}

export function meetTape(meetings: Meeting[] = MEETINGS): Tape {
  return buildTape(walk(meetings), MEET_CODE);
}

// ── ① 해 보기 ──

export type Kind = "start" | "short" | "end";

const KEYS: Record<Kind, (m: Meeting) => [number, number]> = {
  start: (m) => [m[0], m[1]],
  short: (m) => [m[1] - m[0], m[0]],
  end: (m) => [m[1], m[0]],
};

/**
 * 세 기준 가운데 하나로 줄을 세워 앞에서부터 **이미 고른 회의와 하나도 겹치지 않을 때만** 고른다.
 * 처음 순서의 번호를 고른 차례대로 돌려준다.
 */
export function greedyPick(meetings: Meeting[], kind: Kind): number[] {
  const key = KEYS[kind];
  const order = meetings
    .map((_, i) => i)
    .sort((a, b) => {
      const ka = key(meetings[a]);
      const kb = key(meetings[b]);
      return ka[0] - kb[0] || ka[1] - kb[1] || a - b;
    });
  const picked: number[] = [];
  for (const i of order) {
    if (picked.every((j) => !overlaps(meetings[i], meetings[j]))) picked.push(i);
  }
  return picked;
}

/** 코드(끝나는 시간 순) 그대로의 결과. */
export function maxMeetings(meetings: Meeting[]): number {
  return runVariant(meetings, { key: "end" });
}

/** 모든 경우를 다 따져 본 최선의 회의 수. 작은 입력(20개 이하)에서만 쓴다. */
export function bestCount(meetings: Meeting[]): number {
  if (meetings.length > 20) throw new Error("bestCount 는 20개 이하에서만 쓴다");
  let best = 0;
  const go = (i: number, chosen: Meeting[]) => {
    if (chosen.length + (meetings.length - i) <= best) return;
    if (i === meetings.length) {
      best = Math.max(best, chosen.length);
      return;
    }
    if (chosen.every((c) => !overlaps(c, meetings[i]))) go(i + 1, [...chosen, meetings[i]]);
    go(i + 1, chosen);
  };
  go(0, []);
  return best;
}

export type PickResult = { ok: true; action: "add" | "remove" } | { ok: false; with: number };

/**
 * 독자가 회의를 눌렀을 때. 이미 고른 회의면 되돌리고, 이미 고른 회의와 겹치면 못 고르며(어느 회의와 겹치는지 알려 준다),
 * 아니면 고른다.
 */
export function pickCheck(meetings: Meeting[], selected: number[], i: number): PickResult {
  if (selected.includes(i)) return { ok: true, action: "remove" };
  const j = selected.find((k) => overlaps(meetings[k], meetings[i]));
  return j === undefined ? { ok: true, action: "add" } : { ok: false, with: j };
}

/** 고른 회의를 처음 순서대로 한 줄씩 그린 그림. `dim` 이면 안 고른 회의를 건너뛴 것(dropped)으로 흐리게 한다. */
export function stageFromPicks(meetings: Meeting[], picked: number[], opts: { dim?: boolean } = {}): StageState {
  const rows: Row[] = meetings.map(([s, e], i) => ({ name: nameOf(i), s, e }));
  const cells: CellState[] = meetings.map((_, i) =>
    picked.includes(i) ? "settled" : opts.dim ? "dropped" : "out",
  );
  const end = picked.length ? Math.max(...picked.map((i) => meetings[i][1])) : undefined;
  return stage(rows, cells, end);
}

// ── ⑥ 코드를 바꿔 돌려 본 값 ──

export type Variant = {
  /** 정렬 기준. end 는 코드 그대로, end_only 는 끝이 같을 때 시작 순 없음, none 은 정렬을 안 함 */
  key: "end" | "start" | "duration" | "end_only" | "none";
  /** `s > end` 로 쓰면 true */
  strict?: boolean;
};

/** 코드 한 줄을 바꿔 돌렸을 때 잡는 회의 수. `scripts/algo/trace_activity_selection.py` 의 `run` 과 같다. */
export function runVariant(meetings: Meeting[], v: Variant): number {
  const ms = meetings.map((m): Meeting => [m[0], m[1]]);
  if (v.key === "end") ms.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  else if (v.key === "start") ms.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  else if (v.key === "duration") ms.sort((a, b) => a[1] - a[0] - (b[1] - b[0]) || a[0] - b[0]);
  else if (v.key === "end_only") ms.sort((a, b) => a[1] - b[1]);
  let count = 0;
  let end = 0;
  for (const [s, e] of ms) {
    if (v.strict ? s > end : s >= end) {
      count++;
      end = e;
    }
  }
  return count;
}

/** 시각을 "9시" 꼴로. */
export const hour = (h: number) => `${h}시`;

/** 회의 이름 목록을 "B · C · F" 꼴로. */
export function namesOf(indices: number[]): string {
  return indices.map((i) => NAMES[i]).join(" · ");
}
