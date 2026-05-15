import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Hash,
  Layers,
  BarChart3,
  Settings,
} from "lucide-react";

type Active = "dashboard" | "posts" | "categories" | "tags" | "series" | "stats" | "settings";

export function AdminSidebar({ active = "dashboard" }: { active?: Active }) {
  const cls = (k: Active) => (active === k ? "active" : "");
  return (
    <div className="admin-sidebar">
      <div className="t-overline" style={{ padding: "4px 12px 8px" }}>작성</div>
      <Link href="/admin" className={cls("dashboard")}>
        <LayoutDashboard size={16} />
        대시보드
      </Link>
      <Link href="/admin/editor" className={cls("posts")}>
        <FileText size={16} />
        글
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--fg-alternative)" }}>54</span>
      </Link>
      <a className={cls("categories")}>
        <FolderTree size={16} />
        카테고리
      </a>
      <a className={cls("tags")}>
        <Hash size={16} />
        태그
      </a>
      <a className={cls("series")}>
        <Layers size={16} />
        시리즈
      </a>
      <div className="t-overline" style={{ padding: "16px 12px 8px" }}>분석</div>
      <a className={cls("stats")}>
        <BarChart3 size={16} />
        통계
      </a>
      <a className={cls("settings")}>
        <Settings size={16} />
        설정
      </a>
    </div>
  );
}
