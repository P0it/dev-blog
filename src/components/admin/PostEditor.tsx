"use client";

import { useMemo, useState, useTransition } from "react";
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
};

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
}: {
  initial: Initial;
  categories: Category[];
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
    }),
    [initial.originalSlug, slug, title, excerpt, bodyMd, categorySlug, tagsText, thumbKind, isFeatured, readingMin],
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

          <Field label="옵션">
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              에디터 추천 (홈 큐레이션)
            </label>
          </Field>
        </div>

        {/* 마크다운 입력 */}
        <textarea
          value={bodyMd}
          onChange={(e) => setBodyMd(e.target.value)}
          placeholder={"# 제목\n\n> 한 줄 요약\n\n## 섹션\n\n본문…"}
          spellCheck={false}
          style={{
            padding: "24px 28px",
            border: "none",
            borderRight: "1px solid var(--line-subtle)",
            outline: "none",
            resize: "none",
            fontFamily: "var(--font-mono)",
            fontSize: 13.5,
            lineHeight: 1.7,
            color: "var(--fg-strong)",
            background: "var(--bg-base)",
            overflow: "auto",
          }}
        />

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
