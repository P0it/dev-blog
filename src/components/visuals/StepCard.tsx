import type { CSSProperties } from "react";
import { Frame } from "./Frame";
import { VisualIcon } from "./icon";
import { ACCENT_TOKENS, type Accent, type StepCardSpec } from "./types";

function accentVars(accent: Accent): CSSProperties {
  const t = ACCENT_TOKENS[accent];
  return { "--vis-fill": t.fill, "--vis-strong": t.strong } as CSSProperties;
}

const stepNo = (i: number) => String(i + 1).padStart(2, "0");

export function StepCard({ spec }: { spec: StepCardSpec }) {
  return (
    <Frame eyebrow={spec.eyebrow} title={spec.title}>
      <div className="vis-steps">
        {spec.steps.map((step, i) => (
          <div
            className="vis-step"
            key={i}
            style={accentVars(step.accent ?? spec.accent)}
          >
            <div className="vis-no">{stepNo(i)}</div>
            <div className="vis-ico">
              <VisualIcon name={step.icon} size={20} />
            </div>
            <div className="vis-lb">{step.label}</div>
            {step.sublabel && <div className="vis-sub">{step.sublabel}</div>}
          </div>
        ))}
      </div>
    </Frame>
  );
}
