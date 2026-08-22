"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import {
  publishProjectBySlug,
  unpublishProject,
  deleteProject,
} from "@/app/admin/projects/actions";
import type { Project } from "@/lib/types";

const inputBox: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--bg-base)",
  border: "1px solid var(--line-normal)",
  borderRadius: 10,
  fontSize: 13,
  color: "var(--fg-strong)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

type Filter = "all" | "draft" | "published";

// 목록에서도 카드와 같은 로고 타일을 쓴다 — 어느 프로젝트인지 이모지로 먼저 잡힌다.
function LogoTile({ p }: { p: Project }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: p.logoBg,
        display: "grid",
        placeItems: "center",
        fontSize: 20,
        flex: "0 0 auto",
      }}
    >
      {p.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.logoUrl} alt="" style={{ width: "70%", height: "70%", objectFit: "contain" }} />
      ) : (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 800,
            color: "rgba(255,255,255,0.96)",
          }}
        >
          {(p.name.trim()[0] ?? "?").toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function ProjectsList({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (filter !== "all" && p.visibility !== filter) return false;
      if (needle && !p.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [projects, filter, q]);

  const fail = (e: unknown) => alert(`에러: ${(e as Error).message}`);
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });

  const onUnpublish = (p: Project) => {
    if (!confirm(`"${p.name}" 을(를) 비공개로 전환할까요? 실험실 목록에서 숨겨집니다.`)) return;
    run(() => unpublishProject(p.slug));
  };

  const onDelete = (p: Project) => {
    if (!confirm(`"${p.name}" 을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
    run(() => deleteProject(p.slug));
  };

  const filters: { k: Filter; label: string }[] = [
    { k: "all", label: "전체" },
    { k: "draft", label: "작성중" },
    { k: "published", label: "발행" },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {filters.map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`chip ${filter === f.k ? "chip-blue" : ""}`}
              style={{ cursor: "pointer", border: "none" }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름 검색"
          style={{ ...inputBox, width: 220, flex: "0 0 auto" }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {shown.length === 0 && (
          <div className="meta" style={{ padding: 24 }}>
            프로젝트가 없습니다.
          </div>
        )}
        {shown.map((p, i) => (
          <div
            key={p.slug}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderTop: i ? "1px solid var(--line-subtle)" : "none",
            }}
          >
            <LogoTile p={p} />
            <button
              onClick={() =>
                router.push(`/admin/projects/editor?slug=${encodeURIComponent(p.slug)}`)
              }
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                {p.visibility !== "published" && <Chip variant="purple">작성중</Chip>}
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: "var(--fg-strong)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </span>
              </div>
              <div
                className="meta"
                style={{
                  marginTop: 3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {p.year} · {p.status}
                {p.tagline && ` · ${p.tagline}`}
              </div>
            </button>

            <div style={{ display: "flex", gap: 6, alignItems: "center", flex: "0 0 auto" }}>
              <a href={`/lab/${p.slug}`} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm" title="실제 화면 보기">
                  <ExternalLink size={14} />
                </Button>
              </a>
              {p.visibility === "published" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onUnpublish(p)}
                  title="비공개로 전환"
                >
                  <EyeOff size={14} />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => publishProjectBySlug(p.slug))}
                  title="발행"
                >
                  <Eye size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => onDelete(p)}
                title="삭제"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
