export type Integration = {
  name: string;
  fields: { label: string; value: string }[];
};

// 값이 URL 이면 그대로 링크로 건다. 출처를 눌러서 확인할 수 있어야
// 데이터 기반 프로젝트의 신뢰가 생긴다.
function FieldValue({ value }: { value: string }) {
  if (!/^https?:\/\//.test(value)) return <>{value}</>;
  return (
    <a className="lab-integ-link" href={value} target="_blank" rel="noreferrer">
      {value.replace(/^https?:\/\//, "").replace(/\/$/, "")}
    </a>
  );
}

export function Integrations({ items }: { items: Integration[] }) {
  return (
    <div className="lab-integ lab-stagger">
      {items.map((it, i) => (
        <div key={i} className="lab-panel lab-corner lab-integ-card">
          <div className="lab-integ-name">{it.name}</div>
          <dl className="lab-integ-rows">
            {it.fields.map((f, j) => (
              <div key={j} className="lab-integ-row">
                <dt className="lab-label">{f.label}</dt>
                <dd>
                  <FieldValue value={f.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
