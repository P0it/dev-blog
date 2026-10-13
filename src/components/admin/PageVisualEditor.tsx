"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PageBody } from "@/components/post/PageBody";
import { Button } from "@/components/ui/Button";
import {
  listBlocks, blockHtml, moveBlock, moveBlockTo, duplicateBlock, removeBlock,
  replaceBlock, annotateForCanvas, cleanCanvasHtml, scriptHooks, editableTarget,
  type BlockInfo,
} from "@/lib/page-blocks";

// HTML 페이지 글 비주얼 편집기. 설계: docs/superpowers/specs/2026-10-13-admin-html-visual-editor-design.md
// 본문 문자열(value)이 유일한 진실이다. 편집 탭은 스크립트를 잠근 HTML 을 그리고
// 글자를 고치면 캔버스 DOM 을 직렬화·정리해 되돌린다. 실행 미리보기 탭만 스크립트를 돌린다.

type Toolbar = { index: number; top: number; left: number };

export function PageVisualEditor({
  value,
  onChange,
  slug,
}: {
  value: string;
  onChange: (next: string) => void;
  slug: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [toolbar, setToolbar] = useState<Toolbar | null>(null);
  const [htmlEdit, setHtmlEdit] = useState<{ index: number; text: string; error?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const history = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });

  // DOMParser 는 브라우저에만 있다 — 마운트 전엔 계산하지 않는다.
  const blocks: BlockInfo[] = useMemo(() => (mounted ? listBlocks(value) : []), [mounted, value]);
  const hooks = useMemo(() => (mounted ? scriptHooks(value) : []), [mounted, value]);
  const canvasHtml = useMemo(() => (mounted ? annotateForCanvas(value) : ""), [mounted, value]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const commit = useCallback(
    (next: string | null, failMsg?: string) => {
      if (next === null) {
        if (failMsg) setNotice(failMsg);
        return;
      }
      if (next === value) return;
      history.current.past.push(value);
      history.current.future = [];
      onChange(next);
    },
    [value, onChange],
  );

  const undo = useCallback(() => {
    const prev = history.current.past.pop();
    if (prev === undefined) return;
    history.current.future.push(value);
    onChange(prev);
  }, [value, onChange]);

  const redo = useCallback(() => {
    const next = history.current.future.pop();
    if (next === undefined) return;
    history.current.past.push(value);
    onChange(next);
  }, [value, onChange]);

  // 되돌리기 — 글자 편집 중(브라우저 기본 되돌리기)이나 입력칸에선 가로채지 않는다.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      const a = document.activeElement as HTMLElement | null;
      if (a && (a.isContentEditable || a.tagName === "INPUT" || a.tagName === "TEXTAREA")) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, redo]);

  // 글자 편집 확정 — 포커스가 빠질 때 캔버스 전체를 직렬화한다.
  // React 의 onBlur 는 자식의 focusout 도 버블링하므로 편집 요소의 blur 를 여기서 받는다.
  const onFocusOut = (e: React.FocusEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (!el.hasAttribute("data-edit-text")) return;
    el.removeAttribute("contenteditable");
    el.removeAttribute("data-edit-text");
    if (canvasRef.current) commit(cleanCanvasHtml(canvasRef.current.innerHTML));
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const start = e.target as Element;
    if (start.closest("[data-edit-text]")) return;
    // 캔버스 안 링크·버튼·폼은 동작하지 않게 한다.
    if (start.closest("a,button,input,select,label,summary")) e.preventDefault();
    const el = editableTarget(start, hooks) as HTMLElement | null;
    if (!el) return;
    el.setAttribute("contenteditable", "true");
    el.setAttribute("data-edit-text", "");
    el.focus();
  };

  const onCanvasKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (!el.hasAttribute("data-edit-text")) return;
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      el.blur();
    }
  };

  // 붙여넣기는 순수 텍스트만 — 다른 페이지의 서식·태그가 섞이지 않게.
  const onCanvasPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest("[data-edit-text]")) return;
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain").replace(/\s+/g, " "));
  };

  const onCanvasMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const block = (e.target as Element).closest("[data-edit-block]");
    const wrap = wrapRef.current;
    if (!block || !wrap) return;
    const index = Number(block.getAttribute("data-edit-block"));
    const r = block.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const top = Math.round(r.top - w.top + wrap.scrollTop + 8);
    const left = Math.round(r.right - w.left + wrap.scrollLeft - 8);
    if (toolbar && toolbar.index === index && toolbar.top === top && toolbar.left === left) return;
    setToolbar({ index, top, left });
  };

  const scrollToBlock = (index: number) => {
    setTab("edit");
    requestAnimationFrame(() =>
      canvasRef.current
        ?.querySelector(`[data-edit-block="${index}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    commit(moveBlockTo(value, Number(e.active.id), Number(e.over.id)), "같은 영역 안에서만 옮길 수 있습니다");
  };

  const applyHtmlEdit = () => {
    if (!htmlEdit) return;
    try {
      commit(replaceBlock(value, htmlEdit.index, htmlEdit.text));
      setHtmlEdit(null);
    } catch (err) {
      setHtmlEdit({ ...htmlEdit, error: (err as Error).message });
    }
  };

  if (!mounted) return null;

  // 블록을 못 찾는 글은 원본 HTML 을 그대로 고친다.
  if (blocks.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        <div className="meta" style={{ padding: "12px 48px" }}>
          이 글은 블록(section) 구조를 찾지 못했습니다. 원본 HTML 을 직접 고칩니다.
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{ flex: 1, padding: "12px 48px", border: "none", outline: "none", resize: "none",
            fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, background: "var(--bg-base)", color: "var(--fg-strong)" }}
        />
      </div>
    );
  }

  const tb = toolbar && toolbar.index < blocks.length ? toolbar : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px minmax(0,1fr)", height: "100%", minHeight: 0 }}>
      <style>{`
        .pve-canvas [data-edit-block]:hover { outline: 2px dashed var(--line-strong, var(--fg-neutral)); outline-offset: -2px; }
        .pve-canvas [data-edit-text] { outline: 2px solid var(--fg-strong); outline-offset: 2px; cursor: text; }
      `}</style>
      <aside style={{ borderRight: "1px solid var(--line-subtle)", overflow: "auto", padding: "12px 8px" }}>
        <div className="meta" style={{ fontSize: 12, padding: "0 8px 8px" }}>블록 {blocks.length}개 · 끌어서 순서 변경</div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={blocks.map((b) => String(b.index))} strategy={verticalListSortingStrategy}>
            {blocks.map((b) => (
              <BlockRow key={`${b.index}-${b.label}`} block={b} onClick={() => scrollToBlock(b.index)} />
            ))}
          </SortableContext>
        </DndContext>
      </aside>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 16px", borderBottom: "1px solid var(--line-subtle)" }}>
          <Button size="sm" variant={tab === "edit" ? "primary" : "ghost"} onClick={() => setTab("edit")}>편집</Button>
          <Button size="sm" variant={tab === "preview" ? "primary" : "ghost"} onClick={() => setTab("preview")}>실행 미리보기</Button>
          <span className="meta" style={{ fontSize: 12, marginLeft: 8 }}>
            {notice ?? (tab === "edit" ? "글자를 클릭해 고치고, Enter 로 확정 · Ctrl+Z 되돌리기" : "스크립트까지 실행한 실제 화면")}
          </span>
        </div>
        <div ref={wrapRef} style={{ position: "relative", overflow: "auto", flex: 1, background: "var(--bg-base)" }}
          onMouseLeave={() => setToolbar(null)}>
          {tab === "edit" ? (
            <>
              <div
                ref={canvasRef}
                className="post-page pve-canvas"
                onClick={onCanvasClick}
                onBlur={onFocusOut}
                onKeyDown={onCanvasKeyDown}
                onPaste={onCanvasPaste}
                onMouseMove={onCanvasMove}
                dangerouslySetInnerHTML={{ __html: canvasHtml }}
              />
              {tb && (
                <div
                  data-pve-toolbar
                  style={{ position: "absolute", top: tb.top, left: tb.left, transform: "translateX(-100%)", display: "flex", gap: 4,
                    padding: 4, background: "var(--bg-base)", border: "1px solid var(--line-subtle)", borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,.12)", zIndex: 5 }}
                >
                  <ToolBtn label="위로" onClick={() => commit(moveBlock(value, tb.index, -1), "같은 영역에서 맨 위입니다")}>↑</ToolBtn>
                  <ToolBtn label="아래로" onClick={() => commit(moveBlock(value, tb.index, 1), "같은 영역에서 맨 아래입니다")}>↓</ToolBtn>
                  <ToolBtn label="복제" onClick={() => commit(duplicateBlock(value, tb.index))}>⧉</ToolBtn>
                  <ToolBtn label="삭제" onClick={() => { commit(removeBlock(value, tb.index)); setToolbar(null); }}>🗑</ToolBtn>
                  <ToolBtn label="HTML 보기" onClick={() => setHtmlEdit({ index: tb.index, text: blockHtml(value, tb.index) })}>{"</>"}</ToolBtn>
                </div>
              )}
            </>
          ) : (
            <PageBody html={value} />
          )}
        </div>
      </div>
      {htmlEdit && (
        <div className="modal-scrim" onClick={() => setHtmlEdit(null)}>
          <div className="modal" style={{ padding: 24, width: "min(960px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>블록 HTML — {blocks[htmlEdit.index]?.label}</h3>
            <textarea
              value={htmlEdit.text}
              onChange={(e) => setHtmlEdit({ ...htmlEdit, text: e.target.value, error: undefined })}
              spellCheck={false}
              rows={20}
              style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.5, padding: 12,
                border: "1px solid var(--line-subtle)", borderRadius: 8, background: "var(--bg-subtle)", color: "var(--fg-strong)" }}
            />
            {htmlEdit.error && <div role="alert" style={{ color: "var(--danger, #d33)", fontSize: 13, marginTop: 8 }}>{htmlEdit.error}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <Button variant="outline" size="sm" onClick={() => setHtmlEdit(null)}>취소</Button>
              <Button variant="primary" size="sm" onClick={applyHtmlEdit}>적용</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      style={{ minWidth: 30, height: 30, border: "none", borderRadius: 6, background: "transparent",
        color: "var(--fg-strong)", cursor: "pointer", fontSize: 14 }}>
      {children}
    </button>
  );
}

function BlockRow({ block, onClick }: { block: BlockInfo; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(block.index) });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} onClick={onClick} data-pve-block-row
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1,
        padding: "8px 10px", borderRadius: 6, fontSize: 13, cursor: "grab", color: "var(--fg-strong)",
        display: "flex", gap: 8, alignItems: "center", userSelect: "none" }}>
      <span aria-hidden style={{ color: "var(--fg-alternative)" }}>≡</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.label}</span>
    </div>
  );
}
