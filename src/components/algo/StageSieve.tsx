import type { StageState } from "@/lib/algo/types";

/**
 * 수 격자 무대 — 어느 수가 **어떤 순서로** 지워지는지가 그림의 내용이다.
 *
 * 지워진 수는 흐리게 줄이 그어지고, 지금 보는 수(`i`)는 테두리가 서고, 이번에 지울 배수(`plan`)는 점선,
 * 방금 새로 지운 수(`fresh`)는 노랗게 보인다. 끝나면(`done`) 남은 수가 초록색으로 강조된다.
 * 칸 색은 `data-*` 속성으로 정한다 — `.algo-gcell` 류에 덮이지 않게 격자 전용 클래스를 쓴다.
 */
export function StageSieve({ state }: { state: StageState }) {
  if (!state.sieve) return null;
  const { n, erased, i, plan, fresh, done } = state.sieve;
  const planSet = new Set(plan ?? []);
  const freshSet = new Set(fresh ?? []);
  let left = 0;
  for (let m = 2; m <= n; m++) if (!erased[m]) left++;

  return (
    <div className="algo-grid-wrap">
      <p className="algo-sieve-count">
        남은 수 <b>{left}</b>개
      </p>
      <div className="algo-sieve-grid" role="img" aria-label={`1부터 ${n}까지 수 격자. 남은 수 ${left}개`}>
        {Array.from({ length: n }, (_, k) => k + 1).map((m) => (
          <span
            key={m}
            className="algo-sieve-cell"
            data-state={erased[m] ? "erased" : done ? "prime" : "open"}
            data-now={m === i ? "" : undefined}
            data-plan={planSet.has(m) ? "" : undefined}
            data-fresh={freshSet.has(m) ? "" : undefined}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
