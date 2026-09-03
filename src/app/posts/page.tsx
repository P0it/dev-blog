import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { CategoryFilter } from "@/components/category/CategoryFilter";
import { Chip } from "@/components/ui/Chip";
import { CoverThumb } from "@/components/post/CoverThumb";
import { getAllPosts, getCategoryGroups } from "@/lib/queries";
import { SITE } from "@/lib/site";
import { collectionJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "전체 글",
  description: `${SITE.name}에 올라온 모든 글. 카테고리별로 몰아보기.`,
  alternates: { canonical: `${SITE.url}/posts` },
  openGraph: { type: "website", url: `${SITE.url}/posts`, title: "전체 글" },
};

export default async function PostsPage() {
  const [posts, groups] = await Promise.all([getAllPosts(), getCategoryGroups()]);

  return (
    <>
      <JsonLd
        data={collectionJsonLd({
          path: "/posts",
          name: "전체 글",
          description: `${SITE.name}에 올라온 모든 글`,
          posts,
        })}
      />
      <PublicNav active="posts" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>Posts</div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>전체 글</h1>

        <div style={{ marginTop: 28 }}>
          <CategoryFilter groups={groups} />
        </div>

        <div style={{ marginTop: 32 }}>
          {posts.map((p) => (
            <div key={p.slug} className="post-card">
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <Chip variant="outline">{p.category}</Chip>
                </div>
                <Link href={`/posts/${p.slug}`} style={{ color: "inherit" }}>
                  <h3>{p.title}</h3>
                </Link>
                {p.excerpt && <p>{p.excerpt}</p>}
                {p.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.tags.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                )}
              </div>
              <Link href={`/posts/${p.slug}`} aria-label={p.title}>
                <CoverThumb post={p} />
              </Link>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
