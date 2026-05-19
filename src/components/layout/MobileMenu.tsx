"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderTree, FlaskConical, Search, Menu, X } from "lucide-react";
import type { Locale } from "@/lib/types";
import { pathFor } from "@/lib/i18n";

export function MobileMenu({
  locale,
}: {
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="icon-btn mobile-menu-btn"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <>
          <div className="mobile-menu-scrim" onClick={close} />
          <nav className="mobile-menu-panel">
            <Link href={pathFor(locale, "/categories")} onClick={close}>
              <FolderTree size={16} style={{ color: "var(--fg-alternative)" }} />
              {locale === "ko" ? "카테고리" : "Categories"}
            </Link>
            <Link href={pathFor(locale, "/lab")} onClick={close}>
              <FlaskConical size={16} style={{ color: "var(--fg-alternative)" }} />
              {locale === "ko" ? "실험실" : "Lab"}
            </Link>
            <Link href="/search" onClick={close}>
              <Search size={16} style={{ color: "var(--fg-alternative)" }} />
              {locale === "ko" ? "검색" : "Search"}
            </Link>
          </nav>
        </>
      )}
    </>
  );
}
