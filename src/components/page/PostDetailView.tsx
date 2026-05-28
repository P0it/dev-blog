import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { User } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { PostBody } from "@/components/post/PostBody";
import { TocNav } from "@/components/post/TocNav";
import { CoverThumb } from "@/components/post/CoverThumb";
import { Comments } from "@/components/Comments";
import { ViewBeacon } from "@/components/ViewBeacon";
import { extractToc } from "@/lib/markdown";
import type { Locale, Post, SeriesContext } from "@/lib/types";
import { tFor } from "@/lib/i18n";
import { SITE } from "@/lib/site";

function hasAvatarFile(url: string): boolean {
  if (!url) return false;
  if (!url.startsWith("/")) return true; // 외부 URL은 그대로 신뢰
  return existsSync(path.join(process.cwd(), "public", url.replace(/^\//, "")));
}

export function PostDetailView({
  post,
  locale,
  related = [],
  views = null,
  series = null,
}: {
  post: Post;
  locale: Locale;
  related?: Post[];
  views?: number | null;
  series?: SeriesContext | null;
}) {
  const toc = extractToc(post.bodyMd);
  const t = tFor(locale);
  const postsBase = locale === "en" ? "/en/posts" : "/posts";
  return (
    <>
      <ViewBeacon path={`${postsBase}/${post.slug}`} slug={post.slug} />
      <PublicNav active="home" locale={locale} switchPath={`/posts/${post.slug}`} />
      <div
        className={[
          "post-hero-wrap",
          "post-hero-wrap--with-cover",
          // 커버 없음(패턴 썸네일은 밝은 파스텔)·밝은 사진 → 어두운 글씨,
          // 어두운 사진만 흰 글씨.
          !post.coverImage || (post.coverBrightness ?? 0) > 0.55
            ? "post-hero-wrap--light-cover"
            : "",
        ].filter(Boolean).join(" ")}
      >
        <div className="post-hero-bg" aria-hidden>
          {/* 커버 이미지가 있으면 그 이미지를, 없으면 thumbKind 패턴으로 폴백. */}
          <CoverThumb post={post} fill />
        </div>
        <div className="container-wide" style={{ paddingTop: 56, position: "relative" }}>
        {/* 헤더(카테고리·제목·작성자)는 hero 위에 얹히고, 본문/목차는 그 아래부터 시작. */}
        <div className="post-header">
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Chip variant="blue">{post.category}</Chip>
          </div>
          <h1 className="prose post-title">{post.title}</h1>
          <div className="post-author">
            {hasAvatarFile(SITE.avatarUrl) ? (
              <img
                src={SITE.avatarUrl}
                alt={SITE.author}
                width={36}
                height={36}
                style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover", background: "var(--bg-emphasized)" }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "var(--bg-emphasized)",
                  color: "var(--fg-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label={SITE.author}
              >
                <User size={20} strokeWidth={1.75} />
              </div>
            )}
            <div>
              <div className="post-author-name">{SITE.author}</div>
              <div className="meta">
                {/* 발행일은 임시로 숨김 — 작성일 정리 후 다시 노출. */}
              </div>
            </div>
          </div>
        </div>
        <div className="post-layout">
          <div className="post-main">
            {/* 페이지상 요약 훅은 본문 첫 `>` 인용구가 담당한다(에디터에서 자동으로
                excerpt 컬럼에 추출되어 카드·검색·OG·RSS도 같은 문장을 쓴다). */}

            {series && series.items.length > 0 && (
              <div
                style={{
                  margin: "8px 0 32px",
                  padding: "18px 20px",
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--line-subtle)",
                  borderRadius: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <Link
                    href={`/series/${series.slug}`}
                    style={{ fontWeight: 700, fontSize: 15, color: "var(--fg-strong)", textDecoration: "none" }}
                  >
                    {t.series}: {series.title}
                  </Link>
                  <span className="meta">
                    {series.items.findIndex((it) => it.slug === post.slug) + 1} / {series.items.length}
                  </span>
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                  {series.items.map((it) => {
                    const current = it.slug === post.slug;
                    return (
                      <li key={it.slug} style={{ fontSize: 14, lineHeight: 1.5 }}>
                        {current ? (
                          <span style={{ fontWeight: 700, color: "var(--fg-strong)" }}>{it.title}</span>
                        ) : (
                          <Link href={`${postsBase}/${it.slug}`} style={{ color: "var(--fg-neutral)" }}>
                            {it.title}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            <PostBody md={post.bodyMd} fallback={t.bodyPending} />

            {post.tags.length > 0 && locale === "ko" && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 40 }}>
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>
                    <Chip>{tag}</Chip>
                  </Link>
                ))}
              </div>
            )}

            {related.length > 0 && (
              <div
                style={{
                  marginTop: 64,
                  paddingTop: 32,
                  borderTop: "1px solid var(--line-subtle)",
                }}
              >
                <div className="t-overline" style={{ marginBottom: 16 }}>{t.related}</div>
                <div className="related-grid">
                  {related.map((r) => (
                    <Link key={r.slug} href={`${postsBase}/${r.slug}`} className="related-card">
                      <CoverThumb post={r} />
                      <div className="body">
                        <Chip variant="outline">{r.category}</Chip>
                        <h3>{r.title}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Comments term={post.slug} />
          </div>

          <aside className="post-toc">
            {toc.length > 0 && (
              <>
                <div className="t-overline" style={{ marginBottom: 12 }}>{t.toc}</div>
                <TocNav items={toc} />
              </>
            )}
          </aside>
        </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
