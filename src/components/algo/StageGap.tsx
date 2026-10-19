import type { StageState } from "@/lib/algo/types";
import { cellClass } from "./cell-class";

/**
 * 줄 서기 무대 — 칸 트랙에 **빈자리**가 하나 있고 한 칸씩 앞으로 옮겨 온다.
 *
 * 빈자리(`state.gap`)는 값을 숨기고 점선 칸으로 그린다. 파이썬 리스트에는 밀고 난 자리에 옛 복사본이
 * 남아 있지만, 독자가 볼 것은 "이 칸은 곧 덮어쓸 자리"라는 사실이라 값 대신 빈칸으로 보인다.
 * 새로 온 사람(`state.queue[0]`)은 줄 위쪽에서 기다린다. 자리를 잡으면 사라진다.
 */
export function StageGap({ values, state }: { values: number[]; state: StageState }) {
  const gap = state.gap;
  const waiting = state.queue?.[0];

  const flagsAt = new Map<number, string[]>();
  for (const [name, at] of Object.entries(state.flags)) {
    if (at < 0 || at >= values.length) continue;
    flagsAt.set(at, [...(flagsAt.get(at) ?? []), name]);
  }
  if (gap !== undefined && gap >= 0 && gap < values.length) {
    flagsAt.set(gap, [...(flagsAt.get(gap) ?? []), "빈자리"]);
  }

  return (
    <div className="algo-track algo-gap" role="img" aria-label={`${values.length}칸 줄. 빈자리는 ${gap ?? "없음"}번 칸`}>
      <div className="algo-gap-wait" data-gone={waiting === undefined}>
        <span>새로 온 사람</span>
        <div className="algo-cell algo-cell-waiting">
          <span className="algo-cell-value">{waiting ?? ""}</span>
        </div>
      </div>
      <div className="algo-track-cells">
        {values.map((v, i) =>
          i === gap ? (
            <div key={i} className="algo-cell algo-gap-slot">
              <span className="algo-cell-value" aria-hidden="true" />
              <span className="algo-cell-index">{i}</span>
            </div>
          ) : (
            <div key={i} className={`algo-cell ${cellClass(state.cells[i] ?? "out")}`}>
              <span className="algo-cell-value">{v}</span>
              <span className="algo-cell-index">{i}</span>
            </div>
          ),
        )}
      </div>
      <div className="algo-track-flags">
        {values.map((_, i) => (
          <span key={i} className="algo-flag">
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
