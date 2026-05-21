import type { CSSProperties } from "react";
import { Frame } from "./Frame";
import { VisualIcon } from "./icon";
import { ACCENT_TOKENS, type Accent, type StepCardSpec, type StepSpec } from "./types";

const mono = "var(--font-mono)";

function stepNo(i: number): string {
  return String(i + 1).padStart(2, "0");
}

function iconBoxStyle(accent: Accent, highlight: boolean): CSSProperties {
  const t = ACCENT_TOKENS[accent];
  return {
    width: 46,
    height: 46,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
    background: highlight ? t.strong : t.fill,
    color: highlight ? "#fff" : t.strong,
  };
}

function cardStyle(accent: Accent, highlight: boolean): CSSProperties {
  const t = ACCENT_TOKENS[accent];
  return {
    boxSizing: "border-box",
    borderRadius: 18,
    border: highlight
      ? `1.5px solid ${t.strong}`
      : "1px solid var(--line-subtle)",
    background: highlight ? t.fill : "var(--bg-elevated)",
    boxShadow: highlight
      ? "0 10px 24px -14px rgba(23,23,23,0.28)"
      : "0 1px 2px rgba(23,23,23,0.05)",
  };
}

function StepBoxHorizontal({
  step,
  index,
  accent,
}: {
  step: StepSpec;
  index: number;
  accent: Accent;
}) {
  const highlight = step.highlight === true;
  return (
    <div
      style={{
        ...cardStyle(accent, highlight),
        width: 172,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 16px 22px",
      }}
    >
      <div
        style={{
          fontFamily: mono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "var(--fg-assistive)",
        }}
      >
        {stepNo(index)}
      </div>
      <div style={{ ...iconBoxStyle(accent, highlight), marginTop: 12 }}>
        <VisualIcon name={step.icon} size={22} />
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1.35,
          color: "var(--fg-strong)",
          textAlign: "center",
        }}
      >
        {step.label}
      </div>
      {step.sublabel && (
        <div
          style={{
            marginTop: 4,
            fontFamily: mono,
            fontSize: 11.5,
            color: "var(--fg-alternative)",
            textAlign: "center",
          }}
        >
          {step.sublabel}
        </div>
      )}
    </div>
  );
}

function StepBoxVertical({
  step,
  index,
  accent,
}: {
  step: StepSpec;
  index: number;
  accent: Accent;
}) {
  const highlight = step.highlight === true;
  return (
    <div
      style={{
        ...cardStyle(accent, highlight),
        width: 440,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        padding: "16px 20px",
      }}
    >
      <div
        style={{
          fontFamily: mono,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "var(--fg-assistive)",
          width: 22,
          flex: "0 0 auto",
        }}
      >
        {stepNo(index)}
      </div>
      <div style={iconBoxStyle(accent, highlight)}>
        <VisualIcon name={step.icon} size={22} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.35,
            color: "var(--fg-strong)",
          }}
        >
          {step.label}
        </div>
        {step.sublabel && (
          <div
            style={{
              marginTop: 3,
              fontFamily: mono,
              fontSize: 12,
              color: "var(--fg-alternative)",
            }}
          >
            {step.sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

function Connector({ vertical }: { vertical: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        width: vertical ? "auto" : 40,
        height: vertical ? 30 : "auto",
      }}
    >
      <VisualIcon
        name={vertical ? "chevron-down" : "chevron-right"}
        size={20}
        color="var(--fg-disabled)"
        strokeWidth={2.5}
      />
    </div>
  );
}

export function StepCard({ spec }: { spec: StepCardSpec }) {
  const vertical = spec.direction === "vertical";
  const steps = spec.steps;

  return (
    <Frame eyebrow={spec.eyebrow} title={spec.title}>
      <div
        style={{
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: vertical ? "nowrap" : "wrap",
        }}
      >
        {steps.map((step, i) => {
          const accent = step.accent ?? spec.accent;
          const last = i === steps.length - 1;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: vertical ? "column" : "row",
                alignItems: "center",
              }}
            >
              {vertical ? (
                <StepBoxVertical step={step} index={i} accent={accent} />
              ) : (
                <StepBoxHorizontal step={step} index={i} accent={accent} />
              )}
              {!last && <Connector vertical={vertical} />}
            </div>
          );
        })}
      </div>
    </Frame>
  );
}
