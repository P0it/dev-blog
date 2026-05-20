import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { PostBody } from "@/components/post/PostBody";
import { TocNav } from "@/components/post/TocNav";
import { Thumb } from "@/components/diagram/Thumb";
import { Comments } from "@/components/Comments";
import { ViewBeacon } from "@/components/ViewBeacon";
import { extractToc } from "@/lib/markdown";
import type { Locale, Post, SeriesContext } from "@/lib/types";
import { tFor } from "@/lib/i18n";
import { SITE } from "@/lib/site";

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
      <div className="container-wide" style={{ paddingTop: 56 }}>
        <div className="post-layout">
          <div className="post-main">
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <Chip variant="blue">{post.category}</Chip>
            </div>
            <h1 className="prose post-title">{post.title}</h1>
            {/* excerpt는 카드/검색/SEO/OG 전용 — 본문 맨 위 인용구가 페이지상 요약을 담당하므로
                상세 페이지에는 노출하지 않는다(요약 중복 방지). */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingBottom: 24,
                borderBottom: "1px solid var(--line-subtle)",
              }}
            >
              {SITE.avatarUrl ? (
                <img
                  src={SITE.avatarUrl}
                  alt={SITE.author}
                  width={36}
                  height={36}
                  style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover", background: "var(--bg-emphasized)" }}
                />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--bg-emphasized)" }} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{SITE.author}</div>
                <div className="meta">
                  {post.date}
                  {views != null && views > 0 && (
                    <> · {locale === "ko" ? "조회" : "views"} {views.toLocaleString()}</>
                  )}
                </div>
              </div>
            </div>

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
                      <Thumb kind={r.thumbKind} />
                      <div className="body">
                        <Chip variant="outline">{r.category}</Chip>
                        <h3>{r.title}</h3>
                        <div className="meta">{r.date}</div>
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
      <Footer />
    </>
  );
}
