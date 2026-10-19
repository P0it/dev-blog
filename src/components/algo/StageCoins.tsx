import type { StageState } from "@/lib/algo/types";

/**
 * 거스름돈 무대 — 남은 돈, 큰 동전부터 늘어놓은 동전 줄, 바구니에 담은 동전.
 * 지금 보는 동전은 진하게, 이미 지나온 동전은 흐리게 그린다. 서버에서도 그릴 수 있게 상태가 없다.
 */
export function StageCoins({ state }: { state: StageState }) {
  const c = state.coins;
  if (!c) return null;

  return (
    <div className="algo-coin-stage">
      <p className="algo-coin-left">
        남은 돈 <b>{c.left}</b>원
      </p>

      <ol className="algo-coin-row" aria-label="동전 줄(큰 것부터)">
        {c.values.map((v, i) => (
          <li
            key={i}
            className="algo-coin-btn"
            data-state={c.at === i ? "now" : c.at !== null && i < c.at ? "past" : "wait"}
          >
            {v}원
          </li>
        ))}
      </ol>

      <p className="algo-coin-given-label">
        바구니 <b>{c.given.length}</b>개
      </p>
      <ol className="algo-coin-given" aria-label="바구니에 담은 동전">
        {c.given.length === 0 ? (
          <li className="algo-coin-none">아직 없음</li>
        ) : (
          c.given.map((v, i) => (
            <li key={i} className="algo-coin-chip">
              {v}
            </li>
          ))
        )}
      </ol>
    </div>
  );
}
