"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { AiReviseModal } from "@/components/admin/AiModals";
import { AdminPostThumb } from "@/components/admin/AdminPostThumb";
import {
  requestRevision,
  deletePostFromList,
  unpublishPost,
  publishPost,
} from "@/app/admin/posts/actions";
import type { AdminPostRow } from "@/lib/queries";

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

type StatusFilter = "all" | "draft" | "published";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function AiBadge({ status }: { status: AdminPostRow["aiStatus"] }) {
  if (!status) return null;
  if (status === "pending" || status === "processing")
    return (
      <Chip variant="blue">
        <span className="ai-spinner" />생성중
      </Chip>
    );
  if (status === "done") return <Chip variant="green">AI 완료</Chip>;
  return (
    <span className="chip" style={{ color: "#d33", borderColor: "#d33" }}>
      AI 오류
    </span>
  );
}

export function PostsList({ posts }: { posts: AdminPostRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");
  const [reviseSlug, setReviseSlug] = useState<string | null>(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (needle && !p.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [posts, filter, q]);

  const fail = (e: unknown) => alert(`에러: ${(e as Error).message}`);

  const onRevise = (feedback: string) => {
    if (!reviseSlug) return;
    startTransition(async () => {
      try {
        await requestRevision({ slug: reviseSlug, feedback });
        setReviseSlug(null);
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });
  };

  const onUnpublish = (slug: string, title: string) => {
    if (!confirm(`"${title}" 글을 비공개로 전환할까요? 사용자 화면에서 숨겨집니다.`)) return;
    startTransition(async () => {
      try {
        await unpublishPost(slug);
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });
  };

  const onPublish = (slug: string) => {
    startTransition(async () => {
      try {
        await publishPost(slug);
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });
  };

  const onDelete = (slug: string, title: string) => {
    if (!confirm(`"${title}" 글을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    startTransition(async () => {
      try {
        await deletePostFromList(slug);
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });
  };

  const filters: { k: StatusFilter; label: string }[] = [
    { k: "all", label: "전체" },
    { k: "draft", label: "작성중" },
    { k: "published", label: "발행" },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      {/* 툴바 */}
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
          placeholder="제목 검색"
          style={{ ...inputBox, width: 220, flex: "0 0 auto" }}
        />
      </div>

      {/* 목록 */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {shown.length === 0 && (
          <div className="meta" style={{ padding: 24 }}>
            글이 없습니다.
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
            <AdminPostThumb coverImage={p.coverImage} thumbKind={p.thumbKind} />
            <button
              onClick={() =>
                router.push(`/admin/editor?slug=${encodeURIComponent(p.slug)}`)
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 0,
                }}
              >
                {p.status !== "published" && (
                  <Chip variant="purple">작성중</Chip>
                )}
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
                  {p.title}
                </span>
              </div>
              <div className="meta" style={{ marginTop: 3 }}>
                {p.category && `${p.category} · `}
                {fmtDate(p.displayDate)}
              </div>
            </button>

            <div style={{ display: "flex", gap: 6, alignItems: "center", flex: "0 0 auto" }}>
              <AiBadge status={p.aiStatus} />
              {p.status === "published" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onUnpublish(p.slug, p.title)}
                  title="비공개로 전환"
                >
                  <EyeOff size={14} />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => onPublish(p.slug)}
                  title="발행"
                >
                  <Eye size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => setReviseSlug(p.slug)}
                title="AI 개선 요청"
              >
                <Wand2 size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => onDelete(p.slug, p.title)}
                title="삭제"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {reviseSlug && (
        <AiReviseModal
          busy={pending}
          targetLabel={reviseSlug}
          onClose={() => setReviseSlug(null)}
          onSubmit={onRevise}
        />
      )}
    </div>
  );
}
