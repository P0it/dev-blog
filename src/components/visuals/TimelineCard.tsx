import type { CSSProperties } from "react";
import { Frame } from "./Frame";
import { VisualIcon } from "./icon";
import { ACCENT_TOKENS, type Accent, type TimelineCardSpec } from "./types";

function accentVars(accent: Accent): CSSProperties {
  const t = ACCENT_TOKENS[accent];
  return { "--vis-fill": t.fill, "--vis-strong": t.strong } as CSSProperties;
}

/** 시간 순 흐름 — 세로 레일에 날짜·사건을 점으로 잇는 카드. */
export function TimelineCard({ spec }: { spec: TimelineCardSpec }) {
  return (
    <Frame eyebrow={spec.eyebrow} title={spec.title}>
      <div className="vis-timeline">
        {spec.events.map((event, i) => (
          <div
            className="vis-tl-row"
            key={i}
            style={accentVars(event.accent ?? spec.accent)}
          >
            <div className="vis-tl-rail">
              <div className="vis-tl-dot">
                {event.icon ? (
                  <VisualIcon name={event.icon} size={13} />
                ) : (
                  <span className="vis-tl-pip" />
                )}
              </div>
            </div>
            <div className="vis-tl-body">
              <div className="vis-tl-date">{event.date}</div>
              <div className="vis-tl-label">{event.label}</div>
              {event.description && (
                <div className="vis-tl-desc">{event.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}
