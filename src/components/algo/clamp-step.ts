/**
 * 플레이어의 현재 스텝 번호를 범위 안에 가둔다.
 * `-1` 은 "아직 시작 전" 이다 — 플레이어는 처음에 멈춰 있다(자동 재생 ✗).
 */
export function clampStep(at: number, length: number): number {
  if (length <= 0) return -1;
  return Math.max(-1, Math.min(length - 1, at));
}
