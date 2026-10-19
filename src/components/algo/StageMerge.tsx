import type { StageState } from "@/lib/algo/types";
import { cellClass } from "./cell-class";

/**
 * 두 줄 무대 — 위는 원래 줄 전체(지금 합치는 구간만 켜진다), 아래는 합쳐서 만드는 줄이다.
 *
 * 위 줄에서 왼쪽 묶음과 오른쪽 묶음 사이를 조금 띄워, 두 묶음이 어디서 갈리는지 보이게 한다.
 * 아래 줄은 합치는 구간의 칸 수만큼 자리를 잡아 두고, 카드가 내려올 때마다 앞에서부터 채운다.
 * 깃발 `i` `j` 는 코드 변수 그대로 — 각 묶음에서 아직 안 내려놓은 맨 앞 카드를 가리킨다.
 */
export function StageMerge({ values, state }: { values: number[]; state: StageState }) {
  const m = state.merge;
  if (values.length === 0 || !m) return <p className="algo-track-empty">카드가 없습니다</p>;

  const slots = m.hi - m.lo;
  const gapAt = m.mid > 0 ? m.lo + m.mid : -1;
  const flagsAt = new Map<number, string[]>();
  for (const [name, at] of Object.entries(state.flags)) {
    if (at < 0 || at >= values.length) continue;
    flagsAt.set(at, [...(flagsAt.get(at) ?? []), name]);
  }
  const newest = m.mode === "place" ? m.result.length - 1 : -1;

  return (
    <div
      className="algo-track algo-merge"
      role="img"
      aria-label={`카드 ${values.length}장. ${m.lo}번 칸부터 ${m.hi - 1}번 칸까지를 합칩니다. 합쳐서 만든 줄에는 ${m.result.length}장이 내려와 있습니다`}
    >
      <p className="algo-row-cap">원래 줄 — 켜진 칸이 지금 합치는 구간</p>
      <div className="algo-track-cells">
        {values.map((v, k) => (
          <div key={k} className={`algo-cell ${cellClass(state.cells[k] ?? "out")}${k === gapAt ? " algo-merge-gap" : ""}`}>
            <span className="algo-cell-value">{v}</span>
            <span className="algo-cell-index">{k}</span>
          </div>
        ))}
      </div>
      <div className="algo-track-flags">
        {values.map((_, k) => (
          <span key={k} className={`algo-flag${k === gapAt ? " algo-merge-gap" : ""}`}>
            {(flagsAt.get(k) ?? []).join("·")}
          </span>
        ))}
      </div>

      <p className="algo-row-cap">합쳐서 만드는 줄</p>
      <div className="algo-track-cells">
        {Array.from({ length: slots }, (_, k) =>
          k < m.result.length ? (
            <div key={k} className={`algo-cell ${k === newest ? "algo-cell-current" : "algo-cell-settled"}`}>
              <span className="algo-cell-value">{m.result[k]}</span>
            </div>
          ) : (
            <div key={k} className="algo-cell algo-cell-out algo-cell-blank">
              <span className="algo-cell-value">·</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
