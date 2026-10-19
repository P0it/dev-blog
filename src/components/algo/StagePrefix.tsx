import type { StageState } from "@/lib/algo/types";
import { cellClass } from "./cell-class";

/**
 * 두 줄 칸 트랙 — 위는 원래 배열, 아래는 그 배열에서 파생한 줄(누적합).
 *
 * 아래 줄은 위보다 한 칸 길다. 아래 `k` 번 칸 = "앞에서 k칸을 더한 값" 이라, 같은 가운데 정렬로 그리면
 * 위 `k` 번 칸의 **왼쪽 경계** 바로 아래에 선다. 값이 아직 없는 칸은 빈 칸으로 자리만 잡아 둔다.
 */
export function StagePrefix({ values, state }: { values: number[]; state: StageState }) {
  const below = state.below;
  const slots = values.length + 1;

  const flagsOf = (flags: Record<string, number>, len: number) => {
    const at = new Map<number, string[]>();
    for (const [name, k] of Object.entries(flags)) {
      if (k < 0 || k >= len) continue;
      at.set(k, [...(at.get(k) ?? []), name]);
    }
    return at;
  };
  const topFlags = flagsOf(state.flags, values.length);
  const belowFlags = flagsOf(below?.flags ?? {}, slots);

  return (
    <div
      className="algo-track algo-prefix"
      role="img"
      aria-label={`방문자 수 ${values.length}칸과, 그 앞에서부터 더해 깔아 둔 줄 ${below?.values.length ?? 0}칸`}
    >
      <p className="algo-row-cap">방문자 수</p>
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
            {(topFlags.get(i) ?? []).join("·")}
          </span>
        ))}
      </div>

      <p className="algo-row-cap">앞에서 k칸을 더한 값 (작은 숫자가 k)</p>
      <div className="algo-track-cells">
        {Array.from({ length: slots }, (_, k) => {
          const have = below && k < below.values.length;
          return have ? (
            <div key={k} className={`algo-cell ${cellClass(below.cells[k] ?? "out")}`}>
              <span className="algo-cell-value">{below.values[k]}</span>
              <span className="algo-cell-index">{k}</span>
            </div>
          ) : (
            <div key={k} className="algo-cell algo-cell-out algo-cell-blank">
              <span className="algo-cell-value">·</span>
              <span className="algo-cell-index">{k}</span>
            </div>
          );
        })}
      </div>
      <div className="algo-track-flags">
        {Array.from({ length: slots }, (_, k) => (
          <span key={k} className="algo-flag">
            {(belowFlags.get(k) ?? []).join("·")}
          </span>
        ))}
      </div>
    </div>
  );
}
