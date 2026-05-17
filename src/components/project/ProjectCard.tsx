import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Thumb } from "@/components/diagram/Thumb";
import { Chip } from "@/components/ui/Chip";
import type { Project } from "@/lib/types";

export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link
      href={`/lab/${p.slug}`}
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <div style={{ height: 180, position: "relative" }}>
        <Thumb kind={p.k} />
      </div>
      <div style={{ padding: "22px 24px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 6,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 19, letterSpacing: "-0.01em", color: "var(--fg-strong)" }}>
            {p.name}
          </h3>
          <span className="meta">{p.year}</span>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--fg-neutral)", lineHeight: 1.6 }}>
          {p.desc}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "56px 1fr",
            gap: "10px 14px",
            margin: "4px 0 18px",
            paddingTop: 14,
            borderTop: "1px solid var(--line-subtle)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--fg-alternative)",
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              paddingTop: 1,
            }}
          >
            기획
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-normal)", lineHeight: 1.55 }}>{p.plan}</div>
          <div
            style={{
              fontSize: 11,
              color: "var(--fg-alternative)",
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              paddingTop: 1,
            }}
          >
            구현
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-normal)", lineHeight: 1.55 }}>{p.build}</div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {p.stack.map((s) => (
            <Chip key={s} className="font-mono">
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{s}</span>
            </Chip>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
            paddingTop: 14,
            borderTop: "1px solid var(--line-subtle)",
          }}
        >
          <span className="meta" style={{ fontSize: 12 }}>
            {p.url} · via {p.host === "vercel" ? "Vercel" : "Cloudflare Pages"}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--fg-primary)",
              whiteSpace: "nowrap",
            }}
          >
            자세히
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
