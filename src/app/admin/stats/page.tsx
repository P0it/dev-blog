import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { StatCard } from "@/components/admin/StatCard";
import { getViewStats, getPostViewTable } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const [stats, table] = await Promise.all([getViewStats(), getPostViewTable()]);
  const noData = stats.total == null;

  return (
    <>
      <AdminTopbar />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          minHeight: "calc(100vh - 56px)",
        }}
      >
        <AdminSidebar active="stats" />
        <div style={{ padding: "32px 40px", overflow: "auto" }}>
          <div className="meta">조회 분석</div>
          <h1 style={{ fontSize: 28, margin: "4px 0 0", letterSpacing: "-0.015em" }}>
            통계
          </h1>

          {noData ? (
            <div className="card" style={{ padding: 24, marginTop: 24 }}>
              <div className="meta">
                page_views 테이블이 없습니다. 마이그레이션 0002를 적용하면 집계가 시작됩니다.
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 16,
                  marginTop: 28,
                }}
              >
                <StatCard
                  label="이번 달 조회"
                  num={(stats.monthly ?? 0).toLocaleString()}
                  delta="page_views"
                />
                <StatCard
                  label="누적 조회"
                  num={(stats.total ?? 0).toLocaleString()}
                  delta="전체 기간"
                />
                <StatCard
                  label="집계된 글"
                  num={String(table.length)}
                  delta="조회 1+ 글"
                />
              </div>

              <h3 style={{ fontSize: 16, margin: "32px 0 12px" }}>글별 조회수</h3>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div
                  style={{
                    display: "flex",
                    padding: "10px 18px",
                    borderBottom: "1px solid var(--line-subtle)",
                  }}
                  className="meta"
                >
                  <div style={{ flex: 1 }}>제목</div>
                  <div style={{ width: 100, textAlign: "right" }}>이번 달</div>
                  <div style={{ width: 100, textAlign: "right" }}>누적</div>
                </div>
                {table.length === 0 && (
                  <div className="meta" style={{ padding: 24 }}>
                    아직 집계된 조회가 없습니다.
                  </div>
                )}
                {table.map((r, i) => (
                  <div
                    key={r.slug}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 18px",
                      borderTop: i ? "1px solid var(--line-subtle)" : "none",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--fg-strong)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.title}
                    </div>
                    <div style={{ width: 100, textAlign: "right" }} className="meta">
                      {r.monthly.toLocaleString()}
                    </div>
                    <div
                      style={{
                        width: 100,
                        textAlign: "right",
                        fontWeight: 600,
                        color: "var(--fg-strong)",
                      }}
                    >
                      {r.total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
