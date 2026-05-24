import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { CategoryTree } from "@/components/category/CategoryTree";
import { Chip } from "@/components/ui/Chip";
import { CoverThumb } from "@/components/post/CoverThumb";
import {
  getCategoryBySlug,
  getCategoryGroups,
  getPostsByCategorySlug,
} from "@/lib/queries";

export const revalidate = 60;

export default async function PostsByCategoryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const segments = slug ?? [];
  if (segments.length === 0) notFound();

  const groups = await getCategoryGroups();
  const targetSlug = segments[segments.length - 1];
  const cat = await getCategoryBySlug(targetSlug);
  if (!cat) notFound();

  const posts = await getPostsByCategorySlug(cat.slug);
  const parentLabel = cat.parent_slug
    ? groups.find((g) => g.slug === cat.parent_slug)?.label
    : null;
  const activeChildSlug = cat.parent_slug ? cat.slug : undefined;

  const crumbs: { href: string; label: string }[] = [
    { href: "/posts", label: "Posts" },
  ];
  if (cat.parent_slug) {
    crumbs.push({ href: `/posts/c/${cat.parent_slug}`, label: parentLabel ?? cat.parent_slug });
  }
  crumbs.push({ href: `/posts/c/${segments.join("/")}`, label: cat.label });

  return (
    <>
      <PublicNav active="posts" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 8 }}>
          {crumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 && " / "}
              {i < crumbs.length - 1 ? (
                <Link href={c.href} style={{ color: "inherit" }}>{c.label}</Link>
              ) : (
                c.label
              )}
            </span>
          ))}
        </div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>{cat.label}</h1>

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
            <CategoryTree groups={groups} activeChildSlug={activeChildSlug} />
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
