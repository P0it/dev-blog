import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { CategoryTree } from "@/components/category/CategoryTree";
import { Chip } from "@/components/ui/Chip";
import { CoverThumb } from "@/components/post/CoverThumb";
import { getAllPosts, getCategoryGroups } from "@/lib/queries";

export const revalidate = 60;

export default async function PostsPage() {
  const [posts, groups] = await Promise.all([getAllPosts(), getCategoryGroups()]);

  return (
    <>
      <PublicNav active="posts" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>Posts</div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>전체 글</h1>
        <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 8, maxWidth: 640 }}>
          {posts.length === 0 ? "아직 글이 없습니다." : `${posts.length}편의 글.`}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: 56,
            marginTop: 48,
          }}
        >
          <aside style={{ position: "sticky", top: 96, alignSelf: "start" }}>
            <div className="t-overline" style={{ marginBottom: 12 }}>카테고리</div>
            <CategoryTree groups={groups} />
          </aside>

          <div>
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
      </div>
      <Footer />
    </>
  );
}
