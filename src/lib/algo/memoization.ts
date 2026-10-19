import type { Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/**
 * 화면에 보여 주는 Python 코드. 아래 제너레이터가 이 줄 번호를 따라간다.
 * 수첩(`memo`)은 `{n: fib(n)}` 딕셔너리다 — 한 번 구한 값을 적어 두었다가 다시 부르면 꺼내 쓴다.
 */
export const MEMO_CODE = [
  "def fib(n, memo):", // 1
  "    if n in memo:", // 2
  "        return memo[n]", // 3
  "    if n < 2:", // 4
  "        memo[n] = n", // 5
  "        return n", // 6
  "    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)", // 7
  "    return memo[n]", // 8
];

/** 화면에 올리는 줄. 4(조건)와 6(돌려주기)은 건너뛴다 — 올리면 스텝이 47개가 된다. */
export const MEMO_SHOWN_LINES = [2, 3, 5, 7, 8];

export function fibValue(n: number): number {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
}

// ── 플레이어(④) 테이프 ──

type Frame = { n: number; ret?: number };
type Book = Map<number, number>;

function snap(line: number, n: number, stack: Frame[], memo: Book, note: string, hit = false, done = false): Step {
  return {
    line,
    vars: { n, "len(memo)": memo.size },
    stage: {
      cells: [],
      flags: {},
      frames: stack.map((f) => ({ ...f })),
      memo: { notebook: [...memo].map(([k, v]) => ({ n: k, v })), ...(hit ? { hit } : {}) },
    },
    note,
    ...(done ? { done } : {}),
  };
}

/**
 * Python 과 스텝이 한 줄씩 맞물리게 흘린다.
 *
 * line 이벤트는 줄을 실행하기 **전**에 찍힌다 — 그래서 수첩 크기도 그 줄 실행 전의 값이다.
 * 한 번 부르면 `수첩에 있나 보기(줄 2)` 다음이 셋으로 갈린다:
 * 있으면 꺼내 쓰기(줄 3), 0·1 이면 수첩에 적기(줄 5), 나머지는 두 값을 구해 더하기(줄 7) 뒤 돌려주기(줄 8).
 */
function* call(n: number, stack: Frame[], memo: Book, outer: boolean): Generator<Step, number> {
  const frame: Frame = { n };
  stack.push(frame);

  yield snap(2, n, stack, memo, `n = ${n}. 수첩에 ${josa(n, "이", "가")} 적혀 있는지 봅니다`);

  if (memo.has(n)) {
    const v = memo.get(n)!;
    frame.ret = v;
    yield snap(
      3,
      n,
      stack,
      memo,
      `수첩에 ${josa(n, "이", "가")} 있습니다. 다시 계산하지 않고 값 ${josa(v, "을", "를")} 그대로 돌려줍니다`,
      true,
      outer,
    );
    stack.pop();
    return v;
  }

  if (n < 2) {
    yield snap(5, n, stack, memo, `${josa(n, "이라서", "라서")} 더 부르지 않고 수첩에 ${n} → ${n} 을 적습니다`, false, outer);
    memo.set(n, n);
    frame.ret = n;
    stack.pop();
    return n;
  }

  yield snap(
    7,
    n,
    stack,
    memo,
    `수첩에 없습니다. 한 칸 작은 ${josa(n - 1, "과", "와")} 두 칸 작은 ${n - 2} 의 값을 차례로 구해 더합니다`,
  );
  const a = yield* call(n - 1, stack, memo, false);
  const b = yield* call(n - 2, stack, memo, false);
  const v = a + b;
  memo.set(n, v);
  frame.ret = v;
  yield snap(8, n, stack, memo, `더한 값은 ${v}. 수첩에 적어 두고 돌려줍니다`, false, outer);
  stack.pop();
  return v;
}

function* walk(n: number): Generator<Step> {
  yield* call(n, [], new Map(), true);
}

/** n 은 0 이상의 정수. */
export function memoTape(n: number): Tape {
  if (!Number.isInteger(n) || n < 0) throw new RangeError("n 은 0 이상의 정수여야 합니다");
  return buildTape(walk(n), MEMO_CODE);
}

/**
 * 플레이어 예측 관문 자리 — 처음으로 수첩에서 꺼내 쓰는 호출(줄 3)의 스텝.
 * 바로 앞 스텝은 그 호출이 `수첩에 있나 보기`를 하는 순간이라, 독자는 결과를 모른 채 묻는 말을 받는다.
 */
export function memoGate(tape: Tape): number {
  return tape.steps.findIndex((s) => s.stage.memo?.hit === true);
}

// ── ① 해 보기 — 호출 나무와 수첩 ──

export type MemoNode = {
  id: number;
  n: number;
  parent: number | null;
  kids: number[];
  depth: number;
  /** 가로 자리. 잎이 0, 1, 2 … 순서로 자리를 잡고 부모는 자식 가운데에 선다 */
  x: number;
  /** 이 호출을 뿌리로 하는 부분 나무의 크기(자기 포함) */
  size: number;
};

/** n 을 구하는 호출 나무 전체. id 는 부른 순서(앞에서부터, 왼쪽 자식 먼저)다. */
export function fullTree(n: number): MemoNode[] {
  if (!Number.isInteger(n) || n < 0) throw new RangeError("n 은 0 이상의 정수여야 합니다");
  const nodes: MemoNode[] = [];
  let leaf = 0;

  const place = (k: number, depth: number, parent: number | null): number => {
    const id = nodes.length;
    const node: MemoNode = { id, n: k, parent, kids: [], depth, x: 0, size: 1 };
    nodes.push(node);
    if (k < 2) {
      node.x = leaf++;
    } else {
      node.kids = [place(k - 1, depth + 1, id), place(k - 2, depth + 1, id)];
      node.x = (nodes[node.kids[0]].x + nodes[node.kids[1]].x) / 2;
      node.size = 1 + nodes[node.kids[0]].size + nodes[node.kids[1]].size;
    }
    return id;
  };
  place(n, 0, null);
  return nodes;
}

export type MemoEvent =
  | { type: "call"; id: number; kind: "compute" | "hit" }
  | { type: "write"; id: number; value: number };

/**
 * 수첩을 쓰며 부르는 순서. 호출(`call`)은 독자가 한 번씩 누르는 일이고,
 * 수첩에 적기(`write`)는 두 자식의 값이 모이면 저절로 일어난다.
 * 수첩에서 꺼내 쓴 호출(`hit`)의 아래 가지는 부르지 않는다.
 */
export function memoEvents(n: number): MemoEvent[] {
  const nodes = fullTree(n);
  const memo = new Set<number>();
  const out: MemoEvent[] = [];

  const visit = (id: number) => {
    const node = nodes[id];
    if (memo.has(node.n)) {
      out.push({ type: "call", id, kind: "hit" });
      return;
    }
    out.push({ type: "call", id, kind: "compute" });
    for (const k of node.kids) visit(k);
    memo.add(node.n);
    out.push({ type: "write", id, value: fibValue(node.n) });
  };
  visit(0);
  return out;
}

export type NodeState = "idle" | "working" | "done" | "hit" | "skipped";

export type Replay = {
  /** id 별 상태. working = 자식 값을 기다리는 중, done = 수첩에 적음, hit = 수첩에서 꺼내 씀, skipped = 위에서 꺼내 써서 안 부름 */
  states: NodeState[];
  /** 수첩에 적힌 것(적은 순서) */
  notebook: { n: number; v: number }[];
  /** 다음에 눌러야 할 호출과 그 호출이 계산인지 꺼내 쓰기인지. 끝나면 null */
  next: { id: number; kind: "compute" | "hit" } | null;
  computes: number;
  hits: number;
  finished: boolean;
};

/** 호출을 k 번 눌렀을 때의 그림 상태. k 가 호출 수를 넘으면 끝으로 본다. */
export function replay(n: number, k: number): Replay {
  const nodes = fullTree(n);
  const events = memoEvents(n);
  const states: NodeState[] = nodes.map(() => "idle");
  const notebook: { n: number; v: number }[] = [];
  let computes = 0;
  let hits = 0;
  let pressed = 0;
  let next: Replay["next"] = null;

  for (const e of events) {
    if (e.type === "call") {
      if (pressed >= k) {
        next = { id: e.id, kind: e.kind };
        break;
      }
      pressed++;
      if (e.kind === "compute") {
        states[e.id] = "working";
        computes++;
      } else {
        states[e.id] = "hit";
        hits++;
        for (let i = e.id + 1; i < e.id + nodes[e.id].size; i++) states[i] = "skipped";
      }
    } else {
      states[e.id] = "done";
      notebook.push({ n: nodes[e.id].n, v: e.value });
    }
  }

  return { states, notebook, next, computes, hits, finished: next === null };
}

/** 수첩 없이 fib(n) 을 구할 때의 호출 횟수. 2·fib(n+1)−1 이다. */
export function plainCalls(n: number): number {
  return 2 * fibValue(n + 1) - 1;
}

/** 수첩을 쓰며 fib(n) 을 구할 때의 호출 횟수. n ≥ 1 이면 2n−1 이다. */
export function memoCalls(n: number): number {
  return n < 1 ? 1 : 2 * n - 1;
}

/** 수첩을 쓰며 실제로 계산하는(수첩에 새로 적는) 횟수. fib(0) 부터 fib(n) 까지 한 번씩이다. */
export function memoComputes(n: number): number {
  return n + 1;
}
