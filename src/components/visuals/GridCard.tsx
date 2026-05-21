import type { CSSProperties } from "react";
import { Frame } from "./Frame";
import { VisualIcon } from "./icon";
import { ACCENT_TOKENS, type Accent, type GridCardSpec } from "./types";

function accentVars(accent: Accent): CSSProperties {
  const t = ACCENT_TOKENS[accent];
  return { "--vis-fill": t.fill, "--vis-strong": t.strong } as CSSProperties;
}

/** 순서 없는 개념·구성요소를 아이콘 타일로 늘어놓는 카드. */
export function GridCard({ spec }: { spec: GridCardSpec }) {
  return (
    <Frame eyebrow={spec.eyebrow} title={spec.title}>
      <div className="vis-grid">
        {spec.items.map((item, i) => (
          <div
            className="vis-cell"
            key={i}
            style={accentVars(item.accent ?? spec.accent)}
          >
            <div className="vis-ico">
              <VisualIcon name={item.icon} size={19} />
            </div>
            <div className="vis-cell-tt">{item.title}</div>
            {item.description && (
              <div className="vis-cell-ds">{item.description}</div>
            )}
          </div>
        ))}
      </div>
    </Frame>
  );
}
