// 기획 — 누구의 어떤 문제를, 어디까지 풀기로 했는지.
// 같은 라벨이 여러 값을 가지므로(문제 셋, 넣지 않은 것 다섯) 라벨은 한 번만 세우고
// 값을 그 아래에 쌓는다. 라벨을 줄마다 반복하면 눈이 그 열을 계속 다시 읽는다.
export function Plan({ fields }: { fields: { label: string; values: string[] }[] }) {
  return (
    <dl className="lab-panel lab-plan lab-reveal">
      {fields.map((f, i) => (
        <div key={i} className="lab-plan-row">
          <dt>{f.label}</dt>
          <dd>
            {f.values.length === 1 ? (
              f.values[0]
            ) : (
              <ul>
                {f.values.map((v, j) => (
                  <li key={j}>{v}</li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
