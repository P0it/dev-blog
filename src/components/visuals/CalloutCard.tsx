import { Frame } from "./Frame";
import { VisualIcon } from "./icon";
import { ACCENT_TOKENS, type CalloutCardSpec } from "./types";

export function CalloutCard({ spec }: { spec: CalloutCardSpec }) {
  const t = ACCENT_TOKENS[spec.accent];
  return (
    <Frame eyebrow={spec.eyebrow} title={spec.title}>
      <div
        style={{
          boxSizing: "border-box",
          width: 620,
          display: "flex",
          flexDirection: "row",
          alignItems: spec.body ? "flex-start" : "center",
          gap: 22,
          padding: "28px 32px",
          borderRadius: 20,
          background: t.fill,
          border: "1px solid var(--line-subtle)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: t.strong,
            color: "#fff",
          }}
        >
          <VisualIcon name={spec.icon} size={28} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
              color: "var(--fg-strong)",
            }}
          >
            {spec.heading}
          </div>
          {spec.body && (
            <div
              style={{
                marginTop: 8,
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--fg-normal)",
              }}
            >
              {spec.body}
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}
