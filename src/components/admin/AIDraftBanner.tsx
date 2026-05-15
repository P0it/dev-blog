import { Sparkles, X } from "lucide-react";

export function AIDraftBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 24px",
        background: "var(--bg-accent-soft)",
        borderBottom: "1px solid var(--line-subtle)",
        color: "var(--purple-600)",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <Sparkles size={14} />
      <span>AI 초안. 검토 후 발행하세요.</span>
      <span style={{ color: "var(--fg-neutral)", fontWeight: 500, marginLeft: 8 }}>
        출처: youtube.com/watch?v=… · anthropic.com/news/…
      </span>
      <X
        size={14}
        style={{ marginLeft: "auto", color: "var(--fg-neutral)", cursor: "pointer" }}
      />
    </div>
  );
}
