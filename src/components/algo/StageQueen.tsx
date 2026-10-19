import type { StageState } from "@/lib/algo/types";
import { QueenBoard, QueenLegend } from "./QueenBoard";

/**
 * N-퀸 무대 — 퀸이 놓이고 거둬지는 **순서**가 그림의 내용이다.
 *
 * 퀸이 노리는 칸은 흐리고, 지금 보는 줄에서 놓을 수 있는 칸은 밝다. 방금 놓은 퀸에는 테두리가 서고,
 * 거둔 자리에는 ×가 남는다. 줄 번호와 칸 번호는 코드의 `row`·`col` 처럼 0부터 센다.
 */
export function StageQueen({ state }: { state: StageState }) {
  const q = state.queens;
  if (!q) return null;
  const placed = q.at.filter((c) => c >= 0).length;
  return (
    <div className="algo-queen-stage">
      <p className="algo-queen-count">
        놓은 퀸 <b>{placed}</b>개
      </p>
      <QueenBoard n={q.n} at={q.at} row={q.row} tryCol={q.try} mode={q.mode} />
      <QueenLegend />
    </div>
  );
}
