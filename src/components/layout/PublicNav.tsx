import Link from "next/link";
import { Newspaper, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { BrandLogo, BrandMark } from "@/components/layout/BrandLogo";
import type { Locale } from "@/lib/types";
import { pathFor } from "@/lib/i18n";

type Active = "home" | "posts" | "lab" | "";

export function PublicNav({
  active = "home",
  locale = "ko",
}: {
  active?: Active;
  locale?: Locale;
  // 다국어 비활성. 호출부 호환을 위해 prop만 유지(미사용).
  switchPath?: string;
}) {
  return (
    <div className="nav">
      <div className="nav-left">
        <Link href={pathFor(locale, "/")} className="nav-brand" aria-label="hynu.blog">
          <BrandMark />
          <BrandLogo />
        </Link>
        <div className="nav-links">
          <Link href={pathFor(locale, "/posts")} className={active === "posts" ? "active" : ""}>
            <Newspaper size={14} style={{ color: "var(--fg-alternative)" }} />
            Posts
          </Link>
          {/* Labs — 임시 숨김. /lab 라우트는 살아 있음. */}
        </div>
      </div>
      <div className="nav-right">
        <Link href="/search" className="icon-btn nav-desktop-only" aria-label="검색">
          <Search size={18} />
        </Link>
        <ThemeToggle />
        <MobileMenu locale={locale} />
      </div>
    </div>
  );
}
