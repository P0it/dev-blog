import Link from "next/link";
import { FolderTree, FlaskConical, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import type { Locale } from "@/lib/types";
import { pathFor } from "@/lib/i18n";

type Active = "home" | "categories" | "lab" | "";

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
          <span className="dot" />
          <span>hynu</span>
        </Link>
        <div className="nav-links">
          <Link href={pathFor(locale, "/categories")} className={active === "categories" ? "active" : ""}>
            <FolderTree size={14} style={{ color: "var(--fg-alternative)" }} />
            {locale === "ko" ? "카테고리" : "Categories"}
          </Link>
          <Link href={pathFor(locale, "/lab")} className={active === "lab" ? "active" : ""}>
            <FlaskConical size={14} style={{ color: "var(--fg-alternative)" }} />
            {locale === "ko" ? "실험실" : "Lab"}
          </Link>
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
