import Link from "next/link";
import { SquarePen, FolderPlus, Layers, BarChart3 } from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatCard } from "@/components/admin/StatCard";
import { getAdminStats, getRecentDrafts, getViewStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}주 전`;
  const mo = Math.floor(day / 30);
  return `${mo}개월 전`;
}

const quickActions = [
  { icon: FolderPlus, t: "카테고리 관리", d: "추가·정렬·삭제", href: "/admin/categories" },
  { icon: Layers, t: "시리즈 관리", d: "묶음 CRUD", href: "/admin/series" },
  { icon: BarChart3, t: "통계", d: "글별 조회수", href: "/admin/stats" },
];

export default async function AdminDashboardPage() {
  const [{ published, drafts }, recent, viewStats] = await Promise.all([
    getAdminStats(),
    getRecentDrafts(6),
    getViewStats(),
  ]);

  const stats = [
    { label: "발행 글", num: String(published), delta: "" },
    { label: "작성 중", num: String(drafts), delta: drafts > 0 ? "검토 대기" : "없음" },
    {
      label: "이번 달 조회",
      num: viewStats.monthly == null ? "—" : viewStats.monthly.toLocaleString(),
      delta: viewStats.monthly == null ? "마이그레이션 필요" : "page_views",
    },
    {
      label: "누적 조회",
      num: viewStats.total == null ? "—" : viewStats.total.toLocaleString(),
      delta: viewStats.total == null ? "0002 SQL 실행" : "전체 기간",
    },
  ];

  const today = new Date();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][today.getDay()];
  const todayStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")} · ${weekday}요일`;

  return (
    <>
      <AdminTopbar>
        <Link href="/admin/editor">
          <Button variant="primary" size="sm">
            <SquarePen size={14} />새 글 쓰기
          </Button>
        </Link>
      </AdminTopbar>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "calc(100vh - 56px)" }}>
        <AdminSidebar active="dashboard" />
        <div style={{ padding: "32px 40px", overflow: "auto" }}>
          <div className="meta">{todayStr}</div>
          <h1 style={{ fontSize: 28, margin: "4px 0 0", letterSpacing: "-0.015em" }}>
            안녕하세요, 현우님.
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginTop: 28,
            }}
          >
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 24,
              marginTop: 32,
            }}
          >
            <div className="card" style={{ padding: 22 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16 }}>인기 글 — 이번 달</h3>
                <div className="meta">조회수</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {viewStats.topPosts.length === 0 && (
                  <div className="meta">
                    {viewStats.monthly == null
                      ? "page_views 테이블이 아직 없습니다 (0002 마이그레이션 실행)."
                      : "이번 달 집계된 조회가 없습니다."}
                  </div>
                )}
                {viewStats.topPosts.map((p, i) => (
                  <Link
                    key={p.slug}
                    href={`/posts/${p.slug}`}
                    target="_blank"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "8px 0",
                      borderTop: i ? "1px solid var(--line-subtle)" : "none",
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--fg-strong)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {i + 1}. {p.title}
                    </span>
                    <span className="meta" style={{ whiteSpace: "nowrap" }}>
                      {p.views.toLocaleString()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>최근 작성</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recent.length === 0 && (
                  <div className="meta">아직 글이 없습니다.</div>
                )}
                {recent.map((p, i) => (
                  <Link
                    key={p.slug}
                    href={`/admin/editor?slug=${encodeURIComponent(p.slug)}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderTop: i ? "1px solid var(--line-subtle)" : "none",
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "var(--fg-strong)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.title}
                      </div>
                      <div className="meta" style={{ marginTop: 2 }}>{relativeTime(p.updated_at)}</div>
                    </div>
                    <Chip variant={p.status === "Draft" ? "purple" : "blue"}>{p.status}</Chip>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>빠른 액션</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.t}
                    href={a.href}
                    className="card"
                    style={{
                      padding: 18,
                      cursor: "pointer",
                      display: "block",
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <Icon size={18} style={{ color: "var(--fg-strong)" }} />
                    <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>{a.t}</div>
                    <div className="meta" style={{ marginTop: 2 }}>{a.d}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
