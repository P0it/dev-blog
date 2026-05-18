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
      <Link href="/admin/posts" className={cls("posts")}>
        <FileText size={16} />
        글
      </Link>
      <Link href="/admin/categories" className={cls("categories")}>
        <FolderTree size={16} />
        카테고리
      </Link>
      <Link href="/admin/tags" className={cls("tags")}>
        <Hash size={16} />
        태그
      </Link>
      <Link href="/admin/series" className={cls("series")}>
        <Layers size={16} />
        시리즈
      </Link>
      <div className="t-overline" style={{ padding: "16px 12px 8px" }}>분석</div>
      <Link href="/admin/stats" className={cls("stats")}>
        <BarChart3 size={16} />
        통계
      </Link>
      <Link href="/admin/settings" className={cls("settings")}>
        <Settings size={16} />
        설정
      </Link>
    </div>
  );
}
