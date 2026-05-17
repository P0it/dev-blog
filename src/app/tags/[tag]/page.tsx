import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { Thumb } from "@/components/diagram/Thumb";
import { getAllTags, getPostsByTag } from "@/lib/queries";

export const revalidate = 60;

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map(({ tag }) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return { title: `#${decoded}`, description: `"${decoded}" 태그가 달린 글` };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = await getPostsByTag(decoded);

  return (
    <>
      <PublicNav active="" locale="ko" switchPath={`/tags/${tag}`} />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>
          <Link href="/tags" style={{ color: "inherit" }}>태그</Link> / #{decoded}
        </div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>#{decoded}</h1>
        <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 8 }}>
          {posts.length === 0 ? "글이 없습니다." : `${posts.length}편`}
        </p>

        <div style={{ marginTop: 32 }}>
          {posts.map((p) => (
            <div key={p.slug} className="post-card">
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <Chip variant="outline">{p.category}</Chip>
                  <span className="meta">
                    {p.date}
                    {p.readingMin && (<><span className="dot-sep" />{p.readingMin}</>)}
                  </span>
                </div>
                <Link href={`/posts/${p.slug}`} style={{ color: "inherit" }}>
                  <h3>{p.title}</h3>
                </Link>
                {p.excerpt && <p>{p.excerpt}</p>}
                {p.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.tags.map((t) => (
                      <Link key={t} href={`/tags/${encodeURIComponent(t)}`}>
                        <Chip variant={t === decoded ? "blue" : "default"}>{t}</Chip>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href={`/posts/${p.slug}`} aria-label={p.title}>
                <Thumb kind={p.thumbKind} />
              </Link>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
