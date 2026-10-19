import type { StageState } from "@/lib/algo/types";

/**
 * 타일 바닥 무대 — 긴 변 × 짧은 변 직사각형에 지금까지 깐 정사각형과 아직 못 깐 바닥을 그린다.
 *
 * 정사각형은 반복(k) 번호별로 색을 돌려 쓰고, 방금 깐 반복(now)은 진하게 그린다. 칸마다 한 변의 길이를 적는다.
 * 남은 바닥은 점선 테두리다. 서버에서도 그릴 수 있게 상태가 없다.
 */
export function StageTiles({ state }: { state: StageState }) {
  const t = state.tiles;
  if (!t) return null;
  if (t.h === 0) return <p className="algo-gcd-empty">한 변이 0 이라 깔 바닥이 없어요</p>;

  const scale = Math.min(440 / t.w, 150 / t.h);
  const W = t.w * scale;
  const H = t.h * scale;
  const PAD = 26;

  return (
    <svg
      className="algo-gcd-svg"
      viewBox={`0 0 ${W + PAD * 2} ${H + PAD * 1.6}`}
      role="img"
      aria-label={`${t.w}×${t.h} 바닥에 정사각형 ${t.squares.length}개를 깔았습니다`}
    >
      <rect className="algo-gcd-floor" x={PAD} y={PAD / 2} width={W} height={H} />
      {t.region && (
        <rect
          className="algo-gcd-region"
          x={PAD + t.region.x * scale}
          y={PAD / 2 + t.region.y * scale}
          width={t.region.w * scale}
          height={t.region.h * scale}
        />
      )}
      {t.squares.map((q, i) => (
        <g key={i}>
          <rect
            className="algo-gcd-sq"
            data-c={(q.k - 1) % 3}
            data-now={q.k === t.now}
            x={PAD + q.x * scale}
            y={PAD / 2 + q.y * scale}
            width={q.s * scale}
            height={q.s * scale}
          />
          {q.s * scale >= 18 && (
            <text className="algo-gcd-label" x={PAD + (q.x + q.s / 2) * scale} y={PAD / 2 + (q.y + q.s / 2) * scale}>
              {q.s}
            </text>
          )}
        </g>
      ))}
      <text className="algo-gcd-dim" x={PAD + W / 2} y={PAD / 2 + H + 17}>
        {t.w}
      </text>
      <text className="algo-gcd-dim" x={PAD - 8} y={PAD / 2 + H / 2} transform={`rotate(-90 ${PAD - 8} ${PAD / 2 + H / 2})`}>
        {t.h}
      </text>
    </svg>
  );
}
