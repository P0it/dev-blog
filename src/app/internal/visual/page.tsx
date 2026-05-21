import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SAMPLE_SPECS, VisualRenderer } from "@/components/visuals/registry";

export const metadata: Metadata = {
  title: "시각자료 카탈로그",
  robots: { index: false, follow: false },
};

/** 카탈로그 패턴 미리보기 — 개발 환경 전용. */
export default function VisualCatalogIndex() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 40px 96px" }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--fg-primary)",
        }}
      >
        Visual Catalog
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          margin: "12px 0 8px",
          color: "var(--fg-strong)",
        }}
      >
        시각자료 카탈로그
      </h1>
      <p style={{ color: "var(--fg-neutral)", fontSize: 15, margin: 0 }}>
        POSTING.md “2-2. 시각자료 카탈로그”의 패턴 미리보기입니다. 개발 환경 전용.
      </p>

      {SAMPLE_SPECS.map((spec, i) => (
        <section key={i} style={{ marginTop: 48 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--fg-neutral)",
              marginBottom: 14,
            }}
          >
            {spec.pattern}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: 32,
              borderRadius: 16,
              background: "var(--bg-subtle)",
              border: "1px solid var(--line-subtle)",
            }}
          >
            <VisualRenderer spec={spec} />
          </div>
        </section>
      ))}
    </div>
  );
}
