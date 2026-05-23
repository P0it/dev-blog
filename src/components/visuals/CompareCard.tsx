import type { CSSProperties } from "react";
import { Frame } from "./Frame";
import { VisualIcon } from "./icon";
import { ACCENT_TOKENS, type Accent, type CompareCardSpec } from "./types";

function accentVars(accent: Accent): CSSProperties {
  const t = ACCENT_TOKENS[accent];
  return { "--vis-fill": t.fill, "--vis-strong": t.strong } as CSSProperties;
}

/** 두세 가지를 나란히 견주는 카드 — 칼럼마다 헤더 + 항목 목록. */
export function CompareCard({ spec }: { spec: CompareCardSpec }) {
  return (
    <Frame eyebrow={spec.eyebrow} title={spec.title}>
      <div className="vis-compare" data-cols={spec.columns.length}>
        {spec.columns.map((col, i) => {
          const colAccent = col.accent ?? spec.accent;
          return (
          <div
            className="vis-col"
            key={i}
            data-accent={colAccent}
            style={accentVars(colAccent)}
          >
            <div className="vis-col-hd">
              {col.icon && (
                <div className="vis-ico">
                  <VisualIcon name={col.icon} size={16} />
                </div>
              )}
              <div className="vis-col-tx">
                <div className="vis-col-lb">{col.label}</div>
                {col.caption && (
                  <div className="vis-col-cap">{col.caption}</div>
                )}
              </div>
            </div>
            <div className="vis-col-pts">
              {col.points.map((point, j) => (
                <div className="vis-pt" key={j}>
                  {point}
                </div>
              ))}
            </div>
          </div>
          );
        })}
      </div>
    </Frame>
  );
}
