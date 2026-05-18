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
  // EN 토글이 가리킬 KO 기준 경로. 예: 디테일 페이지에서는 /posts/<slug>.
  switchPath = "/",
}: {
  active?: Active;
  locale?: Locale;
  switchPath?: string;
}) {
  const otherLocale: Locale = locale === "ko" ? "en" : "ko";
  const switchHref = pathFor(otherLocale, switchPath);

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
        <Link
          href={switchHref}
          className="lang-toggle nav-desktop-only"
          aria-label="언어 선택"
          style={{ textDecoration: "none" }}
        >
          <span className={locale === "ko" ? "on" : ""}>KR</span>
          <span className={locale === "en" ? "on" : ""}>EN</span>
        </Link>
        <MobileMenu locale={locale} switchHref={switchHref} />
      </div>
    </div>
  );
}
