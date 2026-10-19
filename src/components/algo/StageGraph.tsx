import type { KeyboardEvent } from "react";
import type { StageState } from "@/lib/algo/types";
import { NAMES, EDGES } from "@/lib/algo/dijkstra";
import { cellClass } from "./cell-class";

/** 지도 위 여섯 곳의 자리(S A B C D E 순서). */
const POS: [number, number][] = [
  [60, 120],
  [190, 50],
  [190, 190],
  [360, 50],
  [360, 190],
  [500, 120],
];
/** 곳 위·아래에 적는 '지금까지 가장 빠른 시간' 의 자리 — 길 선과 겹치지 않는 바깥쪽. */
const TAG: [number, number][] = [
  [0, -30],
  [0, -30],
  [0, 34],
  [0, -30],
  [0, 34],
  [0, -30],
];

/**
 * 다익스트라 지도 무대 — 위는 곳과 길(걸리는 시간), 아래는 곳마다 지금까지 알려진 가장 빠른 시간(거리표).
 *
 * 길은 선, 시간은 선 위 숫자다. 확정한 곳은 초록, 방금 다루는 곳은 파랑, 견주는 이웃은 노랑, 길을 아는 후보는 보라, 모르는 곳(∞)은 흰색이다.
 * `showQueue` 면 큐에 든 `(거리, 곳)` 을 꺼낼 차례대로 아래에 늘어놓는다(④ 플레이어).
 * `onPick` 을 주면 곳을 눌러 볼 수 있다(① 해 보기). 상태 없이 서버에서 그려도 되는 순수 표시 컴포넌트다.
 */
export function StageGraph({
  state,
  onPick,
  showQueue = false,
}: {
  state: StageState;
  onPick?: (i: number) => void;
  showQueue?: boolean;
}) {
  const g = state.graph;
  if (!g) return null;
  const hot = (i: number, j: number) =>
    g.now !== undefined && g.look !== undefined && ((i === g.now && j === g.look) || (i === g.look && j === g.now));

  return (
    <div className="algo-dijk" role="img" aria-label={`지도. ${NAMES.map((n, i) => `${n} ${g.dist[i] === null ? "모름" : `${g.dist[i]}분`}`).join(", ")}`}>
      <svg className="algo-dijk-map" viewBox="0 0 560 240">
        {EDGES.map(([i, j, w]) => {
          const [x1, y1] = POS[i];
          const [x2, y2] = POS[j];
          return (
            <g key={`e${i}-${j}`} className="algo-dijk-edge" data-hot={hot(i, j) || undefined}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2}>
                {w}
              </text>
            </g>
          );
        })}
        {NAMES.map((name, i) => {
          const [x, y] = POS[i];
          const [tx, ty] = TAG[i];
          const s = state.cells[i] ?? "out";
          const d = g.dist[i];
          const click = onPick
            ? {
                tabIndex: 0,
                role: "button",
                onClick: () => onPick(i),
                onKeyDown: (e: KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPick(i);
                  }
                },
              }
            : {};
          return (
            <g
              key={name}
              className="algo-dijk-node"
              data-s={s}
              data-changed={g.changed?.includes(i) || undefined}
              data-click={onPick ? "" : undefined}
              aria-label={onPick ? `${name} ${d === null ? "길을 모르는 곳" : `${d}분`}` : undefined}
              {...click}
            >
              <circle cx={x} cy={y} r={20} />
              <text x={x} y={y}>
                {name}
              </text>
              <text className="algo-dijk-tag" x={x + tx} y={y + ty} data-known={d !== null || undefined}>
                {d === null ? "∞" : `${d}분`}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="algo-dijk-row">
        <p className="algo-row-cap">거리표 — 곳마다 지금까지 알려진 가장 빠른 시간(분)</p>
        <div className="algo-track-cells">
          {NAMES.map((name, i) => (
            <div key={name} className={`algo-cell ${cellClass(state.cells[i] ?? "out")}`} data-changed={g.changed?.includes(i) || undefined}>
              <span className="algo-cell-value">{g.dist[i] === null ? "∞" : g.dist[i]}</span>
              <span className="algo-cell-index">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {showQueue && (
        <div className="algo-dijk-queue" aria-label="큐">
          <span className="algo-row-cap">큐 (거리, 곳) — 왼쪽이 먼저 나감</span>
          <ol>
            {g.queue.length === 0 ? (
              <li className="algo-dijk-empty">비어 있음</li>
            ) : (
              g.queue.map(([d, i], k) => (
                <li key={`${d}-${i}-${k}`}>
                  ({d}, {NAMES[i]})
                </li>
              ))
            )}
          </ol>
        </div>
      )}
    </div>
  );
}
