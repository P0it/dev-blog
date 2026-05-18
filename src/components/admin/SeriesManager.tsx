"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { createSeries, updateSeries, deleteSeries } from "@/app/admin/series/actions";

type Series = { slug: string; title: string; description: string | null; count: number };

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

type EditState = { mode: "new" } | { mode: "edit"; s: Series } | null;

export function SeriesManager({ series }: { series: Series[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [edit, setEdit] = useState<EditState>(null);

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const fail = (e: unknown) => alert(`에러: ${(e as Error).message}`);

  const openNew = () => {
    setSlug("");
    setTitle("");
    setDesc("");
    setEdit({ mode: "new" });
  };
  const openEdit = (s: Series) => {
    setSlug(s.slug);
    setTitle(s.title);
    setDesc(s.description ?? "");
    setEdit({ mode: "edit", s });
  };

  const submit = () => {
    startTransition(async () => {
      try {
        if (edit?.mode === "new") {
          await createSeries({ slug, title, description: desc });
        } else if (edit?.mode === "edit") {
          await updateSeries({ slug: edit.s.slug, title, description: desc });
        }
        setEdit(null);
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });
  };

  const remove = (s: Series) => {
    if (
      !confirm(
        `"${s.title}" 시리즈를 삭제할까요?\n글 ${s.count}개는 남고 시리즈 소속만 해제됩니다.`,
      )
    )
      return;
    startTransition(async () => {
      try {
        await deleteSeries(s.slug);
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", marginBottom: 16 }}>
        <div style={{ marginLeft: "auto" }}>
          <Button variant="primary" size="sm" onClick={openNew}>
            <Plus size={14} />새 시리즈
          </Button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {series.length === 0 && (
          <div className="meta" style={{ padding: 24 }}>
            시리즈가 없습니다. 글의 시리즈 소속·순서는 글 에디터에서 지정합니다.
          </div>
        )}
        {series.map((s, i) => (
          <div
            key={s.slug}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 18px",
              borderTop: i ? "1px solid var(--line-subtle)" : "none",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg-strong)" }}>
                {s.title}
              </div>
              <div className="meta" style={{ marginTop: 2 }}>
                {s.slug}
                {s.description && ` · ${s.description}`}
              </div>
            </div>
            <Chip variant="default">글 {s.count}</Chip>
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => openEdit(s)}
                title="수정"
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => remove(s)}
                title="삭제"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div className="modal-scrim" onClick={() => setEdit(null)}>
          <div
            className="modal"
            style={{ padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 18 }}>
              {edit.mode === "new" ? "새 시리즈" : `시리즈 수정 — ${edit.s.slug}`}
            </h3>

            {edit.mode === "new" && (
              <>
                <div style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}>
                  슬러그 (비우면 제목에서 자동 생성, 생성 후 변경 불가)
                </div>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="예: claude-code-deep-dive"
                  style={{ ...inputBox, marginBottom: 12 }}
                />
              </>
            )}

            <div style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}>
              제목
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="시리즈 제목"
              autoFocus
              style={{ ...inputBox, marginBottom: 12 }}
            />

            <div style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}>
              설명 (선택)
            </div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="이 시리즈가 무엇을 다루는지"
              style={{ ...inputBox, resize: "vertical", marginBottom: 20 }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setEdit(null)}>
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={pending || !title.trim()}
                onClick={submit}
              >
                {pending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
