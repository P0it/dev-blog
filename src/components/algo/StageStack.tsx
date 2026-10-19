import type { StageState } from "@/lib/algo/types";
import { cellClass } from "./cell-class";

/** 스택에 최대 몇 칸을 그릴 자리를 잡아 둘지 — 쌓였다 걷혀도 그림이 들썩이지 않게 한다. */
const SLOTS = 3;

/**
 * 괄호 검사 무대 — 위는 읽는 글자 한 줄, 아래는 세로로 쌓이는 스택.
 *
 * 스택은 한쪽만 열려 있다. 위가 맨 위(가장 나중에 넣은 것)이고 새 글자는 항상 거기에 얹힌다.
 * 상태 없이 서버에서 그려도 되는 순수 표시 컴포넌트다.
 */
export function StageStack({ state }: { state: StageState }) {
  const chars = state.chars ?? [];
  const stack = state.stack ?? [];
  const cursor = state.flags.i;
  const top = stack.length - 1;

  return (
    <div
      className="algo-bracket"
      role="img"
      aria-label={`글자 ${chars.length}개를 읽는 중. 스택에는 ${stack.length}개: ${stack.join(" ") || "비어 있음"}`}
    >
      <p className="algo-row-cap">읽는 글자</p>
      <div className="algo-track-cells">
        {chars.map((c, i) => (
          <div key={i} className={`algo-cell ${cellClass(state.cells[i] ?? "out")}`}>
            <span className="algo-cell-value">{c}</span>
          </div>
        ))}
      </div>
      <div className="algo-track-flags">
        {chars.map((_, i) => (
          <span key={i} className="algo-flag">
            {i === cursor ? "지금" : ""}
          </span>
        ))}
      </div>

      <p className="algo-row-cap">스택 (위가 맨 위)</p>
      <div className="algo-stack-well" style={{ minHeight: `${SLOTS * 38 + 10}px` }}>
        {stack.length === 0 && <span className="algo-stack-empty">비어 있음</span>}
        {stack.map((c, i) => (
          <div key={i} className={`algo-cell algo-stack-item ${i === top ? "algo-cell-current" : "algo-cell-waiting"}`}>
            <span className="algo-cell-value">{c}</span>
            {i === top && <span className="algo-stack-tag">맨 위</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
