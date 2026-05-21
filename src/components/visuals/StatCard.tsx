import type { CSSProperties } from "react";
import { Frame } from "./Frame";
import { VisualIcon } from "./icon";
import {
  ACCENT_TOKENS,
  type Accent,
  type DeltaSpec,
  type StatCardSpec,
  type StatSpec,
} from "./types";

const DELTA_META: Record<
  DeltaSpec["direction"],
  { accent: Accent; icon: string }
> = {
  up: { accent: "success", icon: "trending-up" },
  down: { accent: "danger", icon: "trending-down" },
  flat: { accent: "mute", icon: "minus" },
};

const statBoxStyle: CSSProperties = {
  boxSizing: "border-box",
  flex: "1 1 0",
  minWidth: 184,
  maxWidth: 260,
  display: "flex",
  flexDirection: "column",
  padding: "26px 24px",
  borderRadius: 18,
  border: "1px solid var(--line-subtle)",
  background: "var(--bg-elevated)",
  boxShadow: "0 1px 2px rgba(23,23,23,0.05)",
};

function Delta({ delta }: { delta: DeltaSpec }) {
  const meta = DELTA_META[delta.direction];
  const t = ACCENT_TOKENS[meta.accent];
  return (
    <div
      style={{
        marginTop: 14,
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        borderRadius: 999,
        background: t.fill,
        color: t.strong,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <VisualIcon name={meta.icon} size={13} strokeWidth={2.5} />
      {delta.value}
    </div>
  );
}

function StatBox({ stat, accent }: { stat: StatSpec; accent: Accent }) {
  const t = ACCENT_TOKENS[stat.accent ?? accent];
  return (
    <div style={statBoxStyle}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: t.strong,
        }}
      >
        {stat.value}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.4,
          color: "var(--fg-strong)",
        }}
      >
        {stat.label}
      </div>
      {stat.caption && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            lineHeight: 1.45,
            color: "var(--fg-alternative)",
          }}
        >
          {stat.caption}
        </div>
      )}
      {stat.delta && <Delta delta={stat.delta} />}
    </div>
  );
}

export function StatCard({ spec }: { spec: StatCardSpec }) {
  return (
    <Frame eyebrow={spec.eyebrow} title={spec.title}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 16,
        }}
      >
        {spec.stats.map((stat, i) => (
          <StatBox key={i} stat={stat} accent={spec.accent} />
        ))}
      </div>
    </Frame>
  );
}
