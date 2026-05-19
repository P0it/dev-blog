"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostBody } from "@/components/post/PostBody";
import { deriveReadingMin } from "@/lib/markdown";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { AiDraftModal, AiReviseModal } from "@/components/admin/AiModals";
import {
  saveDraft,
  publishPost,
  uploadImage,
  type EditorInput,
} from "@/app/admin/editor/actions";
import {
  requestRevision,
  requestDraftFromUrl,
} from "@/app/admin/posts/actions";

type Category = { slug: string; label: string; parent_slug: string | null };

type Initial = {
  originalSlug: string | null;
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
  categorySlug: string | null;
  tags: string[];
  thumbKind: string;
  isFeatured: boolean;
  readingMin: string;
  status: "draft" | "published";
  seriesSlug: string | null;
  seriesOrder: number | null;
};

type Series = { slug: string; title: string };

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

export function PostEditor({
  initial,
  categories,
  series,
}: {
  initial: Initial;
  categories: Category[];
  series: Series[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"draft" | "published">(initial.status);

  const [slug, setSlug] = useState(initial.slug);
  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [bodyMd, setBodyMd] = useState(initial.bodyMd);
  const [categorySlug, setCategorySlug] = useState<string | "">(initial.categorySlug ?? "");
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [thumbKind, setThumbKind] = useState(initial.thumbKind);
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const [seriesSlug, setSeriesSlug] = useState(initial.seriesSlug ?? "");
  const [seriesTitle, setSeriesTitle] = useState(
    series.find((s) => s.slug === initial.seriesSlug)?.title ?? "",
  );
  const [seriesOrder, setSeriesOrder] = useState<string>(
    initial.seriesOrder != null ? String(initial.seriesOrder) : "",
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiReviseOpen, setAiReviseOpen] = useState(false);
  // 메타데이터는 상단 토글 패널로 — 새 글이면 펼친 채 시작(입력 필요),
  // 기존 글이면 접은 채 시작해 에디터+프리뷰가 화면을 꽉 채우게.
  const [metaOpen, setMetaOpen] = useState(!initial.originalSlug);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = useCallback((text: string) => {
    const el = textareaRef.current;
    if (!el) {
      setBodyMd((b) => b + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setBodyMd((b) => b.slice(0, start) + text + b.slice(end));
    // 다음 tick에 커서 이동
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  }, []);

  const doUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const placeholder = `![업로드 중…](${file.name})`;
        insertAtCursor(placeholder);
        const fd = new FormData();
        fd.append("file", file);
        const { url } = await uploadImage(fd);
        const final = `![${file.name.replace(/\.[^.]+$/, "")}](${url})`;
        // placeholder 치환
        setBodyMd((b) => b.replace(placeholder, final));
      } catch (e) {
        alert(`업로드 실패: ${(e as Error).message}`);
        setBodyMd((b) => b.replace(/!\[업로드 중…\]\([^)]*\)/, ""));
      } finally {
        setUploading(false);
      }
    },
    [insertAtCursor],
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const item = Array.from(e.clipboardData.items).find((i) =>
        i.type.startsWith("image/"),
      );
      if (!item) return;
      const file = item.getAsFile();
      if (!file) return;
      e.preventDefault();
      doUpload(file);
    },
    [doUpload],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      for (const f of files) doUpload(f);
    },
    [doUpload],
  );

  const onPickFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) doUpload(f);
      e.target.value = "";
    },
    [doUpload],
  );

  const input: EditorInput = useMemo(
    () => ({
      originalSlug: initial.originalSlug,
      slug,
      title,
      excerpt,
      bodyMd,
      categorySlug: categorySlug || null,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      thumbKind,
      isFeatured,
      // 읽는 시간은 본문 분량에서 자동 계산 — 수동 입력 폐지
      readingMin: deriveReadingMin(bodyMd),
      seriesSlug: seriesSlug.trim() || null,
      seriesOrder: seriesOrder.trim() ? Number(seriesOrder) : null,
      seriesTitle,
    }),
    [initial.originalSlug, slug, title, excerpt, bodyMd, categorySlug, tagsText, thumbKind, isFeatured, seriesSlug, seriesOrder, seriesTitle],
  );

  // 미저장 변경 추적: 마운트 시점 입력을 기준선으로, 저장/발행 성공 시 갱신.
  const baselineRef = useRef<string | null>(null);
  const inputKey = JSON.stringify(input);
  if (baselineRef.current === null) baselineRef.current = inputKey;
  const dirty = baselineRef.current !== inputKey;

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const markClean = () => {
    baselineRef.current = JSON.stringify(input);
  };

  // 기존 draft 자동 임시저장(4s 디바운스). 새 글은 제외(저장 시 슬러그 이동이
  // 입력을 끊음). 슬러그 변경 중에도 제외(조용한 리네임 방지 — 수동 저장으로).
  useEffect(() => {
    if (!initial.originalSlug || !dirty || pending) return;
    if (slug !== initial.slug) return;
    const t = setTimeout(() => {
      startTransition(async () => {
        try {
          await saveDraft(input);
          markClean();
        } catch {
          /* 자동저장 실패는 조용히 — 수동 '임시 저장'으로 커버 */
        }
      });
    }, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey, dirty, pending, initial.originalSlug, initial.slug, slug]);

  const onSave = () => {
    startTransition(async () => {
      try {
        const res = await saveDraft(input);
        setStatus("draft");
        markClean();
        if (res.slug !== initial.originalSlug) {
          router.replace(`/admin/editor?slug=${encodeURIComponent(res.slug)}`);
        } else {
          router.refresh();
        }
      } catch (e) {
        alert(`저장 실패: ${(e as Error).message}`);
      }
    });
  };

  const onPublish = () => {
    if (!title.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await publishPost(input);
        setStatus("published");
        markClean();
        if (res.slug !== initial.originalSlug) {
          router.replace(`/admin/editor?slug=${encodeURIComponent(res.slug)}`);
        } else {
          router.refresh();
        }
      } catch (e) {
        alert(`발행 실패: ${(e as Error).message}`);
      }
    });
  };

  const onAiRevise = (feedback: string) => {
    if (!initial.originalSlug) return;
    startTransition(async () => {
      try {
        await requestRevision({ slug: initial.originalSlug!, feedback });
        setAiReviseOpen(false);
        alert("AI 개선을 요청했습니다. 워커가 처리하면 새로고침해 확인하세요.");
        router.refresh();
      } catch (e) {
        alert(`요청 실패: ${(e as Error).message}`);
      }
    });
  };

  // URL→초안은 새 글에서만. 요청 후 그 draft 슬러그로 이동.
  const onAiDraft = (v: { url: string; note: string }) => {
    startTransition(async () => {
      try {
        const res = await requestDraftFromUrl(v);
        setAiDraftOpen(false);
        router.replace(`/admin/editor?slug=${encodeURIComponent(res.slug)}`);
      } catch (e) {
        alert(`요청 실패: ${(e as Error).message}`);
      }
    });
  };

  return (
    <>
      <AdminTopbar
        left={
          <>
            <Link href="/admin/posts">
              <Button variant="ghost" size="sm">← 목록</Button>
            </Link>
            <Button
              variant={metaOpen ? "primary" : "outline"}
              size="sm"
              onClick={() => setMetaOpen((v) => !v)}
              aria-expanded={metaOpen}
            >
              메타데이터 {metaOpen ? "▴" : "▾"}
            </Button>
          </>
        }
      >
        {initial.originalSlug ? (
          <Button variant="ghost" size="sm" onClick={() => setAiReviseOpen(true)} disabled={pending}>
            AI 개선
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setAiDraftOpen(true)} disabled={pending}>
            URL로 초안
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onSave} disabled={pending}>임시 저장</Button>
        <Button variant="primary" size="sm" onClick={onPublish} disabled={pending}>
          {status === "published" ? "업데이트" : "발행"}
        </Button>
      </AdminTopbar>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 56px)",
        }}
      >
        {/* 메타데이터 — 상단 토글 패널. 접으면 에디터+프리뷰가 화면을 꽉 채운다 */}
        {metaOpen && (
          <div
            style={{
              padding: "20px 24px",
              overflow: "auto",
              maxHeight: "44vh",
              borderBottom: "1px solid var(--line-subtle)",
              background: "var(--bg-subtle)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px 20px",
              alignItems: "start",
            }}
          >
          <Field label="제목" span={2}>
            <input style={inputBox} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
          </Field>

          <Field label="슬러그">
            <input
              style={{ ...inputBox, fontFamily: "var(--font-mono)" }}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-from-title"
            />
            <div style={{ fontSize: 11, color: "var(--fg-alternative)", marginTop: 4, lineHeight: 1.4 }}>
              비워두면 제목으로부터 자동 생성 · /posts/{slug || "(slug)"}
            </div>
          </Field>

          <Field label="요약" span={2}>
            <textarea
              style={{ ...inputBox, minHeight: 70, resize: "vertical", lineHeight: 1.5 }}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </Field>

          <Field label="카테고리">
            <select
              style={inputBox}
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              <option value="">— 없음 —</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.parent_slug ? `  ${c.label}` : c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="태그 (쉼표로 구분)">
            <input
              style={inputBox}
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="claude-code, subprocess"
            />
          </Field>

          <Field label="썸네일 종류 (a–f)">
            <select style={inputBox} value={thumbKind} onChange={(e) => setThumbKind(e.target.value)}>
              {["a", "b", "c", "d", "e", "f"].map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </Field>

          <Field label="시리즈 슬러그 (선택)">
            <input
              style={{ ...inputBox, fontFamily: "var(--font-mono)" }}
              list="series-list"
              value={seriesSlug}
              onChange={(e) => {
                setSeriesSlug(e.target.value);
                const found = series.find((s) => s.slug === e.target.value);
                if (found) setSeriesTitle(found.title);
              }}
              placeholder="agent-infra"
            />
            <datalist id="series-list">
              {series.map((s) => (
                <option key={s.slug} value={s.slug}>{s.title}</option>
              ))}
            </datalist>
          </Field>

          {seriesSlug.trim() && (
            <>
              <Field label="시리즈 제목 (새 시리즈일 때)">
                <input
                  style={inputBox}
                  value={seriesTitle}
                  onChange={(e) => setSeriesTitle(e.target.value)}
                  placeholder="에이전트 인프라"
                />
              </Field>
              <Field label="시리즈 순서">
                <input
                  type="number"
                  style={inputBox}
                  value={seriesOrder}
                  onChange={(e) => setSeriesOrder(e.target.value)}
                  placeholder="1"
                />
              </Field>
            </>
          )}

          <Field label="옵션">
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              에디터 추천 (홈 큐레이션)
            </label>
          </Field>
          </div>
        )}

        {/* 에디터 + 프리뷰 — 화면을 꽉 채우는 분할 뷰 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            flex: 1,
            minHeight: 0,
          }}
        >
        {/* 마크다운 입력 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--line-subtle)",
            position: "relative",
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: "8px 16px",
              borderBottom: "1px solid var(--line-subtle)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 12,
              color: "var(--fg-neutral)",
            }}
          >
            <label
              style={{
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid var(--line-normal)",
                color: "var(--fg-strong)",
                fontWeight: 600,
              }}
            >
              이미지 업로드
              <input
                type="file"
                accept="image/*"
                onChange={onPickFile}
                style={{ display: "none" }}
              />
            </label>
            <span>붙여넣기 · 드래그 · 버튼 모두 지원</span>
            {uploading && <span style={{ color: "var(--fg-strong)" }}>업로드 중…</span>}
          </div>
          <textarea
            ref={textareaRef}
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            onPaste={onPaste}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            placeholder={"# 제목\n\n> 한 줄 요약\n\n## 섹션\n\n본문…"}
            spellCheck={false}
            style={{
              flex: 1,
              padding: "24px 28px",
              border: "none",
              outline: dragOver ? "2px dashed var(--fg-strong)" : "none",
              outlineOffset: "-8px",
              resize: "none",
              fontFamily: "var(--font-mono)",
              fontSize: 13.5,
              lineHeight: 1.7,
              color: "var(--fg-strong)",
              background: "var(--bg-base)",
              overflow: "auto",
            }}
          />
        </div>

        {/* 라이브 프리뷰 — 실제 발행 페이지와 동일한 폭(최대 720px)·렌더러.
            가로 패딩은 스크롤 컨테이너에 둬서 본문 측정폭이 발행 페이지와 정확히 일치한다 */}
        <div
          style={{
            overflow: "auto",
            background: "var(--bg-base)",
            minWidth: 0,
            padding: "48px 40px 96px",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {/* excerpt는 카드·검색·SEO 전용 — 상세/프리뷰엔 노출 안 함 (POSTING.md).
                독자가 보는 요약은 본문 맨 위 `>` 인용구가 담당 */}
            <h1 className="prose post-title">{title || "(제목 없음)"}</h1>
            <PostBody md={bodyMd} fallback="본문 미리보기" />
          </div>
        </div>
        </div>
      </div>
      {aiDraftOpen && (
        <AiDraftModal
          busy={pending}
          onClose={() => setAiDraftOpen(false)}
          onSubmit={onAiDraft}
        />
      )}
      {aiReviseOpen && (
        <AiReviseModal
          busy={pending}
          targetLabel={initial.originalSlug ?? slug}
          onClose={() => setAiReviseOpen(false)}
          onSubmit={onAiRevise}
        />
      )}
    </>
  );
}

function Field({
  label,
  span,
  children,
}: {
  label: string;
  span?: number;
  children: React.ReactNode;
}) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : undefined}>
      <div style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
