"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import {
  requestDraftFromUrl,
  requestRevision,
  deletePostFromList,
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
  if (status === "pending") return <Chip variant="outline">AI 대기</Chip>;
  if (status === "processing") return <Chip variant="purple">AI 처리중</Chip>;
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

  const [draftOpen, setDraftOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const [reviseSlug, setReviseSlug] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (needle && !p.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [posts, filter, q]);

  const fail = (e: unknown) => alert(`에러: ${(e as Error).message}`);

  const onCreateDraft = () => {
    startTransition(async () => {
      try {
        await requestDraftFromUrl({ url, note });
        setDraftOpen(false);
        setUrl("");
        setNote("");
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });
  };

  const onRevise = () => {
    if (!reviseSlug) return;
    startTransition(async () => {
      try {
        await requestRevision({ slug: reviseSlug, feedback });
        setReviseSlug(null);
        setFeedback("");
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
    { k: "draft", label: "초안" },
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
        <div style={{ marginLeft: "auto" }}>
          <Button variant="primary" size="sm" onClick={() => setDraftOpen(true)}>
            <Sparkles size={14} />
            URL로 초안
          </Button>
        </div>
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
              <div className="meta" style={{ marginTop: 3 }}>
                {p.category && `${p.category} · `}
                {fmtDate(p.updatedAt)}
              </div>
            </button>

            <div style={{ display: "flex", gap: 6, alignItems: "center", flex: "0 0 auto" }}>
              <AiBadge status={p.aiStatus} />
              <Chip variant={p.status === "published" ? "blue" : "purple"}>
                {p.status === "published" ? "발행" : "초안"}
              </Chip>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setReviseSlug(p.slug);
                  setFeedback("");
                }}
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

      {/* URL로 초안 모달 */}
      {draftOpen && (
        <div className="modal-scrim" onClick={() => setDraftOpen(false)}>
          <div
            className="modal"
            style={{ padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>URL로 초안 생성</h3>
            <div className="meta" style={{ marginBottom: 16 }}>
              YouTube·Anthropic 등 링크를 넣으면 로컬 AI 워커가 포스팅 초안을 만듭니다.
            </div>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              autoFocus
              style={{ ...inputBox, marginBottom: 10 }}
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="요청 메모(선택) — 강조할 점, 톤 등"
              rows={3}
              style={{ ...inputBox, resize: "vertical", marginBottom: 16 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setDraftOpen(false)}>
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={pending || !url.trim()}
                onClick={onCreateDraft}
              >
                {pending ? "요청 중..." : "초안 요청"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI 개선 모달 */}
      {reviseSlug && (
        <div className="modal-scrim" onClick={() => setReviseSlug(null)}>
          <div
            className="modal"
            style={{ padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>AI 개선 요청</h3>
            <div className="meta" style={{ marginBottom: 16 }}>
              {reviseSlug} — 피드백을 적으면 워커가 그대로 반영해 다시 작성합니다.
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="예) 도입 인용구를 더 짧게, 마지막 헤드라인은 시사점 중심으로"
              rows={5}
              autoFocus
              style={{ ...inputBox, resize: "vertical", marginBottom: 16 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setReviseSlug(null)}>
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={pending || !feedback.trim()}
                onClick={onRevise}
              >
                {pending ? "요청 중..." : "개선 요청"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
