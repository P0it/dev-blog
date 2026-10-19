import type { CellState, StageState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/**
 * 줄에 선 사람을 받는 코드. 숫자 `e` 는 일이다 — 0 이면 받기, 그 밖의 수는 그 번호 손님이 도착한 것이다.
 * 1번 줄은 import 라 함수 밖이다. 함수 안은 3번 줄부터 켜진다.
 */
export const LINE_CODE = [
  "from collections import deque", // 1
  "def serve_line(line, events):", // 2
  "    q = deque(line)", // 3
  "    served = []", // 4
  "    for e in events:", // 5
  "        if e == 0:", // 6
  "            served.append(q.popleft())", // 7
  "        else:", // 8
  "            q.append(e)", // 9
  "    return served", // 10
];

/** ① 해 보기와 ④ 플레이어가 함께 쓰는 줄과 일. 같은 입력이라 ① 의 깨달음이 ④ 로 이어진다. */
export const LINE_START = [1, 2, 3, 4, 5, 6, 7, 8];
export const LINE_EVENTS = [0, 9, 0, 0, 10, 0];

function stage(q: number[], served: number[], shifted: number, hot?: "front" | "back"): StageState {
  const cells: CellState[] = q.map(() => "waiting");
  return { cells, flags: {}, queue: [...q], line: { served: [...served], shifted, ...(hot ? { hot } : {}) } };
}

/** 파이썬에서 아직 값이 없는 변수는 vars 에 싣지 않는다. */
function vars(e: number | null, qlen: number | null, slen: number | null): Record<string, number> {
  const out: Record<string, number> = {};
  if (e !== null) out.e = e;
  if (qlen !== null) out["len(q)"] = qlen;
  if (slen !== null) out["len(served)"] = slen;
  return out;
}

function* walk(line: number[], events: number[]): Generator<Step> {
  const q = [...line];
  const served: number[] = [];
  let shifted = 0;
  let e: number | null = null;
  let qlen: number | null = null;
  let slen: number | null = null;
  const at = (ln: number, note: string, hot?: "front" | "back", done?: boolean): Step => ({
    line: ln,
    vars: vars(e, qlen, slen),
    stage: stage(q, served, shifted, hot),
    note,
    ...(done === undefined ? {} : { done }),
  });

  qlen = q.length;
  yield at(3, q.length === 0 ? "줄이 비어 있습니다" : `줄 선 순서 그대로 deque 에 담습니다. 맨 앞은 ${q[0]}번입니다`);
  slen = 0;
  yield at(4, "받은 사람을 적어 둘 빈 목록을 만듭니다");

  for (const ev of events) {
    e = ev;
    yield at(5, ev === 0 ? "다음 일은 받기입니다 (e = 0)" : `${ev}번 손님이 도착했습니다 (e = ${ev})`);
    yield at(6, ev === 0 ? "e 가 0 입니다. 받을 차례입니다" : `e 가 ${ev} 입니다. 0 이 아니니 도착입니다`);

    if (ev === 0) {
      if (q.length === 0) {
        // 파이썬에서는 IndexError 가 나고 함수가 끝난다
        yield at(7, "빈 줄에서 popleft 를 하면 IndexError 가 납니다", "front", false);
        return;
      }
      const front = q.shift()!;
      served.push(front);
      shifted += q.length;
      qlen = q.length;
      slen = served.length;
      yield at(7, `${front}번 손님이 맨 앞에서 나갑니다`, "front");
    } else {
      q.push(ev);
      qlen = q.length;
      yield at(9, `${ev}번 손님이 줄 맨 뒤에 섭니다`, "back");
    }
  }

  yield at(5, "처리할 일이 더 없습니다");
  yield at(LINE_CODE.length, served.length ? `받은 순서: ${served.join(" → ")}` : "아무도 받지 않았습니다", undefined, true);
}

export function lineTape(line: number[], events: number[]): Tape {
  return buildTape(walk(line, events), LINE_CODE);
}

/** 테이프 없이 받은 순서만. 비교용·테스트용. */
export function serveLine(line: number[], events: number[]): number[] {
  return serveOrder(line, events, "queue");
}

/**
 * 같은 줄·같은 일을 어떤 끝으로 넣고 어떤 끝으로 받느냐에 따라 받는 순서가 어떻게 되는지.
 * - `queue`: 뒤에서 넣고 앞에서 받는다(줄)
 * - `backBack`: 뒤에서 넣고 뒤에서 받는다(쌓기)
 * - `frontFront`: 앞에서 넣고 앞에서 받는다(쌓기)
 */
export function serveOrder(
  line: number[],
  events: number[],
  mode: "queue" | "backBack" | "frontFront",
): number[] {
  const q = [...line];
  const out: number[] = [];
  for (const ev of events) {
    if (ev === 0) {
      const who = mode === "backBack" ? q.pop() : q.shift();
      if (who === undefined) throw new RangeError("빈 줄에서 받을 수 없다");
      out.push(who);
    } else if (mode === "frontFront") q.unshift(ev);
    else q.push(ev);
  }
  return out;
}

/** 같은 일을 리스트 `pop(0)` 으로 했다면 한 칸씩 당긴 칸 수의 합. 받을 때마다 줄에 남은 사람 수만큼이다. */
export function shiftCount(line: number[], events: number[]): number {
  let len = line.length;
  let shifted = 0;
  for (const ev of events) {
    if (ev === 0) {
      len--;
      shifted += len;
    } else len++;
  }
  return shifted;
}

/** 두 번째 '받기' 줄이 켜지는 스텝. 플레이어는 그 앞에서 멈추고 누가 나갈지 묻는다. */
export function secondServeStep(tape: Tape): number {
  let seen = 0;
  for (let i = 0; i < tape.steps.length; i++) {
    if (tape.steps[i].line === 7 && ++seen === 2) return i;
  }
  return -1;
}

// ── ① 직접 해 보기 ──

/** 선생님은 번호가 아니라 이름으로 보인다. 줄의 숫자 하나가 선생님이다. */
export const TEACHER = 99;

export function whoLabel(n: number): string {
  return n === TEACHER ? "선생님" : `${n}번`;
}

export type Ev = { kind: "arrive"; who: number } | { kind: "serve" } | { kind: "teacher" } | { kind: "leave" };
export type Action = "pushBack" | "popFront" | "pushFront" | "popBack";

/** ① 에서 독자가 처리하는 일들. 앞의 여섯 개는 ④ 의 `LINE_EVENTS` 와 같다. */
export const HAND_EVENTS: Ev[] = [
  { kind: "serve" },
  { kind: "arrive", who: 9 },
  { kind: "serve" },
  { kind: "serve" },
  { kind: "arrive", who: 10 },
  { kind: "serve" },
  { kind: "teacher" },
  { kind: "serve" },
  { kind: "leave" },
];

export const ACTION_LABEL: Record<Action, string> = {
  pushBack: "줄 맨 뒤에 서기",
  popFront: "맨 앞에서 받기",
  pushFront: "맨 앞에 서기",
  popBack: "맨 뒤에서 나가기",
};

/** 그 일에 맞는 동작은 하나뿐이다. */
export function wanted(ev: Ev): Action {
  switch (ev.kind) {
    case "arrive":
      return "pushBack";
    case "serve":
      return "popFront";
    case "teacher":
      return "pushFront";
    case "leave":
      return "popBack";
  }
}

export function evText(ev: Ev): string {
  switch (ev.kind) {
    case "arrive":
      return `${ev.who}번 손님이 도착했어요`;
    case "serve":
      return "받을 차례예요";
    case "teacher":
      return "선생님이 오셨어요. 선생님이 먼저 받아야 해요";
    case "leave":
      return "수업 종이 울려 맨 뒤 손님이 줄에서 나가요";
  }
}

const REASON: Record<Ev["kind"], string> = {
  arrive: "새 손님은 줄 맨 뒤에 섭니다",
  serve: "받는 곳은 맨 앞입니다",
  teacher: "선생님이 먼저 받아야 하니 맨 앞에 세웁니다",
  leave: "나가는 사람은 맨 뒤에 선 손님입니다",
};

/**
 * 독자가 한 동작의 판정과 그 뒤의 줄.
 * ① 에서 허용하는 동작은 줄의 동작뿐이다 — 틀린 동작은 줄을 그대로 두고 **왜 틀렸는지** 말한다.
 * `deque` 가 false 인 줄에는 「맨 뒤에 서기」와 「맨 앞에서 받기」 두 버튼뿐이라,
 * 선생님과 맨 뒤 나가기는 어떤 버튼으로도 못 한다.
 */
export function stepHand(
  line: number[],
  ev: Ev,
  act: Action,
  deque: boolean,
): { ok: boolean; line: number[]; text: string; out?: number } {
  if (!deque && (ev.kind === "teacher" || ev.kind === "leave")) {
    const what = ev.kind === "teacher" ? "선생님을 맨 앞에 세울" : "맨 뒤 손님을 내보낼";
    return {
      ok: false,
      line,
      text: `이 줄에는 「맨 뒤에 서기」와 「맨 앞에서 받기」 두 가지뿐이라 ${what} 방법이 없습니다. 위의 「줄 규칙 풀기」를 눌러 보세요`,
    };
  }

  const want = wanted(ev);
  if (act !== want) {
    return { ok: false, line, text: `이 일에는 「${ACTION_LABEL[want]}」가 맞습니다. ${REASON[ev.kind]}` };
  }

  switch (act) {
    case "pushBack": {
      const who = ev.kind === "arrive" ? ev.who : 0;
      return { ok: true, line: [...line, who], text: `${whoLabel(who)} 손님이 줄 맨 뒤에 섰습니다` };
    }
    case "popFront": {
      const [front, ...rest] = line;
      return { ok: true, line: rest, text: `맨 앞 ${whoLabel(front)}${front === TEACHER ? "이" : " 손님이"} 받고 나갔습니다`, out: front };
    }
    case "pushFront":
      return { ok: true, line: [TEACHER, ...line], text: "선생님이 맨 앞에 서서 먼저 받습니다" };
    case "popBack": {
      const back = line[line.length - 1];
      return { ok: true, line: line.slice(0, -1), text: `맨 뒤 ${whoLabel(back)} 손님이 줄에서 나갔습니다`, out: back };
    }
  }
}
