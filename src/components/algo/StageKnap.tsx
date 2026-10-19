import type { StageState } from "@/lib/algo/types";

type Knap = NonNullable<StageState["knap"]>;

/**
 * 0/1 배낭 표 — 행은 물건을 몇 개까지 봤는지, 열은 가방 용량이다.
 *
 * 칸 하나가 곧 "이 물건까지 보고 이 용량일 때 담을 수 있는 최대 가치"다. 지금 채우는 칸(진하게)과
 * 그 칸이 읽는 칸(노랗게)을 같이 보인다. `blank` 가 있으면 아직 안 채운 칸을 그 글자로 가린다(해 보기).
 * `onCell` 이 있으면 칸이 눌린다. 상태 없이 서버에서 그려도 되는 표시 컴포넌트다.
 */
export function KnapTable({
  knap,
  blank,
  onCell,
  disabled,
}: {
  knap: Knap;
  blank?: string;
  onCell?: (i: number, w: number) => void;
  disabled?: boolean;
}) {
  const { items, W, dp, done, cur, from } = knap;
  const isFrom = (i: number, w: number) => (from ?? []).some(([a, b]) => a === i && b === w);

  const state = (i: number, w: number) => {
    if (cur && cur[0] === i && cur[1] === w) return "cur";
    if (isFrom(i, w)) return "from";
    if (i === 0 || w === 0) return "base";
    return done[i][w] ? "done" : "todo";
  };

  return (
    <div className="algo-knap-wrap">
      <table className="algo-knap-table" aria-label="물건을 담을 때 가방 용량별 최대 가치 표">
        <thead>
          <tr>
            <th scope="col" className="algo-knap-corner">
              가방 용량 →
            </th>
            {Array.from({ length: W + 1 }, (_, w) => (
              <th key={w} scope="col" className="algo-knap-colh">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dp.map((row, i) => (
            <tr key={i}>
              <th scope="row" className="algo-knap-rowh">
                {i === 0 ? (
                  <b>물건 0개</b>
                ) : (
                  <>
                    <b>{items[i - 1].name}까지</b>
                    <small>
                      무게 {items[i - 1].w} · 값 {items[i - 1].v}
                    </small>
                  </>
                )}
              </th>
              {row.map((v, w) => {
                const s = state(i, w);
                // 해 보기에서는 지금 고르는 칸의 값도 가린다 — 고르기 전에 답이 보이면 안 된다
                const hidden = blank !== undefined && !done[i][w];
                const text = hidden ? blank : v;
                const label =
                  i === 0 ? `물건 0개 용량 ${w} 값 ${v}` : `${items[i - 1].name}까지 용량 ${w} ${hidden ? "아직 비어 있음" : `값 ${v}`}`;
                return (
                  <td key={w}>
                    {onCell && i > 0 && w > 0 ? (
                      <button
                        type="button"
                        className="algo-knap-c"
                        data-s={s}
                        onClick={() => onCell(i, w)}
                        disabled={disabled}
                        aria-label={label}
                      >
                        {text}
                      </button>
                    ) : (
                      <span className="algo-knap-c" data-s={s} role="img" aria-label={label}>
                        {text}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
