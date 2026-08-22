// 규약상 두 번째 열이 "고른 것"이다. 열 수가 어긋나도 그냥 표로 떨어지게 두고,
// 강조는 두 번째 셀에만 건다.
export function TechChoices({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="lab-panel lab-tech lab-reveal">
      <table>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={j === 1 ? "pick" : undefined}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
