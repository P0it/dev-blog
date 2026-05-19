import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AdminTopbar({
  children,
  left,
}: {
  children?: React.ReactNode;
  left?: React.ReactNode;
}) {
  return (
    <div className="nav" style={{ height: 56, padding: "0 24px" }}>
      <div className="nav-left" style={{ gap: 16 }}>
        <Link href="/admin" className="nav-brand" aria-label="어드민 홈">
          <span className="dot" />
          <span>hynu</span>
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
        {left}
      </div>
      <div className="nav-right" style={{ gap: 12 }}>
        <ThemeToggle />
        {children}
      </div>
    </div>
  );
}
