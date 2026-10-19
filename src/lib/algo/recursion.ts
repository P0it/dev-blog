import type { Step, Tape } from "./types.ts";
import { buildTape } from "./tape.ts";

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
    n === 1 ? "n 이 1 입니다. 여기서 멈춥니다" : `n 이 1 인지 봅니다. ${n} 이라서 아닙니다`,
  );

  if (n === 1) {
    yield snap(3, n, stack, "1 을 돌려줄 준비를 합니다");
    frame.ret = 1;
    yield snap(3, n, stack, "factorial(1) = 1. 이 층이 걷힙니다", 1, outer);
    stack.pop();
    return 1;
  }

  yield snap(4, n, stack, `${n} × factorial(${n - 1}) 을 풀려면 factorial(${n - 1}) 부터 필요합니다`);
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
