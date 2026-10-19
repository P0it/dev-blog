import { mergeLevels } from "@/lib/algo/merge-sort";

/**
 * 반으로 쪼개는 모양 — 정적 그림 한 컷. 여덟 장이 한 장씩이 될 때까지 쪼개진다.
 *
 * 각 묶음 아래의 색 숫자는 그 묶음을 합쳐서 정렬한 모양이다(한 장짜리는 그대로라 생략). 위 줄로 올라올수록
 * 합쳐진 묶음이 길어진다. 2 의 거듭제곱 장수(8장)에서만 칸이 반듯하게 맞는다.
 * 클라이언트 상태가 없어 서버에서 그린다.
 */
export function MergeTree({ cards }: { cards: number[] }) {
  const levels = mergeLevels(cards);
  const W = 76;
  const ROW = 92;
  const width = cards.length * W + 16;
  const height = levels.length * ROW;

  /** 한 층에서 `k` 번째 묶음의 가운데 x. 앞 묶음들이 차지한 카드 수만큼 밀린다. */
  const centerX = (level: (typeof levels)[number], k: number) => {
    const before = level.slice(0, k).reduce((a, x) => a + x.cards.length, 0);
    return 8 + (before + level[k].cards.length / 2) * W;
  };

  return (
    <figure className="algo-merge-tree">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`카드 ${cards.length}장을 반으로 ${levels.length - 1}번 쪼개면 한 장씩이 된다`}
      >
        {levels.map((level, d) =>
          level.map((node, k) => {
            const cx = centerX(level, k);
            const y = 18 + d * ROW;
            const boxW = node.cards.length * 17 + 22;
            // 위 층에서 이 묶음을 품은 묶음 — 이 묶음의 첫 카드가 속한 묶음이다
            let parentX: number | null = null;
            if (d > 0) {
              const first = level.slice(0, k).reduce((a, x) => a + x.cards.length, 0);
              let s = 0;
              levels[d - 1].forEach((p, pk) => {
                if (first >= s && first < s + p.cards.length) parentX = centerX(levels[d - 1], pk);
                s += p.cards.length;
              });
            }
            return (
              <g key={`${d}-${k}`}>
                {parentX !== null && (
                  <line className="algo-merge-tree-edge" x1={parentX} y1={y - ROW + 40} x2={cx} y2={y - 14} />
                )}
                <rect className="algo-merge-tree-box" x={cx - boxW / 2} y={y - 14} width={boxW} height={28} rx={8} />
                <text className="algo-merge-tree-text" x={cx} y={y}>
                  {node.cards.join(" ")}
                </text>
                {node.cards.length > 1 && (
                  <text className="algo-merge-tree-sorted" x={cx} y={y + 27}>
                    {node.sorted.join(" ")}
                  </text>
                )}
              </g>
            );
          }),
        )}
      </svg>
      <figcaption>
        위에서 아래로 쪼개고, 아래에서 위로 합칩니다. 묶음 아래의 색 숫자가 합쳐서 정렬한 모양입니다.
      </figcaption>
    </figure>
  );
}
