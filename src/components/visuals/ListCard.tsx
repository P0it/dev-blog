import type { CSSProperties } from "react";
import { ACCENT_TOKENS, type ListCardSpec } from "./types";

/** 리스트/요약 카드 — 타이틀+항목을 단정한 박스에 담는다 (accent는 텍스트 강조에). */
export function ListCard({ spec }: { spec: ListCardSpec }) {
  const t = ACCENT_TOKENS[spec.accent];
  const style = {
    "--vis-fill": t.fill,
    "--vis-strong": t.strong,
  } as CSSProperties;
  const hasHead = Boolean(spec.eyebrow || spec.title);
  return (
    <div className="vis vis-list" style={style}>
      <div className="vis-list-box">
        {hasHead && (
          <div className="vis-list-head">
            {spec.eyebrow && <div className="vis-list-eyebrow">{spec.eyebrow}</div>}
            {spec.title && <div className="vis-list-title">{spec.title}</div>}
          </div>
        )}
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
