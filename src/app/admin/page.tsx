import Link from "next/link";
import { Sparkles, Plus, FolderPlus, Upload, Globe } from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { StatCard } from "@/components/admin/StatCard";
import { VisitorsChart } from "@/components/admin/VisitorsChart";

const stats = [
  { label: "발행 글", num: "54", delta: "+3 이번 달" },
  { label: "이번 달 조회", num: "12,408", delta: "+18.2%" },
  { label: "작성 중", num: "7", delta: "마지막 저장: 14분 전" },
  { label: "진행 시리즈", num: "3", delta: "에이전트 인프라 외 2" },
];

const recentDrafts: { t: string; s: "Draft" | "Published"; d: string }[] = [
  { t: "Claude Code subprocess 패턴", s: "Draft", d: "14분 전" },
  { t: "MCP 도구 발견 메커니즘", s: "Published", d: "3일 전" },
  { t: "News Briefing 운영기 — 100일", s: "Draft", d: "5일 전" },
  { t: "AI 에이전트의 tool calling", s: "Published", d: "1주 전" },
];

const quickActions = [
  { icon: Sparkles, t: "AI 초안 생성", d: "URL → 마크다운 초안" },
  { icon: FolderPlus, t: "카테고리 추가", d: "트리 관리" },
  { icon: Upload, t: "이미지 일괄 업로드", d: "Supabase Storage" },
  { icon: Globe, t: "영어 번역 재실행", d: "미번역 글 보기" },
];

export default function AdminDashboardPage() {
  return (
    <>
      <AdminTopbar>
        <Link href="/admin/editor?ai=1">
          <Button variant="outline" size="sm">
            <Sparkles size={14} />
            URL로 초안
          </Button>
        </Link>
        <Link href="/admin/editor">
          <Button variant="primary" size="sm">
            <Plus size={14} />새 글
          </Button>
        </Link>
      </AdminTopbar>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "calc(100vh - 56px)" }}>
        <AdminSidebar active="dashboard" />
        <div style={{ padding: "32px 40px", overflow: "auto" }}>
          <div className="meta">2026.05.10 · 토요일</div>
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
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16 }}>방문자 — 최근 7일</h3>
                <div className="meta">유니크 / 일</div>
              </div>
              <VisitorsChart />
            </div>

            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>최근 작성</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recentDrafts.map((p, i) => (
                  <div
                    key={p.t}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderTop: i ? "1px solid var(--line-subtle)" : "none",
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
                        {p.t}
                      </div>
                      <div className="meta" style={{ marginTop: 2 }}>{p.d}</div>
                    </div>
                    <Chip variant={p.s === "Draft" ? "purple" : "blue"}>{p.s}</Chip>
                  </div>
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
                  <div key={a.t} className="card" style={{ padding: 18, cursor: "pointer" }}>
                    <Icon size={18} style={{ color: "var(--fg-strong)" }} />
                    <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>{a.t}</div>
                    <div className="meta" style={{ marginTop: 2 }}>{a.d}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
