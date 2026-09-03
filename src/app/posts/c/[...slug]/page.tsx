import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { CategoryFilter } from "@/components/category/CategoryFilter";
import { Chip } from "@/components/ui/Chip";
import { CoverThumb } from "@/components/post/CoverThumb";
import {
  getCategoryBySlug,
  getCategoryGroups,
  getPostsByCategorySlug,
} from "@/lib/queries";
import { SITE } from "@/lib/site";
import { breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

/**
 * 카테고리 페이지를 미리 만들어 둔다.
 *
 * 이게 없으면 이 경로만 on-demand 렌더라, 필터 칩을 누른 그 순간에야 Supabase 를
 * 왕복하고 그동안 화면이 멈춘다. 정적 경로가 아니라서 Link 프리페치도 못 받는다.
 * 카테고리는 최상위 몇 개 + 하위 몇 개뿐이라 전부 미리 굽는 편이 싸다.
 * (dynamicParams 기본값이 true 라 새로 생긴 카테고리는 그대로 on-demand 로 받는다)
 */
export async function generateStaticParams() {
  const groups = await getCategoryGroups();
  return groups.flatMap((g) => [
    { slug: [g.slug] },
    ...g.children.map((c) => ({ slug: [g.slug, c.slug] })),
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const segments = slug ?? [];
  const cat = segments.length > 0 ? await getCategoryBySlug(segments[segments.length - 1]) : null;
  if (!cat) return {};
  // 같은 카테고리에 하위 경로로도 닿을 수 있으므로 canonical 을 실제 계층 경로 하나로 고정한다.
  const path = cat.parent_slug
    ? `/posts/c/${cat.parent_slug}/${cat.slug}`
    : `/posts/c/${cat.slug}`;
  const description = `"${cat.label}" 카테고리의 글 모음`;
  return {
    title: cat.label,
    description,
    alternates: { canonical: `${SITE.url}${path}` },
    openGraph: { type: "website", url: `${SITE.url}${path}`, title: cat.label, description },
  };
}

export default async function PostsByCategoryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const segments = slug ?? [];
  if (segments.length === 0) notFound();

  // 카테고리 목록과 대상 카테고리는 서로 안 기다려도 되니 같이 던진다.
  const targetSlug = segments[segments.length - 1];
  const [groups, cat] = await Promise.all([
    getCategoryGroups(),
    getCategoryBySlug(targetSlug),
  ]);
  if (!cat) notFound();

  const posts = await getPostsByCategorySlug(cat.slug);
  const parentLabel = cat.parent_slug
    ? groups.find((g) => g.slug === cat.parent_slug)?.label
    : null;

  const crumbs: { href: string; label: string }[] = [
    { href: "/posts", label: "Posts" },
  ];
  if (cat.parent_slug) {
    crumbs.push({ href: `/posts/c/${cat.parent_slug}`, label: parentLabel ?? cat.parent_slug });
  }
  crumbs.push({ href: `/posts/c/${segments.join("/")}`, label: cat.label });

  const canonicalPath = cat.parent_slug
    ? `/posts/c/${cat.parent_slug}/${cat.slug}`
    : `/posts/c/${cat.slug}`;

  return (
    <>
      <JsonLd
        data={[
          collectionJsonLd({
            path: canonicalPath,
            name: cat.label,
            description: `"${cat.label}" 카테고리의 글 모음`,
            posts,
          }),
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href }))),
        ]}
      />
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

        <div style={{ marginTop: 28 }}>
          <CategoryFilter groups={groups} activeSlug={cat.slug} />
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
