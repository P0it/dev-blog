import type { CSSProperties } from "react";
import { ACCENT_TOKENS, type BulletCardSpec } from "./types";

/** 불릿 카드 — 한 줄 라벨만 짧게 나열. 키·설명이 필요하면 list-card. */
export function BulletCard({ spec }: { spec: BulletCardSpec }) {
  const t = ACCENT_TOKENS[spec.accent];
  const style = {
    "--vis-fill": t.fill,
    "--vis-strong": t.strong,
  } as CSSProperties;
  return (
    <div className="vis vis-bullet" style={style}>
      {spec.eyebrow && <div className="vis-bullet-eyebrow">{spec.eyebrow}</div>}
      {spec.title && <div className="vis-bullet-title">{spec.title}</div>}
      <div className="vis-bullet-box">
        <ul className="vis-bullet-items">
          {spec.items.map((text, i) => (
            <li key={i} className="vis-bullet-item">
              <span className="vis-bullet-dot" aria-hidden />
              <span className="vis-bullet-text">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
