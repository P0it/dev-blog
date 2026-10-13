"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PageBody } from "@/components/post/PageBody";
import { Button } from "@/components/ui/Button";
import { AiReviseModal } from "@/components/admin/AiModals";
import { BlockAiCompare } from "@/components/admin/BlockAiCompare";
import { requestBlockRevise, getBlockJob, cancelBlockJob } from "@/app/admin/editor/block-actions";
import {
  listBlocks, blockHtml, moveBlock, moveBlockTo, duplicateBlock, removeBlock,
  replaceBlock, annotateForCanvas, cleanCanvasHtml, scriptHooks, editableTarget,
  findBlockIndex, missingHooks, inContext, type BlockInfo,
} from "@/lib/page-blocks";

// HTML 페이지 글 비주얼 편집기. 설계: docs/superpowers/specs/2026-10-13-admin-html-visual-editor-design.md
// 본문 문자열(value)이 유일한 진실이다. 편집 탭은 스크립트를 잠근 HTML 을 그리고
// 글자를 고치면 캔버스 DOM 을 직렬화·정리해 되돌린다. 실행 미리보기 탭만 스크립트를 돌린다.
//
// 화면은 피그마식이다: 회색 작업판 위에 글 하나가 프레임으로 놓이고, 마우스를 올리면 얇은
// 파란 테두리, 클릭하면 선택 박스·이름표·모서리 핸들, 더블클릭하면 글자 편집. 블록 도구는
// 선택한 블록 위에 떠 있는 어두운 막대에 모은다. 왼쪽 블록 목록은 레이어 패널처럼 선택과 함께 움직인다.

const SIDEBAR_W = 300;
const ACCENT = "#0d99ff"; // 피그마 선택색. 테마와 상관없이 같은 색을 쓴다.
const asideStyle: React.CSSProperties = {
  borderRight: "1px solid var(--line-subtle)", overflow: "auto", padding: "12px 8px", minHeight: 0,
};

type AiJob = { id: number; index: number; before: string; startedAt: number; status: string; after?: string };
// 선택 = 블록 번호 + 블록 안 요소까지의 자식 순번 경로(null 이면 블록 자체).
// 캔버스는 저장할 때마다 다시 그려지므로 DOM 참조 대신 경로로 들고 있다가 다시 찾는다.
type Selection = { block: number; path: number[] | null };
type Box = { top: number; left: number; width: number; height: number };

function pathFrom(block: Element, el: Element): number[] {
  const path: number[] = [];
  let cur: Element | null = el;
  while (cur && cur !== block) {
    const parent: Element | null = cur.parentElement;
    if (!parent) break;
    path.unshift(Array.prototype.indexOf.call(parent.children, cur));
    cur = parent;
  }
  return path;
}

function resolve(canvas: HTMLElement | null, sel: Selection | null): { block: Element; el: Element } | null {
  if (!canvas || !sel) return null;
  const block = canvas.querySelector(`[data-edit-block="${sel.block}"]`);
  if (!block) return null;
  let el: Element | undefined = block;
  for (const i of sel.path ?? []) {
    el = el?.children[i];
    if (!el) return { block, el: block };
  }
  return { block, el };
}

