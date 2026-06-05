"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MarkdownPreview } from "@/components/post/MarkdownPreview";
import { deriveReadingMin } from "@/lib/markdown";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { AiDraftModal, AiReviseModal } from "@/components/admin/AiModals";
import { TagInput } from "@/components/admin/TagInput";
import { CategoryPicker } from "@/components/admin/CategoryPicker";
import { ThumbnailField } from "@/components/admin/ThumbnailField";
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
import type { ThumbKind } from "@/lib/types";

type Category = { slug: string; label: string; parent_slug: string | null };

type Initial = {
  originalSlug: string | null;
  title: string;
  bodyMd: string;
  categorySlug: string | null;
  tags: string[];
  coverImage: string | null;
  coverBrightness: number | null;
  thumbKind: ThumbKind | null;
  publishedAt: string | null;
  sourceDate: string | null;
  status: "draft" | "published";
};

// `<input type="date">` 의 value 형식(YYYY-MM-DD) 변환.
// UTC 기준 날짜를 사용 — 백데이트 용도엔 일관성이 더 중요하다.
function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// 사용자가 고른 날짜를 ISO 로 직렬화.
// 같은 날짜를 다시 고른 경우 기존 시각을 보존(no-op), 아니면 정오 UTC.
function fromDateInputValue(dateStr: string, existing: string | null): string | null {
  if (!dateStr) return null;
  if (existing && existing.slice(0, 10) === dateStr) return existing;
  return `${dateStr}T12:00:00.000Z`;
}

// 발행일(또는 발행 시 채워질 today)이 원문 작성일보다 앞서는지.
// 둘 다 'YYYY-MM-DD' 비교라 lexicographic == 시간순.
function isPublishedBeforeSource(
  publishedAt: string | null,
  sourceDate: string | null,
  todayDate: string,
): boolean {
  if (!sourceDate) return false;
  const pub = (publishedAt ?? "").slice(0, 10) || todayDate;
  return pub < sourceDate.slice(0, 10);
}

