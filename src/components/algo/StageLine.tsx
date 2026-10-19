import type { StageState } from "@/lib/algo/types";

/**
 * 줄 무대 — 사람이 줄 맨 뒤로 들어와 맨 앞에서 나간다. 방금 드나든 사람은 진하게 보인다.
 *
 * 아래에 "받은 순서"와 **같은 일을 리스트 `pop(0)` 으로 했다면 한 칸씩 당겼을 칸 수**를 붙인다.
 * deque 는 사람이 나가도 남은 사람을 옮기지 않는다 — 그 차이가 숫자로 쌓이는 걸 눈으로 본다.
 */
export function StageLine({ state }: { state: StageState }) {
  const items = state.queue ?? [];
  const info = state.line;
  const served = info?.served ?? [];

  return (
    <div className="algo-qd-stage">
      <div className="algo-lane" role="img" aria-label={`줄에 ${items.length}명이 서 있습니다`}>
        <span className="algo-lane-label">줄</span>
        <span className="algo-lane-out">← 받고 나간다</span>
        <ol className="algo-lane-items">
          {items.map((n, i) => (
            <li key={i} data-hot={info?.hot === "back" && i === items.length - 1 ? "" : undefined}>
              {n}
            </li>
          ))}
          {items.length === 0 && <li data-empty>비어 있음</li>}
        </ol>
        <span className="algo-lane-in">서는 곳 →</span>
      </div>

      <p className="algo-qd-served">
        <span className="algo-qd-served-label">받은 순서</span>
        {served.length === 0 && <span className="algo-qd-none">아직 없음</span>}
        {served.map((n, i) => (
          <span key={i} className="algo-qd-chip" data-hot={info?.hot === "front" && i === served.length - 1 ? "" : undefined}>
            {n}
          </span>
        ))}
      </p>

      <div className="algo-qd-shift">
        <span>
          리스트 <code>pop(0)</code> 이었다면 당긴 칸 <b>{info?.shifted ?? 0}</b>
        </span>
        <span>
          deque 는 <b>0</b>
        </span>
      </div>
    </div>
  );
}