export function PageVisualEditor({
  value,
  onChange,
  slug,
  meta,
}: {
  value: string;
  onChange: (next: string) => void;
  slug: string | null;
  meta: React.ReactNode; // 사이드바 "글 정보" 탭에 넣을 메타 입력칸(제목·카테고리·태그·날짜·썸네일)
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [side, setSide] = useState<"blocks" | "meta">("blocks");
  const [sel, setSel] = useState<Selection | null>(null);
  const [hover, setHover] = useState<Box | null>(null);
  const [boxes, setBoxes] = useState<{ sel: Box; block: Box; tag: string } | null>(null);
  const [measureTick, setMeasureTick] = useState(0);
  const [htmlEdit, setHtmlEdit] = useState<{ index: number; text: string; error?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const history = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });
  // 블록 AI 수정 — 로컬 워커가 처리한다. 결과는 비교 창에서 수락할 때만 본문에 들어간다.
  const [aiAsk, setAiAsk] = useState<number | null>(null); // 요청 창을 연 블록 번호
  const [aiBusy, setAiBusy] = useState(false);
  const [aiJob, setAiJob] = useState<AiJob | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // DOMParser 는 브라우저에만 있다 — 마운트 전엔 계산하지 않는다.
  const blocks: BlockInfo[] = useMemo(() => (mounted ? listBlocks(value) : []), [mounted, value]);
  const hooks = useMemo(() => (mounted ? scriptHooks(value) : []), [mounted, value]);
  const canvasHtml = useMemo(() => (mounted ? annotateForCanvas(value) : ""), [mounted, value]);
  // React 19 는 dangerouslySetInnerHTML 을 객체 동일성으로 비교한다. 렌더마다 새 객체를 주면
  // 선택·호버만 바뀌어도 캔버스 innerHTML 이 다시 들어가 편집 중인 요소가 문서에서 떨어져 나간다.
  const canvasInner = useMemo(() => ({ __html: canvasHtml }), [canvasHtml]);

  // 되돌리기 등으로 블록 수가 줄면 선택을 푼다.
  useEffect(() => {
    if (sel && sel.block >= blocks.length) setSel(null);
  }, [sel, blocks.length]);

  // 작업판 안 좌표(스크롤 포함). 오버레이가 같은 스크롤 상자 안에 있어 함께 움직인다.
  const boxOf = useCallback((el: Element): Box | null => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const r = el.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    return { top: r.top - w.top + wrap.scrollTop, left: r.left - w.left + wrap.scrollLeft, width: r.width, height: r.height };
  }, []);

  useLayoutEffect(() => {
    if (tab !== "edit") return setBoxes(null);
    const hit = resolve(canvasRef.current, sel);
    if (!hit) return setBoxes(null);
    const selBox = boxOf(hit.el), blockBox = boxOf(hit.block);
    if (!selBox || !blockBox) return setBoxes(null);
    const tag = hit.el === hit.block ? `▢ ${blocks[sel!.block]?.label ?? "블록"}` : `T ${hit.el.tagName.toLowerCase()}`;
    setBoxes({ sel: selBox, block: blockBox, tag });
  }, [sel, canvasHtml, tab, measureTick, blocks, boxOf]);

  useEffect(() => {
    const h = () => setMeasureTick((t) => t + 1);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const aiJobId = aiJob && !aiJob.after ? aiJob.id : null;
  useEffect(() => {
    if (aiJobId === null) return;
    const t = setInterval(async () => {
      setNow(Date.now());
      try {
        const j = await getBlockJob(aiJobId);
        if (j.status === "done" && j.resultHtml) {
          setAiJob((cur) => (cur && cur.id === aiJobId ? { ...cur, status: "done", after: j.resultHtml! } : cur));
        } else if (j.status === "error") {
          setAiJob(null);
          setNotice(`AI 수정 실패: ${j.message ?? "알 수 없는 오류"}`);
        } else {
          setAiJob((cur) => (cur && cur.id === aiJobId ? { ...cur, status: j.status } : cur));
        }
      } catch (err) {
        setAiJob(null);
        setNotice(`AI 상태 확인 실패: ${(err as Error).message}`);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [aiJobId]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const commit = useCallback(
    (next: string | null, failMsg?: string) => {
      if (next === null) {
        if (failMsg) setNotice(failMsg);
        return false;
      }
      if (next === value) return true;
      history.current.past.push(value);
      history.current.future = [];
      onChange(next);
      return true;
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

  // 블록 도구 — 실행 뒤 선택이 옮겨 간 블록을 따라간다.
  const moveSel = (dir: -1 | 1) => {
    if (!sel) return;
    if (commit(moveBlock(value, sel.block, dir), dir < 0 ? "같은 영역에서 맨 위입니다" : "같은 영역에서 맨 아래입니다")) {
      setSel({ block: sel.block + dir, path: null });
    }
  };
  const duplicateSel = () => {
    if (!sel) return;
    commit(duplicateBlock(value, sel.block));
    setSel({ block: sel.block + 1, path: null });
  };
  const removeSel = () => {
    if (!sel) return;
    commit(removeBlock(value, sel.block));
    setSel(null);
  };

  const startEdit = (el: HTMLElement, x?: number, y?: number) => {
    el.setAttribute("contenteditable", "true");
    el.setAttribute("data-edit-text", "");
    el.focus();
    // 더블클릭한 자리에 커서를 둔다(피그마처럼).
    const range = x !== undefined && y !== undefined && document.caretRangeFromPoint?.(x, y);
    const s = window.getSelection();
    if (range && s) {
      s.removeAllRanges();
      s.addRange(range);
    }
    setHover(null);
  };

  // 키보드 — 글자 편집 중이나 입력칸에서는 가로채지 않는다.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const a = document.activeElement as HTMLElement | null;
      if (a && (a.isContentEditable || a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT")) return;
      if (htmlEdit || aiAsk !== null || tab !== "edit") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (!sel) return;
      if (e.key === "Escape") setSel(null);
      else if ((e.key === "Delete" || e.key === "Backspace") && sel.path === null) {
        e.preventDefault();
        removeSel();
      } else if (e.key === "Enter" && sel.path !== null) {
        const hit = resolve(canvasRef.current, sel);
        if (hit) {
          e.preventDefault();
          startEdit(hit.el as HTMLElement);
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

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
    const block = start.closest("[data-edit-block]");
    if (!block) return setSel(null);
    const index = Number(block.getAttribute("data-edit-block"));
    const el = editableTarget(start, hooks);
    setSel({ block: index, path: el ? pathFrom(block, el) : null });
  };

  const onCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = editableTarget(e.target as Element, hooks) as HTMLElement | null;
    if (!el || el.hasAttribute("data-edit-text")) return;
    const block = el.closest("[data-edit-block]")!;
    setSel({ block: Number(block.getAttribute("data-edit-block")), path: pathFrom(block, el) });
    startEdit(el, e.clientX, e.clientY);
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

  // 마우스를 올린 곳 — 고칠 수 있는 글자면 그 요소, 아니면 블록.
  const onCanvasMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const start = e.target as Element;
    if (start.closest("[data-edit-text]")) return setHover(null);
    const target = editableTarget(start, hooks) ?? start.closest("[data-edit-block]");
    const b = target ? boxOf(target) : null;
    setHover((cur) =>
      cur && b && cur.top === b.top && cur.left === b.left && cur.width === b.width && cur.height === b.height ? cur : b,
    );
  };

  const selectBlock = (index: number) => {
    setTab("edit");
    setSel({ block: index, path: null });
    requestAnimationFrame(() =>
      canvasRef.current
        ?.querySelector(`[data-edit-block="${index}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const to = Number(e.over.id);
    if (commit(moveBlockTo(value, Number(e.active.id), to), "같은 영역 안에서만 옮길 수 있습니다")) {
      setSel({ block: to, path: null });
    }
  };

  const askAi = async (instruction: string) => {
    if (aiAsk === null || !slug) return;
    setAiBusy(true);
    try {
      const before = blockHtml(value, aiAsk);
      const { id } = await requestBlockRevise({ slug, blockHtml: before, instruction });
      setAiJob({ id, index: aiAsk, before, startedAt: Date.now(), status: "pending" });
      setNow(Date.now());
      setAiAsk(null);
    } catch (err) {
      setNotice(`요청 실패: ${(err as Error).message}`);
    } finally {
      setAiBusy(false);
    }
  };

  // 요청 뒤에 블록이 옮겨졌을 수 있어 요청 당시 HTML 로 다시 찾는다. 사라졌으면 적용하지 않는다.
  const acceptAi = () => {
    if (!aiJob?.after) return;
    const idx = findBlockIndex(value, aiJob.before, aiJob.index);
    if (idx < 0) {
      setNotice("요청한 뒤 그 블록이 바뀌어 적용할 수 없습니다");
    } else {
      try {
        commit(replaceBlock(value, idx, aiJob.after));
        setSel({ block: idx, path: null });
      } catch (err) {
        setNotice(`적용 실패: ${(err as Error).message}`);
      }
    }
    setAiJob(null);
  };

  const cancelAi = async () => {
    if (!aiJob) return;
    try {
      await cancelBlockJob(aiJob.id);
    } catch {
      /* 이미 처리 중이면 결과만 버린다 */
    }
    setAiJob(null);
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
      <div style={{ display: "grid", gridTemplateColumns: `${SIDEBAR_W}px minmax(0,1fr)`, height: "100%", minHeight: 0 }}>
        <aside style={asideStyle}>{meta}</aside>
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
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
      </div>
    );
  }

  // 떠 있는 도구 막대 — 선택한 블록 위 오른쪽. 위에 자리가 없으면 블록 안쪽에 붙인다.
  const bar = boxes && sel && {
    top: boxes.block.top - 44 >= (wrapRef.current?.scrollTop ?? 0) ? boxes.block.top - 44 : boxes.block.top + 8,
    left: boxes.block.left + boxes.block.width,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: `${SIDEBAR_W}px minmax(0,1fr)`, height: "100%", minHeight: 0 }}>
      <style>{`
        .pve-board { background: color-mix(in srgb, var(--fg-strong) 7%, var(--bg-base)); }
        .pve-frame { background: var(--bg-base); box-shadow: 0 0 0 1px var(--line-subtle), 0 12px 40px rgba(0,0,0,.18); }
        .pve-canvas [data-edit-text] { outline: none; cursor: text; caret-color: ${ACCENT}; }
        .pve-canvas { cursor: default; }
        .pve-bar button:hover:not(:disabled) { background: rgba(255,255,255,.12) !important; }
        .pve-layer:hover { background: color-mix(in srgb, var(--fg-strong) 6%, transparent); }
      `}</style>
      <aside style={asideStyle}>
        <div style={{ display: "flex", gap: 4, padding: "0 4px 12px" }}>
          <Button size="sm" variant={side === "blocks" ? "primary" : "ghost"} onClick={() => setSide("blocks")}>블록</Button>
          <Button size="sm" variant={side === "meta" ? "primary" : "ghost"} onClick={() => setSide("meta")}>글 정보</Button>
        </div>
        {side === "blocks" ? (
          <>
            <div className="meta" style={{ fontSize: 12, padding: "0 8px 8px" }}>블록 {blocks.length}개 · 끌어서 순서 변경</div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={blocks.map((b) => String(b.index))} strategy={verticalListSortingStrategy}>
                {blocks.map((b) => (
                  <BlockRow key={`${b.index}-${b.label}`} block={b} selected={sel?.block === b.index}
                    onClick={() => selectBlock(b.index)} />
                ))}
              </SortableContext>
            </DndContext>
          </>
        ) : (
          meta
        )}
      </aside>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 16px", borderBottom: "1px solid var(--line-subtle)" }}>
          <Button size="sm" variant={tab === "edit" ? "primary" : "ghost"} onClick={() => setTab("edit")}>편집</Button>
          <Button size="sm" variant={tab === "preview" ? "primary" : "ghost"} onClick={() => { setTab("preview"); setSel(null); }}>실행 미리보기</Button>
          <span className="meta" style={{ fontSize: 12, marginLeft: 8 }}>
            {notice ?? (tab === "edit"
              ? "클릭해 선택 · 더블클릭으로 글자 수정(Enter 확정) · Del 블록 삭제 · Esc 선택 해제 · Ctrl+Z 되돌리기"
              : "스크립트까지 실행한 실제 화면")}
          </span>
          {aiJob && !aiJob.after && (
            <span className="meta" data-pve-ai-status style={{ fontSize: 12, marginLeft: "auto", display: "inline-flex", gap: 8, alignItems: "center" }}>
              <span className="ai-spinner" aria-hidden />
              {aiJob.status === "processing" ? "AI 가 블록을 고치는 중…" : "워커 대기 중…"}
              {aiJob.status === "pending" && now - aiJob.startedAt > 30_000 && " 워커가 꺼져 있을 수 있습니다. PC 에서 npm run ai:worker 를 실행하세요."}
              {aiJob.status === "pending" && <Button size="sm" variant="ghost" onClick={cancelAi}>취소</Button>}
            </span>
          )}
        </div>
        <div
          ref={wrapRef}
          className="pve-board"
          style={{ position: "relative", overflow: "auto", flex: 1 }}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => { if (e.target === e.currentTarget) setSel(null); }}
        >
          <div style={{ padding: "36px 40px 96px" }} onClick={(e) => { if (e.target === e.currentTarget) setSel(null); }}>
            <div className="meta" style={{ fontSize: 11, marginBottom: 8, letterSpacing: "0.02em" }}>
              {tab === "edit" ? "▢ 본문" : "▶ 실행 중"} · {slug ?? "새 글"}
            </div>
            <div className="pve-frame">
              {tab === "edit" ? (
                <div
                  ref={canvasRef}
                  className="post-page pve-canvas"
                  onClick={onCanvasClick}
                  onDoubleClick={onCanvasDoubleClick}
                  onBlur={onFocusOut}
                  onKeyDown={onCanvasKeyDown}
                  onInput={() => setMeasureTick((t) => t + 1)}
                  onPaste={onCanvasPaste}
                  onMouseMove={onCanvasMove}
                  dangerouslySetInnerHTML={canvasInner}
                />
              ) : (
                <PageBody html={value} />
              )}
            </div>
          </div>

          {tab === "edit" && hover && (
            <div aria-hidden style={{ position: "absolute", pointerEvents: "none", top: hover.top, left: hover.left,
              width: hover.width, height: hover.height, outline: `1px solid ${ACCENT}`, zIndex: 3 }} />
          )}
          {boxes && (
            <>
              <div data-pve-selection aria-hidden style={{ position: "absolute", pointerEvents: "none", top: boxes.sel.top, left: boxes.sel.left,
                width: boxes.sel.width, height: boxes.sel.height, outline: `2px solid ${ACCENT}`, zIndex: 4 }}>
                {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => (
                  <span key={`${x}${y}`} style={{ position: "absolute", width: 8, height: 8, background: "#fff",
                    border: `1.5px solid ${ACCENT}`, left: x ? "100%" : 0, top: y ? "100%" : 0, transform: "translate(-50%,-50%)" }} />
                ))}
                <span style={{ position: "absolute", left: -2, bottom: "100%", marginBottom: 4, background: ACCENT, color: "#fff",
                  fontSize: 11, fontWeight: 600, lineHeight: "18px", padding: "0 6px", borderRadius: 3, whiteSpace: "nowrap",
                  maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {boxes.tag}
                </span>
              </div>
              {bar && (
                <div data-pve-toolbar className="pve-bar" style={{ position: "absolute", top: bar.top, left: bar.left, transform: "translateX(-100%)",
                  display: "flex", gap: 2, padding: 4, background: "#1e1e1e", borderRadius: 8,
                  boxShadow: "0 6px 20px rgba(0,0,0,.28)", zIndex: 6 }}>
                  <ToolBtn label="위로" onClick={() => moveSel(-1)}>↑</ToolBtn>
                  <ToolBtn label="아래로" onClick={() => moveSel(1)}>↓</ToolBtn>
                  <ToolBtn label="복제" onClick={duplicateSel}>⧉</ToolBtn>
                  <ToolBtn label="삭제" onClick={removeSel}>🗑</ToolBtn>
                  <span aria-hidden style={{ width: 1, background: "rgba(255,255,255,.18)", margin: "4px 2px" }} />
                  <ToolBtn label={slug ? "AI 수정" : "저장 후 AI 수정"} disabled={!slug || !!aiJob}
                    onClick={() => setAiAsk(sel!.block)}>✨</ToolBtn>
                  <ToolBtn label="HTML 보기" onClick={() => setHtmlEdit({ index: sel!.block, text: blockHtml(value, sel!.block) })}>{"</>"}</ToolBtn>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {aiAsk !== null && (
        <AiReviseModal
          busy={aiBusy}
          targetLabel={`블록: ${blocks[aiAsk]?.label ?? aiAsk + 1}`}
          onClose={() => setAiAsk(null)}
          onSubmit={askAi}
        />
      )}
      {aiJob?.after && (() => {
        // 블록을 원래 래퍼 안에 넣어 그려야 글 CSS 가 실제처럼 걸린다.
        const at = findBlockIndex(value, aiJob.before, aiJob.index);
        const ctx = (html: string) => inContext(value, at < 0 ? aiJob.index : at, html);
        return (
        <BlockAiCompare
          before={ctx(aiJob.before)}
          after={ctx(aiJob.after!)}
          missing={missingHooks(aiJob.before, aiJob.after, hooks)}
          onAccept={acceptAi}
          onReject={() => setAiJob(null)}
        />
        );
      })()}
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

function ToolBtn({ label, onClick, disabled, children }: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled}
      style={{ minWidth: 30, height: 30, border: "none", borderRadius: 6, background: "transparent",
        color: "#fff", cursor: disabled ? "default" : "pointer", fontSize: 14, opacity: disabled ? 0.35 : 1 }}>
      {children}
    </button>
  );
}

function BlockRow({ block, selected, onClick }: { block: BlockInfo; selected: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(block.index) });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} onClick={onClick} data-pve-block-row
      className={selected ? undefined : "pve-layer"}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1,
        padding: "7px 10px", borderRadius: 6, fontSize: 13, cursor: "grab", userSelect: "none",
        display: "flex", gap: 8, alignItems: "center",
        background: selected ? `color-mix(in srgb, ${ACCENT} 18%, transparent)` : undefined,
        color: "var(--fg-strong)", fontWeight: selected ? 600 : undefined }}>
      <span aria-hidden style={{ color: selected ? ACCENT : "var(--fg-alternative)", fontSize: 11 }}>▢</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.label}</span>
    </div>
  );
}
