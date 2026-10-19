import { Fragment } from "react";
import { attackedBy } from "@/lib/algo/n-queens";

/**
 * N-퀸 보드 — ① 해 보기와 ④ 플레이어가 함께 그린다.
 *
 * `at[r]` 은 r 번째 줄 퀸의 칸 번호(없으면 -1)다. 노리는 칸은 `at` 으로 직접 계산해 흐리게 칠하고,
 * 지금 놓을 줄(`row`)에서는 놓을 수 있는 칸을 밝게 켠다. `start` 가 있으면(해 보기) 이미 시도해 본 칸은 점선으로 보인다.
 * 칸 색은 `.algo-gcell` 이 아니라 `.algo-queen-cell` 이 직접 쥔다 — 격자 칸 색이 뒤에 정의된 규칙에 덮인 적이 있다.
 */
export function QueenBoard({
  n,
  at,
  row,
  tryCol,
  mode,
  start,
  onCell,
}: {
  n: number;
  at: number[];
  row: number;
  tryCol?: number;
  mode?: "scan" | "place" | "back" | "stuck" | "done";
  start?: number[];
  onCell?: (r: number, c: number) => void;
}) {
  const placed = at.filter((c) => c >= 0).length;
  return (
    <div className="algo-queen-board" style={{ gridTemplateColumns: `auto repeat(${n}, 52px)` }} role="img" aria-label={`${n}×${n} 보드. 퀸 ${placed}개가 놓여 있습니다`}>
      <div className="algo-queen-corner" aria-hidden="true" />
      {Array.from({ length: n }, (_, c) => (
        <span key={`h${c}`} className="algo-queen-axis" aria-hidden="true">
          칸 {c}
        </span>
      ))}
      {Array.from({ length: n }, (_, r) => (
        <Fragment key={r}>
        <span className="algo-queen-axis algo-queen-axis-row" aria-hidden="true">
          줄 {r}
        </span>
        {Array.from({ length: n }, (_, c) => {
          const queen = at[r] === c;
          const live = r === row && row < n;
          const hit = !queen && r >= row ? attackedBy(at, r, c) : null;
          const safe = live && !queen && !hit;
          const tried = live && start !== undefined && c < start[row] && !queen;
          const removed = r === row && mode === "back" && c === tryCol && !queen;
          const fresh = mode === "place" && r === row && c === tryCol && queen;
          const cls = "algo-queen-cell";
          const data = {
            "data-queen": queen ? "" : undefined,
            "data-hit": hit ? "" : undefined,
            "data-safe": safe && !tried ? "" : undefined,
            "data-tried": tried ? "" : undefined,
            "data-live": live ? "" : undefined,
            "data-removed": removed ? "" : undefined,
            "data-fresh": fresh ? "" : undefined,
          };
          const label = queen ? "퀸" : removed ? "거둔 칸" : "";
          return onCell ? (
            <button
              key={`${r}-${c}`}
              type="button"
              className={cls}
              {...data}
              onClick={() => onCell(r, c)}
              aria-label={`줄 ${r} 칸 ${c}${queen ? " 퀸" : hit ? " 노리는 칸" : safe ? " 놓을 수 있는 칸" : ""}`}
            >
              {queen ? "♛" : ""}
            </button>
          ) : (
            <span key={`${r}-${c}`} className={cls} {...data} aria-label={label || undefined}>
              {queen ? "♛" : removed ? "×" : ""}
            </span>
          );
        })}
        </Fragment>
      ))}
    </div>
  );
}

/** 보드 아래 한 줄 범례. */
export function QueenLegend() {
  return (
    <p className="algo-queen-legend">
      <i data-k="queen">♛</i> 퀸 <i data-k="safe" /> 놓을 수 있는 칸 <i data-k="hit" /> 퀸이 노리는 칸
    </p>
  );
}
