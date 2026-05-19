"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  CornerDownRight,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import {
  createCategory,
  renameCategory,
  deleteCategory,
  reorderCategories,
} from "@/app/admin/categories/actions";
import type { AdminCategory } from "@/lib/queries";

const INDENT = 24; // depth 1 들여쓰기(px) — 가로 드래그 1칸 = 이만큼

const inputBox: React.CSSProperties = {
  padding: "8px 11px",
  background: "var(--bg-base)",
  border: "1px solid var(--line-normal)",
  borderRadius: 9,
  fontSize: 13,
  color: "var(--fg-strong)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

type Flat = {
  slug: string;
  label: string;
  postCount: number;
  parentSlug: string | null;
  depth: 0 | 1;
};

// AdminCategory[](전역 정렬) → 트리 순서 평탄화. sort_order는 형제 그룹 내
// 순서라 그룹별로 잘라야 정확(전역 정렬해도 그룹 내 상대 순서는 보존).
function buildFlat(cats: AdminCategory[]): Flat[] {
  const by = [...cats].sort((a, b) => a.sort_order - b.sort_order);
  const tops = by.filter((c) => !c.parent_slug);
  const topSet = new Set(tops.map((t) => t.slug));
  const out: Flat[] = [];
  for (const t of tops) {
    out.push({ slug: t.slug, label: t.label, postCount: t.postCount, parentSlug: null, depth: 0 });
    for (const ch of by.filter((c) => c.parent_slug === t.slug))
      out.push({ slug: ch.slug, label: ch.label, postCount: ch.postCount, parentSlug: t.slug, depth: 1 });
  }
  // 부모가 없는 고아 자식 → 최상위로(방어)
  for (const c of by)
    if (c.parent_slug && !topSet.has(c.parent_slug) && !out.some((o) => o.slug === c.slug))
      out.push({ slug: c.slug, label: c.label, postCount: c.postCount, parentSlug: null, depth: 0 });
  return out;
}

const hasKids = (flat: Flat[], slug: string) => flat.some((f) => f.parentSlug === slug);

// 드래그 중 active 의 깊이/부모 추정. 2단계 고정(0=최상위, 1=자식).
function getProjection(
  list: Flat[],
  activeId: string,
  overId: string,
  offsetX: number,
): { depth: 0 | 1; parentSlug: string | null } {
  const overIndex = list.findIndex((f) => f.slug === overId);
  const activeIndex = list.findIndex((f) => f.slug === activeId);
  if (overIndex < 0 || activeIndex < 0) return { depth: 0, parentSlug: null };
  const active = list[activeIndex];
  const moved = arrayMove(list, activeIndex, overIndex);
  const prev = moved[overIndex - 1];
  const next = moved[overIndex + 1];

  const dragDepth = Math.round(offsetX / INDENT);
  const projected = active.depth + dragDepth;
  const maxDepth = prev ? Math.min(prev.depth + 1, 1) : 0;
  const minDepth = next ? next.depth : 0;
  let depth = Math.max(minDepth, Math.min(projected, maxDepth)) as 0 | 1;
  depth = Math.max(0, Math.min(depth, 1)) as 0 | 1;

  // 자식을 가진 항목은 최상위만(자식이 손자가 되는 것 방지)
  if (hasKids(list, activeId)) return { depth: 0, parentSlug: null };
  if (depth === 0) return { depth: 0, parentSlug: null };

  // depth 1 → over 위쪽에서 가장 가까운 최상위가 부모
  for (let i = overIndex - 1; i >= 0; i--) {
    const c = moved[i];
    if (c.slug === activeId) continue;
    if (c.depth === 0) return { depth: 1, parentSlug: c.slug };
  }
  return { depth: 0, parentSlug: null }; // 위에 부모 없음 → 강등 불가
}

// 드롭 후 최종 배열 → 서버로 보낼 {slug,parentSlug,sortOrder}[].
// 부모는 "바로 위 최상위"로 다시 계산해 안정적으로 만든다.
function toDesired(arr: Flat[]) {
  const counters = new Map<string, number>();
  let lastTop: string | null = null;
  return arr.map((f) => {
    const parentSlug = f.depth === 0 ? null : f.parentSlug ?? lastTop;
    if (f.depth === 0) lastTop = f.slug;
    const key = parentSlug ?? "";
    const n = counters.get(key) ?? 0;
    counters.set(key, n + 1);
    return { slug: f.slug, parentSlug, sortOrder: n };
  });
}

export function CategoriesManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // 서버 상태 시그니처 — 바뀔 때만 로컬 트리 리셋(낙관적 업데이트 보존)
  const sig = useMemo(
    () =>
      categories
        .map((c) => `${c.slug}:${c.parent_slug ?? ""}:${c.sort_order}:${c.label}`)
        .join("|"),
    [categories],
  );
  const [items, setItems] = useState<Flat[]>(() => buildFlat(categories));
  useEffect(() => {
    setItems(buildFlat(categories));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [offsetX, setOffsetX] = useState(0);

  const [editing, setEditing] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [addChildFor, setAddChildFor] = useState<string | null>(null);
  const [childLabel, setChildLabel] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [newTop, setNewTop] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 3200);
  };
  const onErr = (e: unknown) => {
    notify(`에러: ${(e as Error).message}`);
    router.refresh(); // 서버 진실로 롤백
  };

  // 드래그 중에는 active 의 자식을 숨겨 함께 따라오게 한다(서브트리 이동)
  const rendered = activeId ? items.filter((f) => f.parentSlug !== activeId) : items;
  const ids = rendered.map((f) => f.slug);
  const projection =
    activeId && overId ? getProjection(rendered, activeId, overId, offsetX) : null;

  const reset = () => {
    setActiveId(null);
    setOverId(null);
    setOffsetX(0);
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
    setOverId(String(e.active.id));
  };
  const onDragMove = (e: DragMoveEvent) => setOffsetX(e.delta.x);
  const onDragOver = (e: DragOverEvent) => setOverId(e.over ? String(e.over.id) : null);

  const onDragEnd = (e: DragEndEvent) => {
    const aId = String(e.active.id);
    const oId = e.over ? String(e.over.id) : null;
    const proj = oId ? getProjection(rendered, aId, oId, offsetX) : null;
    reset();
    if (!oId || !proj) return;

    // 자식 제거된 목록에서 이동 → active 깊이/부모 반영 → 자식 다시 끼움
    const reduced = items.filter((f) => f.parentSlug !== aId);
    const aIdx = reduced.findIndex((f) => f.slug === aId);
    const oIdx = reduced.findIndex((f) => f.slug === oId);
    if (aIdx < 0 || oIdx < 0) return;
    let arr = arrayMove(reduced, aIdx, oIdx).map((f) =>
      f.slug === aId ? { ...f, depth: proj.depth, parentSlug: proj.parentSlug } : f,
    );
    const kids = items.filter((f) => f.parentSlug === aId);
    if (kids.length) {
      const at = arr.findIndex((f) => f.slug === aId);
      arr = [...arr.slice(0, at + 1), ...kids, ...arr.slice(at + 1)];
    }

    const before = items;
    const next = buildFlat(
      toDesired(arr).map((d) => {
        const src = arr.find((f) => f.slug === d.slug)!;
        return {
          slug: d.slug,
          label: src.label,
          parent_slug: d.parentSlug,
          sort_order: d.sortOrder,
          postCount: src.postCount,
        };
      }),
    );
    if (next.map((f) => f.slug + f.parentSlug).join() === before.map((f) => f.slug + f.parentSlug).join() &&
        next.map((f) => f.slug).join() === before.map((f) => f.slug).join())
      return; // 변화 없음

    setItems(next); // 낙관적
    startTransition(async () => {
      try {
        await reorderCategories(toDesired(next));
        router.refresh();
      } catch (err) {
        setItems(before);
        onErr(err);
      }
    });
  };

  const submitRename = (slug: string) => {
    const label = editLabel.trim();
    setEditing(null);
    if (!label) return;
    const before = items;
    setItems((s) => s.map((f) => (f.slug === slug ? { ...f, label } : f)));
    startTransition(async () => {
      try {
        await renameCategory(slug, label);
        router.refresh();
      } catch (err) {
        setItems(before);
        onErr(err);
      }
    });
  };

  const submitAddChild = (parentSlug: string) => {
    const label = childLabel.trim();
    setAddChildFor(null);
    setChildLabel("");
    if (!label) return;
    startTransition(async () => {
      try {
        await createCategory({ slug: "", label, parentSlug });
        router.refresh();
      } catch (err) {
        onErr(err);
      }
    });
  };

  const submitNewTop = () => {
    const label = newTop.trim();
    if (!label) return;
    const slug = advanced ? newSlug.trim() : "";
    setNewTop("");
    setNewSlug("");
    setAdvanced(false);
    startTransition(async () => {
      try {
        await createCategory({ slug, label, parentSlug: null });
        router.refresh();
      } catch (err) {
        onErr(err);
      }
    });
  };

  const doDelete = (slug: string) => {
    setConfirmDel(null);
    const before = items;
    // DB는 ON DELETE SET NULL — 자식은 최상위로 승격
    setItems((s) =>
      s
        .filter((f) => f.slug !== slug)
        .map((f) => (f.parentSlug === slug ? { ...f, parentSlug: null, depth: 0 as const } : f)),
    );
    startTransition(async () => {
      try {
        await deleteCategory(slug);
        router.refresh();
      } catch (err) {
        setItems(before);
        onErr(err);
      }
    });
  };

  return (
    <div style={{ marginTop: 20 }}>
      <p className="meta" style={{ margin: "0 0 14px", lineHeight: 1.6 }}>
        손잡이를 잡고 위아래로 끌어 순서를, 좌우로 끌어 계층을 바꿉니다. 최상위 위로
        끌면 부모로, 부모 아래로 끌면 그 자식이 됩니다. (2단계까지)
      </p>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {rendered.length === 0 && (
          <div className="meta" style={{ padding: 22 }}>
            카테고리가 없습니다. 아래에서 추가하세요.
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={reset}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {rendered.map((f, i) => {
              const depth =
                activeId === f.slug && projection ? projection.depth : f.depth;
              return (
                <Row
                  key={f.slug}
                  flat={f}
                  depth={depth}
                  first={i === 0}
                  pending={pending}
                  isParent={hasKids(items, f.slug)}
                  editing={editing === f.slug}
                  editLabel={editLabel}
                  setEditLabel={setEditLabel}
                  onStartEdit={() => {
                    setEditing(f.slug);
                    setEditLabel(f.label);
                  }}
                  onCancelEdit={() => setEditing(null)}
                  onSubmitEdit={() => submitRename(f.slug)}
                  onAddChild={
                    f.depth === 0
                      ? () => {
                          setAddChildFor(f.slug);
                          setChildLabel("");
                        }
                      : undefined
                  }
                  confirming={confirmDel === f.slug}
                  onAskDelete={() => setConfirmDel(f.slug)}
                  onCancelDelete={() => setConfirmDel(null)}
                  onConfirmDelete={() => doDelete(f.slug)}
                />
              );
            })}
            {addChildFor &&
              (() => {
                // 부모 행 바로 뒤(자식 끝)에 입력 행을 그린다
                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 16px 10px",
                      paddingLeft: 16 + INDENT,
                      borderTop: "1px solid var(--line-subtle)",
                      background: "var(--bg-subtle)",
                    }}
                  >
                    <CornerDownRight size={14} style={{ color: "var(--fg-alternative)" }} />
                    <input
                      autoFocus
                      value={childLabel}
                      onChange={(e) => setChildLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitAddChild(addChildFor);
                        if (e.key === "Escape") setAddChildFor(null);
                      }}
                      placeholder={`"${
                        items.find((x) => x.slug === addChildFor)?.label ?? ""
                      }" 하위 카테고리 이름`}
                      style={{ ...inputBox, maxWidth: 280 }}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={pending || !childLabel.trim()}
                      onClick={() => submitAddChild(addChildFor)}
                    >
                      추가
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAddChildFor(null)}>
                      취소
                    </Button>
                  </div>
                );
              })()}
          </SortableContext>

          <DragOverlay>
            {activeId ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  background: "var(--bg-base)",
                  border: "1px solid var(--line-normal)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--fg-strong)",
                }}
              >
                <GripVertical size={14} style={{ color: "var(--fg-alternative)" }} />
                {items.find((f) => f.slug === activeId)?.label}
                {hasKids(items, activeId) && (
                  <span className="meta">
                    +{items.filter((f) => f.parentSlug === activeId).length}
                  </span>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* 새 최상위 카테고리 — 항상 보이는 입력 행 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderTop: rendered.length ? "1px solid var(--line-subtle)" : "none",
          }}
        >
          <Plus size={15} style={{ color: "var(--fg-alternative)" }} />
          <input
            value={newTop}
            onChange={(e) => setNewTop(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNewTop();
            }}
            placeholder="새 최상위 카테고리 이름"
            style={{ ...inputBox, maxWidth: 260 }}
          />
          {advanced && (
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="슬러그(선택, 생성 후 불변)"
              style={{ ...inputBox, maxWidth: 220, fontFamily: "var(--font-mono)" }}
            />
          )}
          <Button
            variant="primary"
            size="sm"
            disabled={pending || !newTop.trim()}
            onClick={submitNewTop}
          >
            추가
          </Button>
          <button
            type="button"
            className="meta"
            onClick={() => setAdvanced((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-alternative)",
              fontSize: 12,
            }}
          >
            {advanced ? "기본" : "고급"}
          </button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: 60,
            padding: "11px 16px",
            background: "var(--fg-strong)",
            color: "var(--bg-base)",
            borderRadius: 10,
            fontSize: 13,
            maxWidth: 360,
            boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Row({
  flat,
  depth,
  first,
  pending,
  isParent,
  editing,
  editLabel,
  setEditLabel,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onAddChild,
  confirming,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  flat: Flat;
  depth: number;
  first: boolean;
  pending: boolean;
  isParent: boolean;
  editing: boolean;
  editLabel: string;
  setEditLabel: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: () => void;
  onAddChild?: () => void;
  confirming: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: flat.slug });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        borderTop: first ? "none" : "1px solid var(--line-subtle)",
        background: depth > 0 ? "var(--bg-subtle)" : "transparent",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 16px",
          paddingLeft: 16 + depth * INDENT,
          position: "relative",
        }}
      >
        {depth > 0 && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 16 + INDENT / 2,
              top: 0,
              bottom: 0,
              borderLeft: "1px solid var(--line-normal)",
            }}
          />
        )}
        <button
          type="button"
          aria-label="끌어서 이동"
          {...attributes}
          {...listeners}
          style={{
            display: "flex",
            background: "none",
            border: "none",
            padding: 2,
            cursor: "grab",
            color: "var(--fg-alternative)",
            touchAction: "none",
          }}
        >
          <GripVertical size={15} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              autoFocus
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmitEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              onBlur={onSubmitEdit}
              style={{ ...inputBox, maxWidth: 320 }}
            />
          ) : (
            <button
              type="button"
              onClick={onStartEdit}
              title="클릭해 이름 변경"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "text",
                textAlign: "left",
                font: "inherit",
                fontWeight: 600,
                fontSize: 14,
                color: "var(--fg-strong)",
              }}
            >
              {flat.label}
            </button>
          )}
          <div className="meta" style={{ marginTop: 2 }}>
            {flat.slug}
            {isParent && " · 상위"}
          </div>
        </div>

        <Chip variant="default">글 {flat.postCount}</Chip>

        {editing ? (
          <div style={{ display: "flex", gap: 4 }}>
            <Button variant="ghost" size="sm" onClick={onSubmitEdit} title="저장">
              <Check size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelEdit} title="취소">
              <X size={14} />
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 2 }}>
            {onAddChild && (
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={onAddChild}
                title="하위 추가"
              >
                <Plus size={14} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={onStartEdit}
              title="이름 변경"
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={onAskDelete}
              title="삭제"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </div>

      {confirming && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            paddingLeft: 16 + depth * INDENT,
            background: "var(--bg-subtle)",
            borderTop: "1px solid var(--line-subtle)",
          }}
        >
          <span className="meta" style={{ flex: 1, lineHeight: 1.5 }}>
            <strong style={{ color: "var(--fg-strong)" }}>{flat.label}</strong> 삭제 —
            글 {flat.postCount}개는 미분류가 되고, 하위 카테고리는 최상위로 올라갑니다.
          </span>
          <Button variant="outline" size="sm" onClick={onCancelDelete}>
            취소
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirmDelete}>
            삭제
          </Button>
        </div>
      )}
    </div>
  );
}
