import type { Step, Tape } from "./types.ts";

/**
 * 스텝 상한. 큰 입력에서 테이프가 메모리를 먹지 않게 끊는다.
 * 버블 정렬에 N=200 이면 수만 스텝이라, 전부 모으면 터진다.
 */
export const STEP_LIMIT = 2000;

/** 제너레이터가 흘리는 스텝을 상한까지만 모은다. */
export function buildTape(
  gen: Generator<Step>,
  code: string[],
  limit: number = STEP_LIMIT,
): Tape {
  const steps: Step[] = [];
  let truncated = false;

  for (const step of gen) {
    steps.push(step);
    if (steps.length >= limit) {
      // 다음 스텝이 더 있는지만 한 번 보고 멈춘다 — 끝까지 돌리지 않는다
      truncated = !gen.next().done;
      break;
    }
  }

  return { steps, code, truncated };
}
