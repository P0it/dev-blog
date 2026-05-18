import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Chip } from "@/components/ui/Chip";
import { getOpsInfo } from "@/lib/queries";

export const dynamic = "force-dynamic";

function jobChip(status: string) {
  if (status === "pending") return <Chip variant="outline">대기</Chip>;
  if (status === "processing") return <Chip variant="purple">처리중</Chip>;
  if (status === "done") return <Chip variant="green">완료</Chip>;
  return (
    <span className="chip" style={{ color: "#d33", borderColor: "#d33" }}>
      오류
    </span>
  );
}

export default async function AdminSettingsPage() {
  const ops = await getOpsInfo();

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
        <AdminSidebar active="settings" />
        <div style={{ padding: "32px 40px", overflow: "auto", maxWidth: 920 }}>
          <div className="meta">운영 정보 (읽기 전용)</div>
          <h1 style={{ fontSize: 28, margin: "4px 0 0", letterSpacing: "-0.015em" }}>
            설정
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginTop: 28,
            }}
          >
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>환경변수</h3>
              {ops.env.map((e) => (
                <div
                  key={e.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "7px 0",
                  }}
                >
                  <span className="meta" style={{ fontFamily: "var(--font-mono)" }}>
                    {e.key}
                  </span>
                  {e.set ? (
                    <Chip variant="green">설정됨</Chip>
                  ) : (
                    <Chip variant="outline">없음</Chip>
                  )}
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>상태</h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                }}
              >
                <span className="meta">DB 연결</span>
                {ops.db ? (
                  <Chip variant="green">정상</Chip>
                ) : (
                  <span className="chip" style={{ color: "#d33" }}>
                    실패
                  </span>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0" }}>
                <span className="meta">발행 / 초안</span>
                <span style={{ fontWeight: 600 }}>
                  {ops.counts.published} / {ops.counts.drafts}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0" }}>
                <span className="meta">카테고리 / 시리즈</span>
                <span style={{ fontWeight: 600 }}>
                  {ops.counts.categories} / {ops.counts.series}
                </span>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: 16, margin: "32px 0 12px" }}>AI 작업 큐 (최근 15)</h3>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {!ops.aiJobs.available && (
              <div className="meta" style={{ padding: 24 }}>
                ai_jobs 테이블이 없습니다. 마이그레이션 0007을 적용하세요.
              </div>
            )}
            {ops.aiJobs.available && ops.aiJobs.recent.length === 0 && (
              <div className="meta" style={{ padding: 24 }}>
                아직 AI 작업이 없습니다.
              </div>
            )}
            {ops.aiJobs.recent.map((j, i) => (
              <div
                key={j.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 18px",
                  borderTop: i ? "1px solid var(--line-subtle)" : "none",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg-strong)" }}>
                    {j.type === "draft_from_url" ? "URL→초안" : "개선"} ·{" "}
                    {j.post_slug ?? "-"}
                  </div>
                  <div
                    className="meta"
                    style={{
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {j.result ?? new Date(j.created_at).toLocaleString("ko-KR")}
                  </div>
                </div>
                {jobChip(j.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
