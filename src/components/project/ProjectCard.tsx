import { ArrowUpRight } from "lucide-react";
import { Thumb } from "@/components/diagram/Thumb";
import { Chip } from "@/components/ui/Chip";
import type { Project } from "@/lib/types";

function HostIcon({ host }: { host: Project["host"] }) {
  if (host === "vercel") {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2 L23 21 H1 Z" />
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 16.5c.3-1 .2-2-.3-2.7-.5-.7-1.3-1.1-2.3-1.1l-7-.1c-.1 0-.3-.1-.3-.2-.1-.1-.1-.2-.1-.4 0-.2.2-.4.4-.4l7.1-.1c.8-.1 1.8-.7 2.2-1.6l.6-1.4c0-.1 0-.1 0-.2-.6-2.9-3.2-5.1-6.3-5.1-2.9 0-5.3 1.8-6.1 4.4-.6-.4-1.3-.6-2.1-.6C1 7.2-.2 8.4-.3 10c-.1.4 0 .7.1 1.1C-1.5 11.3-2.5 12.6-2.5 14c0 1.7 1.4 3 3.1 3l14.7.1c.6-.1 1-.4 1.2-.6Z" />
    </svg>
  );
}

export function ProjectCard({ p }: { p: Project }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
            <Chip key={s} className="font-mono" >
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{s}</span>
            </Chip>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 14,
            borderTop: "1px solid var(--line-subtle)",
          }}
        >
          <a
            href={`https://${p.url}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 10px",
              borderRadius: 8,
              background: "var(--bg-subtle)",
              border: "1px solid var(--line-subtle)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--fg-strong)",
              textDecoration: "none",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span
              style={{
                color: p.host === "vercel" ? "var(--fg-strong)" : "#F38020",
                display: "inline-flex",
              }}
            >
              <HostIcon host={p.host} />
            </span>
            <span>{p.url}</span>
            <ArrowUpRight size={11} style={{ opacity: 0.5 }} />
          </a>
          <span className="meta" style={{ fontSize: 11 }}>
            via {p.host === "vercel" ? "Vercel" : "Cloudflare Pages"}
          </span>
        </div>
      </div>
    </div>
  );
}
