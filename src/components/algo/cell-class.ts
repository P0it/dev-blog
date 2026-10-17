import type { CellState } from "@/lib/algo/types.ts";

/**
 * 칸 상태 → CSS 클래스. 색은 globals.css 의 `--algo-*` 토큰이 쥔다.
 * 페이지마다 색을 다시 고르지 않는다 — 독자가 열 쪽쯤 돌면 색만 봐도 알게 하는 게 목적이다.
 */
export const CELL_CLASS: Record<CellState, string> = {
  current: "algo-cell-current",
  compare: "algo-cell-compare",
  settled: "algo-cell-settled",
  dropped: "algo-cell-dropped",
  out: "algo-cell-out",
  waiting: "algo-cell-waiting",
};

export function cellClass(state: CellState): string {
  return CELL_CLASS[state] ?? CELL_CLASS.out;
}
