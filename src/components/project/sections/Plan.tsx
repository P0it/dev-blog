// 기획 — 누구의 어떤 문제를, 어디까지 풀기로 했는지.
// 라벨을 왼쪽에 세워 항목끼리 눈으로 비교되게 한다.
export function Plan({ fields }: { fields: { label: string; value: string }[] }) {
  return (
    <dl className="lab-panel lab-plan lab-reveal">
      {fields.map((f, i) => (
        <div key={i} className="lab-plan-row">
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
