import type { ListCardSpec } from "./types";

/** 리스트/요약 카드 — 타이틀은 바깥, 항목들은 단정한 박스 안에. */
export function ListCard({ spec }: { spec: ListCardSpec }) {
  return (
    <div className="vis vis-list">
      {spec.eyebrow && <div className="vis-list-eyebrow">{spec.eyebrow}</div>}
      {spec.title && <div className="vis-list-title">{spec.title}</div>}
      <div className="vis-list-box">
        <ul className="vis-list-items">
          {spec.items.map((item, i) => (
            <li key={i} className="vis-list-item">
              <div className="vis-list-lb">{item.label}</div>
              {item.description && (
                <div className="vis-list-desc">{item.description}</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
