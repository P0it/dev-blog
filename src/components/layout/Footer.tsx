export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line-subtle)",
        padding: "24px 32px 32px",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          fontSize: 12,
          color: "var(--fg-alternative)",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)" }}>© 2026 hyunwoo.blog</span>
        <span>RSS · Sitemap</span>
      </div>
    </footer>
  );
}
