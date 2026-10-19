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
  hideIndex,
  labels,
}: {
  values: number[];
  state: StageState;
  /** 칸의 값이 곧 번호(속도 1~11 처럼)라 아래 칸 번호가 중복일 때 숨긴다 */
  hideIndex?: boolean;
  /** 숫자 대신 칸에 적을 글자(문자열의 한 글자씩). 길이는 values 와 같다 */
  labels?: string[];
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
    <div
      className={hideIndex ? "algo-track algo-track-noindex" : "algo-track"}
      role="img"
      aria-label={trackLabel(values, state)}
    >
      <div className="algo-track-cells">
        {values.map((v, i) => (
          <div key={i} className={`algo-cell ${cellClass(state.cells[i] ?? "out")}`}>
            <span className="algo-cell-value">{labels?.[i] ?? v}</span>
            <span className="algo-cell-index">{i}</span>
          </div>
        ))}
      </div>
      <div className="algo-track-flags">
        {values.map((_, i) => (
          <span key={i} className="algo-flag">
            {/* 깃발이 둘 이상 겹치면(left 와 right 가 같은 칸) 한 줄에 우겨 넣지 않고 위아래로 쌓는다 */}
            {(flagsAt.get(i) ?? []).map((name) => (
              <span key={name} className="algo-flag-name">
                {name}
              </span>
            ))}
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
