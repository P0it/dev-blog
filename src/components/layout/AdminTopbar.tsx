import Link from "next/link";

export function AdminTopbar({ children }: { children?: React.ReactNode }) {
  return (
    <div className="nav" style={{ height: 56, padding: "0 24px" }}>
      <div className="nav-left" style={{ gap: 16 }}>
        <Link href="/admin" className="nav-brand" aria-label="어드민 홈">
          <span className="dot" />
          <span>hyun</span>
        </Link>
        <span
          className="meta"
          style={{
            padding: "2px 8px",
            borderRadius: 6,
            background: "var(--bg-muted)",
          }}
        >
          localhost
        </span>
      </div>
      <div className="nav-right" style={{ gap: 12 }}>
        {children}
      </div>
    </div>
  );
}
