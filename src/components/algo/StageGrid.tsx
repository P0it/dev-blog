import type { StageState } from "@/lib/algo/types";
import { cellClass } from "./cell-class";

/**
 * 격자 무대 — 칸이 채워지는 **순서**가 그림의 내용이다.
 *
 * 아래에 큐를 붙여 한 덩어리로 보인다. 좁은 화면에서 격자와 큐가 따로 놀면
 * "큐에 들어간 것이 저 칸"이라는 연결이 끊긴다.
 */
export function StageGrid({
  cols,
  state,
  labels,
}: {
  cols: number;
  state: StageState;
  labels?: Record<number, string>;
}) {
  return (
    <div className="algo-grid-wrap">
      <div
        className="algo-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 36px))` }}
        role="img"
        aria-label={`${state.cells.length}칸 격자`}
      >
        {state.cells.map((c, i) => (
          <span key={i} className={`algo-gcell ${cellClass(c)}`}>
            {labels?.[i] ?? ""}
          </span>
        ))}
      </div>

      <div className="algo-lane">
        <span className="algo-lane-label">큐</span>
        <span className="algo-lane-out">← 꺼낸다</span>
        <ol className="algo-lane-items">
          {(state.queue ?? []).map((n, i, all) => (
            // 숫자(걸음 수)가 같은 칸끼리 한 겹 — 겹이 바뀌는 자리에 칸막이가 선다
            <li key={i} data-layer-start={i > 0 && all[i - 1] !== n ? "" : undefined}>
              {n}
            </li>
          ))}
          {(state.queue ?? []).length === 0 && <li data-empty>비어 있음</li>}
        </ol>
        <span className="algo-lane-in">넣는다 →</span>
      </div>
    </div>
  );
}
