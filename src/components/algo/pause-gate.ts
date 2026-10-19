/**
 * 플레이어 중간의 예측 관문.
 *
 * 관문 스텝 `pauseAt` 으로 **앞으로 넘어가려는 순간** 아직 답하지 않았으면 넘기지 않고 질문을 연다.
 * 되감기·진행 막대로 지나가는 경우는 막지 않는다 — 이미 본 장면이거나 독자가 일부러 건너뛴 것이다.
 */
export function blocksAt(at: number, delta: number, pauseAt: number | undefined, answered: boolean): boolean {
  if (pauseAt === undefined || answered || delta <= 0) return false;
  return at + delta >= pauseAt && at < pauseAt;
}
