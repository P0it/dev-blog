import type { KeyboardEvent } from "react";
import type { StageState } from "@/lib/algo/types";
import { parentOf } from "@/lib/algo/heap";
import { cellClass } from "./cell-class";

/** 접수대에 앉을 수 있는 자리 수. 7칸이면 층이 셋(1 + 2 + 4)이라 한 화면에 나무와 배열이 같이 들어온다. */
const SLOTS = 7;

/** 나무 그림의 자리 좌표. 0번이 맨 위, 아래로 갈수록 층이 내려간다. */
const POS: [number, number][] = [
  [280, 26],
  [150, 76],
  [410, 76],
  [85, 126],
  [215, 126],
  [345, 126],
  [475, 126],
];

/**
 * 접수대 무대 — 위는 나무, 아래는 같은 환자들을 한 줄로 늘어놓은 배열.
 *
 * 나무의 위쪽 칸이 배열의 앞쪽 칸이다. 아직 아무도 안 앉은 자리는 점선으로 비워 둔다 — 환자가 앉아도 그림이 들썩이지 않는다.
 * `onPick` 을 주면 나무의 자리를 눌러 볼 수 있다(① 해 보기). 상태 없이 서버에서 그려도 되는 순수 표시 컴포넌트다.
 */
export function StageHeap({ state, onPick }: { state: StageState; onPick?: (i: number) => void }) {
  const values = state.values ?? [];
  const flagsAt = new Map<number, string[]>();
  for (const [name, at] of Object.entries(state.flags)) {
    if (at < 0 || at >= SLOTS) continue;
    flagsAt.set(at, [...(flagsAt.get(at) ?? []), name]);
  }

  return (
    <div
      className="algo-heap"
      role="img"
      aria-label={`접수대에 환자 ${values.length}명. 위에서부터 ${values.join(", ")}`}
    >
      <svg className="algo-heap-tree" viewBox="0 0 560 150">
        {POS.slice(1).map(([x, y], k) => {
          const i = k + 1;
          if (i >= values.length) return null;
          const [px, py] = POS[parentOf(i)];
          return <line key={`e${i}`} className="algo-heap-edge" x1={px} y1={py} x2={x} y2={y} />;
        })}
        {POS.map(([x, y], i) => {
          if (i >= values.length) {
            return (
              <g key={i} className="algo-heap-node algo-heap-blank">
                <circle cx={x} cy={y} r={17} />
              </g>
            );
          }
          const s = state.cells[i] ?? "out";
          const tag = (flagsAt.get(i) ?? []).join("·");
          const click = onPick ? { tabIndex: 0, role: "button", onClick: () => onPick(i), onKeyDown: (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPick(i);
            }
          } } : {};
          return (
            <g key={i} className="algo-heap-node" data-s={s} data-click={onPick ? "" : undefined} aria-label={onPick ? `${i}번 자리의 환자 ${values[i]}` : undefined} {...click}>
              <circle cx={x} cy={y} r={17} />
              <text x={x} y={y}>
                {values[i]}
              </text>
              {tag && (
                <text className="algo-heap-tag" x={x + 25} y={y - 11}>
                  {tag}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="algo-heap-row">
        <p className="algo-row-cap">같은 환자들을 한 줄로 (칸 번호 = 자리 번호)</p>
        <div className="algo-track-cells">
          {Array.from({ length: SLOTS }, (_, i) =>
            i < values.length ? (
              <div key={i} className={`algo-cell ${cellClass(state.cells[i] ?? "out")}`}>
                <span className="algo-cell-value">{values[i]}</span>
                <span className="algo-cell-index">{i}</span>
              </div>
            ) : (
              <div key={i} className="algo-cell algo-cell-out algo-heap-slot-blank">
                <span className="algo-cell-index">{i}</span>
              </div>
            ),
          )}
        </div>
        <div className="algo-track-flags">
          {Array.from({ length: SLOTS }, (_, i) => (
            <span key={i} className="algo-flag">
              {(flagsAt.get(i) ?? []).join("·")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
