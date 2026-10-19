import { PILES, LIMIT_HOURS, hoursFor } from "@/lib/algo/parametric-search";

/**
 * ③ 조건 짚기 그림 — 속도 1~11 이 한 줄로 서서 안 됨(✘)에서 됨(✔)으로 **한 번만** 바뀐다.
 * 칸 아래는 그 속도로 걸리는 시간이다. 서버 컴포넌트라 상태가 없다.
 */
export function ParamLine() {
  const max = Math.max(...PILES);
  const speeds = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <figure className="algo-param-line">
      <div className="algo-param-line-cells" role="img" aria-label="속도 1부터 11까지, 안 됨이 이어지다가 됨으로 한 번만 바뀐다">
        {speeds.map((s) => {
          const h = hoursFor(PILES, s);
          const ok = h <= LIMIT_HOURS;
          return (
            <span key={s} className="algo-cell algo-cell-out" data-ok={String(ok)}>
              <span className="algo-cell-value">{s}</span>
              <span className="algo-param-line-mark">{ok ? "✔" : "✘"}</span>
              <span className="algo-param-line-hours">{h}시간</span>
            </span>
          );
        })}
      </div>
      <figcaption>속도가 1에서 {max}까지 오르는 동안 안 됨이 이어지다가 됨으로 단 한 번 바뀝니다. 그 바뀌는 자리가 답입니다.</figcaption>
    </figure>
  );
}
