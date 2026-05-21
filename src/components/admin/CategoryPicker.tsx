"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

const INDENT = 24; // 자식 들여쓰기(px) — CategoriesManager와 동일

type Category = { slug: string; label: string; parent_slug: string | null };

// 카테고리 선택 — 네이티브 select 대신 모달 트리 피커.
// categories는 getAllCategoriesFlat()이 이미 트리 순서(최상위→자식)로 정렬해 전달.
// value는 슬러그, 빈 문자열("")은 "카테고리 없음".
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  const selected = value ? categories.find((c) => c.slug === value) ?? null : null;
  const parent = selected?.parent_slug
    ? categories.find((c) => c.slug === selected.parent_slug) ?? null
    : null;
  const triggerLabel = selected
    ? parent
      ? `${parent.label} / ${selected.label}`
      : selected.label
    : "카테고리 없음";

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  const pick = (slug: string) => {
    onChange(slug);
    setOpen(false);
  };

  // 맨 위 "카테고리 없음" + 트리 순서 카테고리
  const rows: { slug: string; label: string; depth: 0 | 1; muted?: boolean }[] = [
    { slug: "", label: "카테고리 없음", depth: 0, muted: true },
    ...categories.map((c) => ({
      slug: c.slug,
      label: c.label,
      depth: (c.parent_slug ? 1 : 0) as 0 | 1,
    })),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          border: "1px solid var(--line-subtle)",
          borderRadius: 8,
          fontSize: 13,
          background: "transparent",
          color: selected ? "var(--fg-strong)" : "var(--fg-neutral)",
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        {triggerLabel}
        <ChevronDown size={14} style={{ color: "var(--fg-alternative)" }} />
      </button>

      {open && (
        <div className="modal-scrim" onClick={() => setOpen(false)}>
          <div
            className="modal"
            style={{ width: 420, padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "18px 20px 14px" }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>카테고리 선택</h3>
              <div className="meta" style={{ marginTop: 4 }}>
                글을 분류할 카테고리를 고르세요.
              </div>
            </div>
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {rows.map((r) => {
                const isSel = r.slug === value;
                const isHover = hover === r.slug;
                const bg = isSel
                  ? "var(--bg-emphasized)"
                  : isHover
                    ? "var(--bg-muted)"
                    : r.depth > 0
                      ? "var(--bg-subtle)"
                      : "transparent";
                return (
                  <button
                    key={r.slug || "__none__"}
                    type="button"
                    onClick={() => pick(r.slug)}
                    onMouseEnter={() => setHover(r.slug)}
                    onMouseLeave={() => setHover((h) => (h === r.slug ? null : h))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "11px 16px",
                      paddingLeft: 16 + r.depth * INDENT,
                      border: "none",
                      borderTop: "1px solid var(--line-subtle)",
                      background: bg,
                      color: r.muted ? "var(--fg-neutral)" : "var(--fg-strong)",
                      font: "inherit",
                      fontSize: 14,
                      fontWeight: r.depth === 0 && !r.muted ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                      position: "relative",
                    }}
                  >
                    {r.depth > 0 && (
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
                    <span style={{ flex: 1, minWidth: 0 }}>{r.label}</span>
                    {isSel && (
                      <Check size={15} style={{ color: "var(--fg-primary)" }} />
                    )}
                  </button>
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "12px 16px",
                borderTop: "1px solid var(--line-subtle)",
              }}
            >
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
