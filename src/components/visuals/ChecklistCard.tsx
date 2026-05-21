import type { CSSProperties } from "react";
import { Frame } from "./Frame";
import { VisualIcon } from "./icon";
import {
  ACCENT_TOKENS,
  type Accent,
  type CheckItemSpec,
  type ChecklistCardSpec,
} from "./types";

function accentVars(accent: Accent): CSSProperties {
  const t = ACCENT_TOKENS[accent];
  return { "--vis-fill": t.fill, "--vis-strong": t.strong } as CSSProperties;
}

/** state 별로 색·아이콘이 고정된다 — 권장(체크)·금지(엑스)·중립(대시). */
const CHECK_META: Record<
  CheckItemSpec["state"],
  { accent: Accent; icon: string }
> = {
  do: { accent: "success", icon: "check" },
  dont: { accent: "danger", icon: "x" },
  neutral: { accent: "mute", icon: "minus" },
};

/** 권장·금지 항목을 표시로 구분해 늘어놓는 카드. */
export function ChecklistCard({ spec }: { spec: ChecklistCardSpec }) {
  return (
    <Frame eyebrow={spec.eyebrow} title={spec.title}>
      <div className="vis-checklist">
        {spec.items.map((item, i) => {
          const meta = CHECK_META[item.state];
          return (
            <div className="vis-ck-row" key={i} style={accentVars(meta.accent)}>
              <div className="vis-ck-mark">
                <VisualIcon name={meta.icon} size={14} strokeWidth={2.6} />
              </div>
              <div className="vis-ck-tx">
                <div className="vis-ck-text">{item.text}</div>
                {item.caption && (
                  <div className="vis-ck-cap">{item.caption}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}
