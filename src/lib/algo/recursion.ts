import type { Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";
import { josa } from "./josa.ts";

/** 화면에 보여 주는 Python 코드. 아래 제너레이터가 이 줄 번호를 따라간다. */
export const FACTORIAL_CODE = [
  "def factorial(n):", // 1
  "    if n == 1:", // 2
  "        return 1", // 3
  "    return n * factorial(n - 1)", // 4
];

type Frame = { n: number; ret?: number };

function snap(
  line: number,
  n: number,
  stack: Frame[],
  note: string,
  ret?: number,
  done?: boolean,
): Step {
  return {
    line,
    vars: ret === undefined ? { n } : { n, ret },
    stage: { cells: [], flags: {}, frames: stack.map((f) => ({ ...f })) },
    note,
    ...(done ? { done } : {}),
  };
}

/**
 * Python 과 스텝이 한 줄씩 맞물리게 흘린다.
 *
 * 한 층(호출 하나)이 내는 스텝은 늘 셋이다 — 멈출지 보기, (부르기 | 1 돌려주기), 값 돌려주기.
 * line 이벤트는 줄을 실행하기 **전**에, return 이벤트는 값을 돌려주는 순간에 찍힌다.
 * 어긋나면 fixture 대조 테스트가 잡는다.
 */
function* call(n: number, stack: Frame[], outer: boolean): Generator<Step, number> {
  const frame: Frame = { n };
  stack.push(frame);

  yield snap(
    2,
    n,
    stack,
    n === 1 ? "n 이 1 입니다. 여기서 멈춥니다" : `n 이 1 인지 봅니다. ${josa(n, "이라서", "라서")} 아닙니다`,
  );

  if (n === 1) {
    yield snap(3, n, stack, "1 을 돌려줄 준비를 합니다");
    frame.ret = 1;
    yield snap(3, n, stack, "factorial(1) = 1. 이 층이 걷힙니다", 1, outer);
    stack.pop();
    return 1;
  }

  yield snap(4, n, stack, `factorial(${n - 1}) 부터 알아야 ${josa(n, "과", "와")} 곱할 수 있습니다`);
  const inner = yield* call(n - 1, stack, false);
  const ret = n * inner;
  frame.ret = ret;
  yield snap(4, n, stack, `factorial(${n}) = ${n} × ${inner} = ${ret}. 이 층이 걷힙니다`, ret, outer);
  stack.pop();
  return ret;
}

function* walk(n: number): Generator<Step> {
  yield* call(n, [], true);
}

/** n 은 1 이상. 진짜 코드는 n < 1 에서 멈추지 못한다 — 그 장면은 ⑥에서 글로 보인다. */
export function factorialTape(n: number): Tape {
  if (!Number.isInteger(n) || n < 1) throw new RangeError("n 은 1 이상의 정수여야 합니다");
  return buildTape(walk(n), FACTORIAL_CODE);
}

/**
 * 플레이어 예측 관문 자리 — 첫 번째 `값 돌려주기` 바로 다음 스텝.
 * 가장 안쪽 층이 막 돌려줬고, 바깥 층이 곱하기 직전이다("factorial(2) 가 돌려줄 값은?").
 */
export function firstReturnGate(tape: Tape): number {
  return tape.steps.findIndex((s) => s.vars.ret !== undefined) + 1;
}

/** 자기를 두 번 부르는 재귀(피보나치)의 호출 나무. 갈라지는 재귀를 한 컷으로 보이는 데 쓴다. */
export type FibNode = { n: number; kids: FibNode[] };

export function fibTree(n: number): FibNode {
  if (!Number.isInteger(n) || n < 0) throw new RangeError("n 은 0 이상의 정수여야 합니다");
  return { n, kids: n < 2 ? [] : [fibTree(n - 1), fibTree(n - 2)] };
}

/** 호출 나무의 호출 횟수. */
export function countCalls(t: FibNode): number {
  return 1 + t.kids.reduce((a, k) => a + countCalls(k), 0);
}

/** n 값이 나무에 몇 번 나오는지. 2 번 이상이면 같은 계산을 되풀이한 것이다. */
export function countOf(t: FibNode, n: number): number {
  return (t.n === n ? 1 : 0) + t.kids.reduce((a, k) => a + countOf(k, n), 0);
}
