import type { CSSProperties } from "react";
import { VisualIcon } from "./icon";
import { ACCENT_TOKENS, type CalloutCardSpec } from "./types";

/** 핵심 인사이트 박스 — 좌측 강조선 + 옅은 틴트의 단일 박스. */
export function CalloutCard({ spec }: { spec: CalloutCardSpec }) {
  const t = ACCENT_TOKENS[spec.accent];
  const style = {
    "--vis-fill": t.fill,
    "--vis-strong": t.strong,
  } as CSSProperties;
  return (
    <div className="vis vis-callout" style={style}>
      <div className="vis-ico">
        <VisualIcon name={spec.icon} size={20} />
      </div>
      <div className="vis-ct">
        <div className="vis-hd">{spec.heading}</div>
        {spec.body && <div className="vis-bd">{spec.body}</div>}
      </div>
    </div>
  );
}
