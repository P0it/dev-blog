import type { StageState } from "@/lib/algo/types";

/**
 * 경우를 한 줄씩 적는 표 — 완전탐색이 훑는 경우가 한눈에 보인다.
 *
 * 지금 보는 줄은 진하게, 한도를 넘어 버린 줄은 흐리게, 지금까지 최고 값을 쥔 줄에는 ★ 를 단다.
 * 상태 없이 서버에서 그려도 되는 순수 표시 컴포넌트다.
 */
export function StageTable({ table }: { table: NonNullable<StageState["table"]> }) {
  return (
    <table className="algo-table">
      <thead>
        <tr>
          {table.head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((r, i) => (
          <tr key={i} className={`algo-trow ${r.state}`}>
            {r.cells.map((c, k) => (
              <td key={k}>{k === 0 && r.state === "best" ? `★ ${c}` : c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
