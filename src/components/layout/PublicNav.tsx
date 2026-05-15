import Link from "next/link";
import { FolderTree, FlaskConical, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type Active = "home" | "categories" | "lab" | "";

export function PublicNav({ active = "home" }: { active?: Active }) {
  return (
    <div className="nav">
      <div className="nav-left">
        <Link href="/" className="nav-brand" aria-label="홈으로">
          <span className="dot" />
          <span>hyunwoo</span>
        </Link>
        <div className="nav-links">
          <Link href="/categories" className={active === "categories" ? "active" : ""}>
            <FolderTree size={14} style={{ color: "var(--fg-alternative)" }} />
            카테고리
          </Link>
          <Link href="/lab" className={active === "lab" ? "active" : ""}>
            <FlaskConical size={14} style={{ color: "var(--fg-alternative)" }} />
            실험실
          </Link>
        </div>
      </div>
      <div className="nav-right">
        <button className="icon-btn" aria-label="검색">
          <Search size={18} />
        </button>
        <ThemeToggle />
        <div className="lang-toggle" aria-label="언어 선택">
          <span className="on">KR</span>
          <span>EN</span>
        </div>
      </div>
    </div>
  );
}
