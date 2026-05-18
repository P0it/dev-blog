"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  moveCategoryOrder,
} from "@/app/admin/categories/actions";
import type { AdminCategory } from "@/lib/queries";

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

type EditState =
  | { mode: "new" }
  | { mode: "edit"; cat: AdminCategory }
  | null;

export function CategoriesManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [edit, setEdit] = useState<EditState>(null);

  const [slug, setSlug] = useState("");
  const [label, setLabel] = useState("");
  const [parent, setParent] = useState<string>("");

  const tops = categories.filter((c) => !c.parent_slug);
  const fail = (e: unknown) => alert(`에러: ${(e as Error).message}`);

  const openNew = () => {
    setSlug("");
    setLabel("");
    setParent("");
    setEdit({ mode: "new" });
  };
  const openEdit = (cat: AdminCategory) => {
    setSlug(cat.slug);
    setLabel(cat.label);
    setParent(cat.parent_slug ?? "");
    setEdit({ mode: "edit", cat });
  };

  const submit = () => {
    startTransition(async () => {
      try {
        if (edit?.mode === "new") {
          await createCategory({ slug, label, parentSlug: parent || null });
        } else if (edit?.mode === "edit") {
          await updateCategory({ slug: edit.cat.slug, label, parentSlug: parent || null });
        }
        setEdit(null);
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });
  };

  const move = (s: string, dir: "up" | "down") =>
    startTransition(async () => {
      try {
        await moveCategoryOrder(s, dir);
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });

  const remove = (cat: AdminCategory) => {
    const msg =
      `"${cat.label}" 카테고리를 삭제할까요?\n` +
      `- 이 카테고리 글 ${cat.postCount}개는 미분류가 됩니다\n` +
      `- 하위 카테고리가 있으면 최상위로 올라갑니다`;
    if (!confirm(msg)) return;
    startTransition(async () => {
      try {
        await deleteCategory(cat.slug);
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
            <Plus size={14} />새 카테고리
          </Button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {categories.length === 0 && (
          <div className="meta" style={{ padding: 24 }}>
            카테고리가 없습니다.
          </div>
        )}
        {categories.map((c, i) => (
          <div
            key={c.slug}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              borderTop: i ? "1px solid var(--line-subtle)" : "none",
            }}
          >
            <div style={{ flex: 1, minWidth: 0, paddingLeft: c.parent_slug ? 20 : 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg-strong)" }}>
                {c.parent_slug && (
                  <span style={{ color: "var(--fg-alternative)" }}>↳ </span>
                )}
                {c.label}
              </div>
              <div className="meta" style={{ marginTop: 2 }}>
                {c.slug}
                {c.parent_slug && ` · 상위: ${c.parent_slug}`}
              </div>
            </div>
            <Chip variant="default">글 {c.postCount}</Chip>
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending || i === 0}
                onClick={() => move(c.slug, "up")}
                title="위로"
              >
                <ArrowUp size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending || i === categories.length - 1}
                onClick={() => move(c.slug, "down")}
                title="아래로"
              >
                <ArrowDown size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => openEdit(c)}
                title="수정"
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => remove(c)}
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
              {edit.mode === "new" ? "새 카테고리" : `카테고리 수정 — ${edit.cat.slug}`}
            </h3>

            {edit.mode === "new" && (
              <>
                <div style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}>
                  슬러그 (비우면 이름에서 자동 생성, 생성 후 변경 불가)
                </div>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="예: ai-security"
                  style={{ ...inputBox, marginBottom: 12 }}
                />
              </>
            )}

            <div style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}>
              이름
            </div>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: AI 보안"
              autoFocus
              style={{ ...inputBox, marginBottom: 12 }}
            />

            <div style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}>
              상위 카테고리
            </div>
            <select
              value={parent}
              onChange={(e) => setParent(e.target.value)}
              style={{ ...inputBox, marginBottom: 20 }}
            >
              <option value="">(최상위)</option>
              {tops
                .filter((t) => edit.mode === "new" || t.slug !== edit.cat.slug)
                .map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label}
                  </option>
                ))}
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setEdit(null)}>
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={pending || !label.trim()}
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
