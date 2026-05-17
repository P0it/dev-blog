import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { PostBody } from "@/components/post/PostBody";
import { extractToc } from "@/lib/markdown";
import type { Locale, Post } from "@/lib/types";
import { tFor } from "@/lib/i18n";

export function PostDetailView({
  post,
  locale,
  related = [],
}: {
  post: Post;
  locale: Locale;
  related?: Post[];
}) {
  const toc = extractToc(post.bodyMd);
  const t = tFor(locale);
  const postsBase = locale === "en" ? "/en/posts" : "/posts";
  return (
    <>
      <PublicNav active="home" locale={locale} switchPath={`/posts/${post.slug}`} />
      <div className="container-wide" style={{ paddingTop: 56 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 220px",
            gap: 64,
            alignItems: "start",
          }}
        >
          <div style={{ maxWidth: 720, justifySelf: "end", width: "100%" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <Chip variant="blue">{post.category}</Chip>
            </div>
            <h1
              className="prose"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 44,
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                margin: "0 0 16px",
              }}
            >
              {post.title}
            </h1>
            {post.excerpt && (
              <p style={{ fontSize: 17, color: "var(--fg-neutral)", lineHeight: 1.6, margin: "0 0 24px" }}>
                {post.excerpt}
              </p>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingBottom: 24,
                borderBottom: "1px solid var(--line-subtle)",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 999, background: "var(--bg-emphasized)" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>정현우</div>
                <div className="meta">
                  {post.date}
                  {post.readingMin && (<> · {post.readingMin}</>)}
                </div>
              </div>
            </div>

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
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      href={`${postsBase}/${r.slug}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 16,
                        padding: "14px 0",
                        borderBottom: "1px solid var(--line-subtle)",
                        color: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 500, color: "var(--fg-strong)" }}>
                        {r.title}
                      </span>
                      <span className="meta" style={{ whiteSpace: "nowrap" }}>{r.date}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside style={{ position: "sticky", top: 96, alignSelf: "start" }}>
            {toc.length > 0 && (
              <>
                <div className="t-overline" style={{ marginBottom: 12 }}>{t.toc}</div>
                <nav className="toc">
                  {toc.map((tt) => (
                    <a key={tt.id} href={`#${tt.id}`} className={tt.sub ? "sub" : ""}>
                      {tt.label}
                    </a>
                  ))}
                </nav>
              </>
            )}
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}
