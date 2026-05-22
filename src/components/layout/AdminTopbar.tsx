import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BrandLogo, BrandMark } from "@/components/layout/BrandLogo";

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
        <Link href="/admin/posts" className="nav-brand" aria-label="어드민 홈">
          <BrandMark />
          <BrandLogo />
        </Link>
        <Link
          href="/"
          target="_blank"
          className="meta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            textDecoration: "none",
          }}
        >
          <ExternalLink size={13} />
          블로그
        </Link>
        {left}
      </div>
      <div className="nav-right" style={{ gap: 12 }}>
        <ThemeToggle />
        {children}
      </div>
    </div>
  );
}