export function PostEditor({
  initial,
  categories,
}: {
  initial: Initial;
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"draft" | "published">(initial.status);

  const [title, setTitle] = useState(initial.title);
  const [bodyMd, setBodyMd] = useState(initial.bodyMd);
  const [categorySlug, setCategorySlug] = useState<string | "">(initial.categorySlug ?? "");
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [coverImage, setCoverImage] = useState<string | null>(initial.coverImage);
  const [coverBrightness, setCoverBrightness] = useState<number | null>(initial.coverBrightness);
  const [thumbKind, setThumbKind] = useState<ThumbKind | null>(initial.thumbKind);
  const [publishedAt, setPublishedAt] = useState<string | null>(initial.publishedAt);
  const [sourceDate, setSourceDate] = useState<string | null>(initial.sourceDate);
  const [tagDraft, setTagDraft] = useState("");
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [aiDraftOpen, setAiDraftOpen] = useState(false);
  const [aiReviseOpen, setAiReviseOpen] = useState(false);
  // 상단바에 진행/완료 메시지. busyMsg = 진행 중, savedFlash = 완료 후 ~2.5s.
  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!savedFlash) return;
    const t = setTimeout(() => setSavedFlash(null), 2500);
    return () => clearTimeout(t);
  }, [savedFlash]);
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

  const input: EditorInput = useMemo(() => {
    // 아직 badge로 확정 안 한 입력값도 저장 시 누락되지 않게 포함
    const pending = tagDraft.trim();
    const allTags =
      pending && !tags.includes(pending) ? [...tags, pending] : tags;
    return {
      originalSlug: initial.originalSlug,
      title,
      bodyMd,
      categorySlug: categorySlug || null,
      tags: allTags,
      coverImage,
      coverBrightness,
      thumbKind,
      publishedAt,
      sourceDate,
      readingMin: deriveReadingMin(bodyMd),
    };
  }, [initial.originalSlug, title, bodyMd, categorySlug, tags, tagDraft, coverImage, coverBrightness, thumbKind, publishedAt, sourceDate]);

  // 미저장 변경 추적
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

  // 기존 draft에만 자동 임시저장(4s 디바운스). 신규 글은 슬러그 자동 생성으로 URL이
  // 바뀌므로 입력을 끊지 않게 수동 저장으로 한정.
  useEffect(() => {
    if (!initial.originalSlug || !dirty || pending) return;
    const t = setTimeout(() => {
      setBusyMsg("자동 저장 중…");
      startTransition(async () => {
        try {
          await saveDraft(input);
          markClean();
          setSavedFlash("✓ 자동 저장됨");
        } catch {
          /* 자동저장 실패는 조용히 */
        } finally {
          setBusyMsg(null);
        }
      });
    }, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey, dirty, pending, initial.originalSlug]);

  const onSave = () => {
    setBusyMsg("저장 중…");
    startTransition(async () => {
      try {
        const res = await saveDraft(input);
        setStatus("draft");
        markClean();
        setSavedFlash("✓ 저장됨");
        if (res.slug !== initial.originalSlug) {
          router.replace(`/admin/editor?slug=${encodeURIComponent(res.slug)}`);
        } else {
          router.refresh();
        }
      } catch (e) {
        alert(`저장 실패: ${(e as Error).message}`);
      } finally {
        setBusyMsg(null);
      }
    });
  };

  const publishedBeforeSource = useMemo(
    () => isPublishedBeforeSource(publishedAt, sourceDate, todayDate),
    [publishedAt, sourceDate, todayDate],
  );

  // 클라이언트 라우팅(<Link>)·뒤로가기는 beforeunload가 안 잡는다.
  // 미저장 상태에서 목록으로 빠지면 확인을 받는다.
  const confirmLeaveIfDirty = (e: React.MouseEvent) => {
    if (!dirty) return;
    const ok = window.confirm("저장하지 않은 변경이 있습니다. 그래도 나가시겠어요?");
    if (!ok) e.preventDefault();
  };

  const onPublish = () => {
    if (!title.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    if (publishedBeforeSource) {
      const pubLabel = toDateInputValue(publishedAt) || todayDate;
      const ok = confirm(
        `발행일(${pubLabel})이 원문 작성일(${sourceDate!.slice(0, 10)})보다 앞섭니다.\n그대로 발행할까요?`,
      );
      if (!ok) return;
    }
    const isUpdate = status === "published";
    setBusyMsg(isUpdate ? "업데이트 중…" : "발행 중…");
    startTransition(async () => {
      try {
        await publishPost(input);
        markClean();
        router.push("/admin/posts");
      } catch (e) {
        alert(`${isUpdate ? "업데이트" : "발행"} 실패: ${(e as Error).message}`);
        setBusyMsg(null);
      }
    });
  };

  const onAiRevise = (feedback: string) => {
    if (!initial.originalSlug) return;
    setBusyMsg("AI 개선 요청 중…");
    startTransition(async () => {
      try {
        await requestRevision({ slug: initial.originalSlug!, feedback });
        setAiReviseOpen(false);
        setSavedFlash("✓ AI 개선 요청됨 — 워커 처리 후 새로고침");
        router.refresh();
      } catch (e) {
        alert(`요청 실패: ${(e as Error).message}`);
      } finally {
        setBusyMsg(null);
      }
    });
  };

  const onAiDraft = (v: { url: string; note: string }) => {
    setBusyMsg("AI 초안 요청 중…");
    startTransition(async () => {
      try {
        const res = await requestDraftFromUrl(v);
        setAiDraftOpen(false);
        setSavedFlash("✓ AI 초안 요청됨");
        router.replace(`/admin/editor?slug=${encodeURIComponent(res.slug)}`);
      } catch (e) {
        alert(`요청 실패: ${(e as Error).message}`);
      } finally {
        setBusyMsg(null);
      }
    });
  };

  return (
    <>
      <AdminTopbar>
        <Link href="/admin/posts" onClick={confirmLeaveIfDirty}>
          <Button variant="ghost" size="sm">← 목록</Button>
        </Link>
        {initial.originalSlug ? (
          <Button variant="ghost" size="sm" onClick={() => setAiReviseOpen(true)} disabled={pending}>
            AI 개선
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setAiDraftOpen(true)} disabled={pending}>
            URL로 초안
          </Button>
        )}
        {(busyMsg || savedFlash) && (
          <span
            className="meta"
            aria-live="polite"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: busyMsg ? "var(--fg-neutral)" : "var(--fg-strong)",
              minWidth: 0,
              whiteSpace: "nowrap",
            }}
          >
            {busyMsg && <span className="ai-spinner" aria-hidden />}
            {busyMsg ?? savedFlash}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={onSave} disabled={pending}>임시 저장</Button>
        <Button variant="primary" size="sm" onClick={onPublish} disabled={pending}>
          {status === "published" ? "업데이트" : "발행"}
        </Button>
      </AdminTopbar>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          height: "calc(100vh - 56px)",
          minHeight: 0,
        }}
      >
        {/* 왼쪽 — 작성 영역. 카테고리·태그·썸네일 → 큰 제목 → 짧은 밑줄 → 본문. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--line-subtle)",
            minWidth: 0,
            position: "relative",
          }}
        >
          <div style={{ padding: "20px 48px 0" }}>
            {/* 카테고리 · 태그 · 썸네일 — 한 줄. 태그가 가운데서 늘어난다. */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <CategoryPicker
                categories={categories}
                value={categorySlug}
                onChange={setCategorySlug}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <TagInput
                  tags={tags}
                  draft={tagDraft}
                  onTagsChange={setTags}
                  onDraftChange={setTagDraft}
                />
              </div>
              <input
                type="date"
                value={toDateInputValue(publishedAt)}
                max={todayDate}
                onChange={(e) =>
                  setPublishedAt(fromDateInputValue(e.target.value, publishedAt))
                }
                aria-label="작성일"
                title="작성일 (백데이트 전용 — 비우면 발행 시 오늘로 설정)"
                style={{
                  padding: "6px 10px",
                  border: publishedBeforeSource
                    ? "1px solid var(--danger, #d33)"
                    : "1px solid var(--line-subtle)",
                  borderRadius: 8,
                  fontSize: 13,
                  background: "transparent",
                  color: publishedAt ? "var(--fg-strong)" : "var(--fg-neutral)",
                  fontFamily: "inherit",
                  outline: "none",
                  colorScheme: "light dark",
                }}
              />
              <input
                type="date"
                value={sourceDate ?? ""}
                max={todayDate}
                onChange={(e) => setSourceDate(e.target.value || null)}
                aria-label="원문 작성일"
                title="원문(인용·번역 대상) 작성·업로드 일자. 발행일을 이보다 앞으로 잡으면 경고."
                style={{
                  padding: "6px 10px",
                  border: "1px dashed var(--line-subtle)",
                  borderRadius: 8,
                  fontSize: 13,
                  background: "transparent",
                  color: sourceDate ? "var(--fg-strong)" : "var(--fg-neutral)",
                  fontFamily: "inherit",
                  outline: "none",
                  colorScheme: "light dark",
                }}
              />
              {publishedBeforeSource && (
                <span
                  role="alert"
                  title={`발행일이 원문 작성일(${sourceDate?.slice(0, 10)})보다 앞섭니다`}
                  style={{
                    fontSize: 12,
                    color: "var(--danger, #d33)",
                    whiteSpace: "nowrap",
                  }}
                >
                  ⚠ 원문보다 앞선 발행일
                </span>
              )}
              <ThumbnailField
                coverImage={coverImage}
                coverBrightness={coverBrightness}
                thumbKind={thumbKind}
                onChange={(next) => {
                  setCoverImage(next.coverImage);
                  setCoverBrightness(next.coverBrightness);
                  setThumbKind(next.thumbKind);
                }}
              />
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 36,
                fontWeight: 800,
                lineHeight: 1.2,
                fontFamily: "inherit",
                background: "transparent",
                color: "var(--fg-strong)",
                padding: 0,
                letterSpacing: "-0.02em",
              }}
            />
            <div
              style={{
                width: 60,
                height: 4,
                background: "var(--fg-strong)",
                marginTop: 18,
                marginBottom: 0,
                borderRadius: 2,
              }}
            />
          </div>
          <div style={{ height: 1, background: "var(--line-subtle)", margin: "20px 0 0" }} />
          <textarea
            ref={textareaRef}
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            onPaste={onPaste}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            placeholder="당신의 이야기를 적어보세요…"
            spellCheck={false}
            style={{
              flex: 1,
              padding: "20px 48px 80px",
              border: "none",
              outline: dragOver ? "2px dashed var(--fg-strong)" : "none",
              outlineOffset: "-12px",
              resize: "none",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--fg-strong)",
              background: "var(--bg-base)",
              overflow: "auto",
            }}
          />
          {uploading && (
            <div
              style={{
                position: "absolute",
                bottom: 16,
                right: 24,
                fontSize: 12,
                color: "var(--fg-strong)",
                background: "var(--bg-subtle)",
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid var(--line-subtle)",
              }}
            >
              이미지 업로드 중…
            </div>
          )}
        </div>

        {/* 오른쪽 — 실제 발행 페이지와 동일한 폭(720px)·렌더러로 라이브 프리뷰.
            padding-top은 왼쪽 편집 칼럼의 메타 행 + 제목 + 밑줄 높이를 상쇄해,
            본문 textarea와 프리뷰 본문의 시작 높이를 맞춘다. */}
        <div
          style={{
            overflow: "auto",
            background: "var(--bg-base)",
            minWidth: 0,
            padding: "80px 40px 96px",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h1 className="prose post-title">{title || "(제목 없음)"}</h1>
            <MarkdownPreview md={bodyMd} fallback="본문 미리보기" />
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
          targetLabel={initial.originalSlug ?? title}
          onClose={() => setAiReviseOpen(false)}
          onSubmit={onAiRevise}
        />
      )}
    </>
  );
}
