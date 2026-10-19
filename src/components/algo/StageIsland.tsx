import type { StageState } from "@/lib/algo/types";

/**
 * 섬 지도 무대 — 땅 한 덩어리가 칠해지는 **순서**가 그림의 내용이다.
 *
 * 바다는 비어 있고, 안 센 땅은 노랗고, 센 섬은 섬 번호(1·2·3)와 함께 섬마다 다른 색으로 칠해진다.
 * 지금 바깥 반복문이 훑는 칸(`scan`)에는 테두리가 서고, 큐에서 방금 꺼낸 칸(`now`)은 진하게 보인다.
 * 아래 큐는 지도와 한 덩어리로 보인다 — 큐에 든 칸이 지도의 어느 칸인지 이어서 봐야 한다.
 */
export function StageIsland({ state }: { state: StageState }) {
  if (!state.island) return null;
  const { cols, land, owner, queue, scan, now } = state.island;
  const queued = new Set(queue);
  const counted = new Set(owner.filter((o): o is number => o !== null)).size;

  return (
    <div className="algo-grid-wrap">
      <p className="algo-island-count">
        센 섬 <b>{counted}</b>개
      </p>
      <div
        className="algo-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 36px))` }}
        role="img"
        aria-label={`${land.length / cols}×${cols} 섬 지도. 센 섬 ${counted}개`}
      >
        {land.map((isLand, i) => {
          const o = owner[i];
          return (
            <span
              key={i}
              className="algo-gcell algo-island-cell"
              data-kind={isLand ? "land" : "sea"}
              data-owner={o ?? undefined}
              data-now={i === now ? "" : undefined}
              data-queued={queued.has(i) ? "" : undefined}
              data-scan={i === scan ? "" : undefined}
            >
              {o !== null ? o + 1 : isLand ? "땅" : ""}
            </span>
          );
        })}
      </div>

      <div className="algo-lane">
        <span className="algo-lane-label">큐</span>
        <span className="algo-lane-out">← 꺼낸다</span>
        <ol className="algo-lane-items">
          {queue.map((i) => (
            <li key={i}>
              {Math.floor(i / cols)},{i % cols}
            </li>
          ))}
          {queue.length === 0 && <li data-empty>비어 있음</li>}
        </ol>
        <span className="algo-lane-in">넣는다 →</span>
      </div>
    </div>
  );
}
