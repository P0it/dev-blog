// 기술 이름 + 고른 이유. 후보 비교가 아니라 나열이므로 첫 열을 강조한다.
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
                <td key={j} className={j === 0 ? "pick" : undefined}>
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
