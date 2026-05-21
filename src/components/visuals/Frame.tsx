import type { CSSProperties, ReactNode } from "react";

type FrameProps = {
  eyebrow?: string;
  title?: string;
  /** 카드 너비. 패턴이 콘텐츠에 맞춰 지정한다. */
  width?: number;
  children: ReactNode;
};

const cardStyle: CSSProperties = {
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "52px 56px 48px",
  borderRadius: 28,
  border: "1px solid var(--line-subtle)",
  background: "linear-gradient(180deg, var(--bg-base) 0%, var(--bg-subtle) 100%)",
  boxShadow:
    "0 1px 2px rgba(23,23,23,0.04), 0 18px 48px -24px rgba(23,23,23,0.18)",
};

const eyebrowStyle: CSSProperties = {
  padding: "7px 14px",
  borderRadius: 999,
  border: "1px solid var(--line-normal)",
  background: "var(--bg-elevated)",
  color: "var(--fg-neutral)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const titleStyle: CSSProperties = {
  marginTop: 18,
  fontFamily: "var(--font-display)",
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  lineHeight: 1.3,
  color: "var(--fg-strong)",
  textAlign: "center",
  maxWidth: 720,
};

/**
 * 모든 카탈로그 패턴이 쓰는 공통 외곽 카드.
 * eyebrow / title 은 있을 때만 렌더한다.
 */
export function Frame({ eyebrow, title, width, children }: FrameProps) {
  const hasHeader = Boolean(eyebrow || title);
  return (
    <div style={{ ...cardStyle, width }}>
      {eyebrow && <div style={eyebrowStyle}>{eyebrow}</div>}
      {title && <div style={titleStyle}>{title}</div>}
      <div style={{ width: "100%", marginTop: hasHeader ? 40 : 0 }}>{children}</div>
    </div>
  );
}
