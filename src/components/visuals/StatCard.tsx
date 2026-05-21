import type { CSSProperties } from "react";
import { Frame } from "./Frame";
import { VisualIcon } from "./icon";
import {
  ACCENT_TOKENS,
  type Accent,
  type DeltaSpec,
  type StatCardSpec,
} from "./types";

function accentVars(accent: Accent): CSSProperties {
  const t = ACCENT_TOKENS[accent];
  return { "--vis-fill": t.fill, "--vis-strong": t.strong } as CSSProperties;
}

const DELTA_META: Record<DeltaSpec["direction"], { accent: Accent; icon: string }> = {
  up: { accent: "success", icon: "trending-up" },
  down: { accent: "danger", icon: "trending-down" },
  flat: { accent: "mute", icon: "minus" },
};

function Delta({ delta }: { delta: DeltaSpec }) {
  const meta = DELTA_META[delta.direction];
  return (
    <div className="vis-delta" style={accentVars(meta.accent)}>
      <VisualIcon name={meta.icon} size={13} strokeWidth={2.5} />
      {delta.value}
    </div>
  );
}

export function StatCard({ spec }: { spec: StatCardSpec }) {
  return (
    <Frame eyebrow={spec.eyebrow} title={spec.title}>
      <div className="vis-stats">
        {spec.stats.map((stat, i) => (
          <div
            className="vis-stat"
            key={i}
            style={accentVars(stat.accent ?? spec.accent)}
          >
            {stat.icon && (
              <div className="vis-ico">
                <VisualIcon name={stat.icon} size={17} />
              </div>
            )}
            <div className="vis-val">{stat.value}</div>
            <div className="vis-lb">{stat.label}</div>
            {stat.caption && <div className="vis-cap">{stat.caption}</div>}
            {stat.delta && <Delta delta={stat.delta} />}
          </div>
        ))}
      </div>
    </Frame>
  );
}
