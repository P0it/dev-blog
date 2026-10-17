import type { StageState } from "@/lib/algo/types";
import { cellClass } from "./cell-class";

/**
 * 칸 트랙 — 배열·리스트를 한 줄로 그린다. 칸 아래에 `left` `mid` `right` 깃발이 꽂힌다.
 *
 * 전환은 CSS 가 맡는다(globals.css `.algo-track`). 값이 비면 아무것도 그리지 않는다.
 */
export function StageTrack({
  values,
  state,
}: {
  values: number[];
  state: StageState;
}) {
  if (values.length === 0) {
    return <p className="algo-track-empty">배열이 비어 있습니다</p>;
  }

  // 칸 번호 → 그 칸에 꽂힌 깃발 이름들
  const flagsAt = new Map<number, string[]>();
  for (const [name, at] of Object.entries(state.flags)) {
    if (at < 0 || at >= values.length) continue;
    flagsAt.set(at, [...(flagsAt.get(at) ?? []), name]);
  }

  return (
    <div className="algo-track" role="img" aria-label={trackLabel(values, state)}>
      <div className="algo-track-cells">
        {values.map((v, i) => (
          <div key={i} className={`algo-cell ${cellClass(state.cells[i] ?? "out")}`}>
            <span className="algo-cell-value">{v}</span>
            <span className="algo-cell-index">{i}</span>
          </div>
        ))}
      </div>
      <div className="algo-track-flags">
        {values.map((_, i) => (
          <span key={i} className="algo-flag">
            {(flagsAt.get(i) ?? []).join("·")}
          </span>
        ))}
      </div>
    </div>
  );
}

function trackLabel(values: number[], state: StageState): string {
  const parts = Object.entries(state.flags).map(([n, at]) => `${n}은 ${at}번 칸`);
  return `${values.length}칸 배열. ${parts.join(", ")}`;
}
