import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { getAllPostSlugs, getPostBySlug } from "@/lib/queries";
import { PostBody } from "@/components/post/PostBody";
import { extractToc } from "@/lib/markdown";
import { SITE } from "@/lib/site";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const url = `${SITE.url}/posts/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt || undefined,
      publishedTime: post.date.replace(/\./g, "-"),
      authors: [SITE.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || undefined,
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const toc = extractToc(post.bodyMd);

  return (
    <>
      <PublicNav active="home" />
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
              <Chip variant="outline">시리즈 · 에이전트 인프라</Chip>
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
            <p
              style={{
                fontSize: 17,
                color: "var(--fg-neutral)",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              {post.excerpt}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingBottom: 24,
                borderBottom: "1px solid var(--line-subtle)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  background: "var(--bg-emphasized)",
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>정현우</div>
                <div className="meta">
                  {post.date} · {post.readingMin} · 조회 1,284
                </div>
              </div>
            </div>

            <PostBody md={post.bodyMd} />
          </div>

          <aside style={{ position: "sticky", top: 96, alignSelf: "start" }}>
            {toc.length > 0 && (
              <>
                <div className="t-overline" style={{ marginBottom: 12 }}>
                  목차
                </div>
                <nav className="toc">
                  {toc.map((t) => (
                    <a
                      key={t.id}
                      href={`#${t.id}`}
                      className={t.sub ? "sub" : ""}
                    >
                      {t.label}
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
