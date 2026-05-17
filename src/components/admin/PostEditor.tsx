"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { Button } from "@/components/ui/Button";
import {
  saveDraft,
  publishPost,
  deletePost,
  uploadImage,
  translatePost,
  type EditorInput,
} from "@/app/admin/editor/actions";

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
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [status, setStatus] = useState<"draft" | "published">(initial.status);

  const [slug, setSlug] = useState(initial.slug);
  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [bodyMd, setBodyMd] = useState(initial.bodyMd);
  const [categorySlug, setCategorySlug] = useState<string | "">(initial.categorySlug ?? "");
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [thumbKind, setThumbKind] = useState(initial.thumbKind);
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const [readingMin, setReadingMin] = useState(initial.readingMin);
  const [seriesSlug, setSeriesSlug] = useState(initial.seriesSlug ?? "");
  const [seriesTitle, setSeriesTitle] = useState(
    series.find((s) => s.slug === initial.seriesSlug)?.title ?? "",
  );
  const [seriesOrder, setSeriesOrder] = useState<string>(
    initial.seriesOrder != null ? String(initial.seriesOrder) : "",
  );
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
      readingMin,
      seriesSlug: seriesSlug.trim() || null,
      seriesOrder: seriesOrder.trim() ? Number(seriesOrder) : null,
      seriesTitle,
    }),
    [initial.originalSlug, slug, title, excerpt, bodyMd, categorySlug, tagsText, thumbKind, isFeatured, readingMin, seriesSlug, seriesOrder, seriesTitle],
  );

  const onSave = () => {
    startTransition(async () => {
      try {
        const res = await saveDraft(input);
        setSavedAt(new Date());
        setStatus("draft");
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
        setSavedAt(new Date());
        setStatus("published");
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

  const onTranslate = () => {
    if (!initial.originalSlug) {
      alert("먼저 임시 저장하세요.");
      return;
    }
    if (!confirm("이 글을 영어로 번역합니다. 1~2분 걸려요. 진행할까요?")) return;
    startTransition(async () => {
      try {
        await translatePost(initial.originalSlug!);
        alert("영어 번역 완료. /en/posts/" + initial.originalSlug + " 에서 확인.");
        router.refresh();
      } catch (e) {
        alert(`번역 실패: ${(e as Error).message}`);
      }
    });
  };

  const onDelete = () => {
    if (!initial.originalSlug) return;
    if (!confirm("정말 삭제할까요? 되돌릴 수 없습니다.")) return;
    startTransition(async () => {
      try {
        await deletePost(initial.originalSlug!);
      } catch (e) {
        alert(`삭제 실패: ${(e as Error).message}`);
      }
    });
  };

  const savedLabel = pending
    ? "저장 중…"
    : savedAt
      ? `저장됨 · ${savedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`
      : initial.originalSlug
        ? `상태: ${status === "published" ? "Published" : "Draft"}`
        : "새 글";

  return (
    <>
      <AdminTopbar>
        <span className="meta">{savedLabel}</span>
        {initial.originalSlug && status === "published" && (
          <Link href={`/posts/${slug}`} target="_blank">
            <Button variant="ghost" size="sm">미리보기</Button>
          </Link>
        )}
        {initial.originalSlug && (
          <Button variant="ghost" size="sm" onClick={onTranslate} disabled={pending}>EN 번역</Button>
        )}
        {initial.originalSlug && (
          <Button variant="ghost" size="sm" onClick={onDelete}>삭제</Button>
        )}
        <Button variant="outline" size="sm" onClick={onSave} disabled={pending}>임시 저장</Button>
        <Button variant="primary" size="sm" onClick={onPublish} disabled={pending}>
          {status === "published" ? "업데이트" : "발행"}
        </Button>
      </AdminTopbar>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr 1fr",
          height: "calc(100vh - 56px)",
        }}
      >
        {/* 메타 패널 */}
        <div
          style={{
            padding: "24px 20px",
            overflow: "auto",
            borderRight: "1px solid var(--line-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div className="t-overline">메타데이터</div>

          <Field label="제목">
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

          <Field label="요약">
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

          <Field label="읽는 시간">
            <input
              style={inputBox}
              value={readingMin}
              onChange={(e) => setReadingMin(e.target.value)}
              placeholder="예: 8분"
            />
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

        {/* 마크다운 입력 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--line-subtle)",
            position: "relative",
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

        {/* 라이브 프리뷰 */}
        <div style={{ padding: "32px 36px", overflow: "auto", background: "var(--bg-base)" }}>
          <div className="prose post-body">
            <h1 style={{ fontSize: 28, margin: "0 0 12px", lineHeight: 1.2 }}>
              {title || "(제목 없음)"}
            </h1>
            {excerpt && (
              <blockquote style={{ margin: "0 0 24px" }}>{excerpt}</blockquote>
            )}
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
              {bodyMd}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
