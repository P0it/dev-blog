import type { CellState, Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

/** 괄호가 짝이 맞는지 스택으로 확인하는 코드. 여는 괄호는 쌓고, 닫는 괄호는 맨 위와 짝을 맞춘다. */
export const BRACKET_CODE = [
  "def is_balanced(s):", // 1
  '    pairs = {")": "(", "]": "[", "}": "{"}', // 2
  "    stack = []", // 3
  "    for c in s:", // 4
  '        if c in "([{":', // 5
  "            stack.append(c)", // 6
  "        elif c in pairs:", // 7
  "            if not stack or stack[-1] != pairs[c]:", // 8
  "                return False", // 9
  "            stack.pop()", // 10
  "    return not stack", // 11
];

/** ④ 플레이어의 두 입력. 같은 길이라 스텝 수가 비슷하고, 하나는 맞고 하나는 안쪽 짝이 어긋난다. */
export const BRACKET_OK = "([{}])";
export const BRACKET_BAD = "([{)]}";

const PAIRS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const OPENS = "([{";

/**
 * 그림 한 장. 읽은 글자는 settled, 지금 읽는 글자는 current, 아직 안 읽은 글자는 out.
 * 짝이 어긋난 글자는 dropped 로 빨갛게 칠한다.
 */
function stage(chars: string[], stack: string[], cursor: number | null, done: number, bad = false) {
  const cells: CellState[] = chars.map((_, k) => {
    if (bad && k === cursor) return "dropped";
    if (k === cursor) return "current";
    if (k < done) return "settled";
    return "out";
  });
  const flags: Record<string, number> = cursor === null ? {} : { i: cursor };
  return { cells, flags, chars, stack: [...stack] };
}

function* walk(s: string): Generator<Step> {
  const chars = [...s];
  const stack: string[] = [];
  const at = (line: number, note: string, cursor: number | null, done: number, extra: Partial<Step> = {}, bad = false): Step => ({
    line,
    vars: { 깊이: stack.length },
    stage: stage(chars, stack, cursor, done, bad),
    note,
    ...extra,
  });

  yield at(2, "닫는 괄호마다 짝인 여는 괄호를 표로 적어 둡니다", null, 0);
  yield at(3, "빈 스택을 만듭니다", null, 0);

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    yield at(4, `${i + 1}번째 글자 ${c} 를 읽습니다`, i, i);

    const open = OPENS.includes(c);
    yield at(5, open ? `${c} 는 여는 괄호입니다` : `${c} 는 여는 괄호가 아닙니다`, i, i);
    if (open) {
      stack.push(c);
      yield at(6, `${c} 를 스택 맨 위에 올립니다`, i, i);
      continue;
    }

    const closing = c in PAIRS;
    yield at(7, closing ? `${c} 는 닫는 괄호입니다` : `${c} 는 괄호가 아니라 건너뜁니다`, i, i);
    if (!closing) continue;

    const top = stack.at(-1);
    const mismatch = top === undefined || top !== PAIRS[c];
    yield at(
      8,
      top === undefined
        ? `스택이 비어 있어 짝이 될 괄호가 없습니다`
        : mismatch
          ? `맨 위 ${top} 는 ${c} 의 짝 ${PAIRS[c]} 가 아닙니다`
          : `맨 위는 ${top} 이고 ${c} 의 짝과 같습니다`,
      i,
      i,
    );
    if (mismatch) {
      yield at(9, "짝이 안 맞습니다. 여기서 False 로 끝냅니다", i, i, { done: false }, true);
      return;
    }

    stack.pop();
    yield at(10, `맨 위 ${top} 를 스택에서 꺼냅니다`, i, i + 1);
  }

  yield at(4, "더 읽을 글자가 없습니다", null, chars.length);
  const balanced = stack.length === 0;
  yield at(
    11,
    balanced ? "스택이 비었습니다. 짝이 다 맞았습니다" : `스택에 ${stack.length}개가 남았습니다. 짝이 안 맞습니다`,
    null,
    chars.length,
    { done: balanced },
  );
}

export function bracketTape(s: string): Tape {
  return buildTape(walk(s), BRACKET_CODE);
}

/** 테이프 없이 답만. 비교용·테스트용. */
export function isBalanced(s: string): boolean {
  const stack: string[] = [];
  for (const c of s) {
    if (OPENS.includes(c)) stack.push(c);
    else if (c in PAIRS) {
      if (stack.length === 0 || stack[stack.length - 1] !== PAIRS[c]) return false;
      stack.pop();
    }
  }
  return stack.length === 0;
}

// ── ① 해 보기: 편집기 되돌리기 ──

/** 독자가 차례로 하는 세 가지 작업. 순서가 고정이라 ② 에서 "가장 먼저 한 것이 남았다"고 말할 수 있다. */
export const EDIT_ACTIONS = ["글자 굵게", "그림 넣기", "색 바꾸기"] as const;
export type EditAction = (typeof EDIT_ACTIONS)[number];

/** 지금까지 한 일(`pile`) 다음에 할 작업. 세 가지를 다 했으면 null. */
export function nextAction(pile: readonly string[]): EditAction | null {
  return EDIT_ACTIONS[pile.length] ?? null;
}

/** 되돌리기 — 쌓인 것 중 **맨 위(가장 마지막에 한 것)** 만 나간다. */
export function undoTop(pile: readonly string[]): { pile: string[]; undone: string | null } {
  if (pile.length === 0) return { pile: [], undone: null };
  return { pile: pile.slice(0, -1), undone: pile[pile.length - 1] };
}

/** 쌓인 줄의 `index` 번째를 되돌릴 수 있는가. 맨 위만 된다. */
export function canUndoAt(pile: readonly string[], index: number): boolean {
  return pile.length > 0 && index === pile.length - 1;
}

/** 작업 `did` 개를 하고 `undone` 번 되돌렸을 때 남는 작업들. */
export function remainingAfter(did: number, undone: number): EditAction[] {
  return EDIT_ACTIONS.slice(0, Math.max(0, did - undone));
}
