import type { StageState } from "@/lib/algo/types";

type Buckets = NonNullable<StageState["hash"]>["buckets"];

/**
 * 사물함 8칸 — 칸마다 이어 붙은 이름표가 위에서 아래로 쌓인다.
 * 지금 열어 본 칸(`hot`)은 진하게, 이름표가 둘 이상 이어 붙은 칸은 따로 표시한다.
 * `onPick` 이 있으면 칸이 버튼이 된다(① 해 보기). 없으면 그림만 그린다(④ 플레이어).
 */
export function Lockers({
  buckets,
  hot,
  onPick,
  label,
}: {
  buckets: Buckets;
  hot?: number;
  onPick?: (i: number) => void;
  label?: string;
}) {
  return (
    <ol className="algo-hash-lockers" aria-label={label ?? "사물함 8칸"}>
      {buckets.map((b, i) => {
        const inner = (
          <>
            <small className="algo-hash-no">{i}</small>
            <span className="algo-hash-items">
              {b.length === 0 && <i className="algo-hash-empty">빈 칸</i>}
              {b.map((n, k) => (
                <span key={`${n}-${k}`} className="algo-hash-item" data-chained={k > 0 ? "" : undefined}>
                  {n}
                </span>
              ))}
            </span>
          </>
        );
        const common = {
          className: "algo-hash-locker",
          "data-hot": hot === i ? "" : undefined,
          "data-clash": b.length > 1 ? "" : undefined,
        };
        return (
          <li key={i}>
            {onPick ? (
              <button type="button" onClick={() => onPick(i)} aria-label={`${i}번 칸`} {...common}>
                {inner}
              </button>
            ) : (
              <div {...common}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** 해시 무대 — 사물함과, 지금 다루는 이름표·훑은 개수를 한 줄로. */
export function StageHash({ state }: { state: StageState }) {
  const h = state.hash;
  if (!h) return null;

  return (
    <div className="algo-hash-stage">
      <Lockers buckets={h.buckets} hot={h.hot} />
      <p className="algo-hash-now">
        {h.name === undefined ? (
          <span className="algo-hash-none">지금 다루는 이름표 없음</span>
        ) : (
          <>
            이름표 <b>{h.name}</b>
            {h.hot !== undefined && (
              <>
                {" "}
                → <b>{h.hot}번</b> 칸
              </>
            )}
            {h.scan !== undefined && h.scan > 0 && (
              <>
                {" "}
                · 이 칸에서 훑은 이름표 <b>{h.scan}</b>개
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
}
