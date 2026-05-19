import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { CategoryTree } from "@/components/category/CategoryTree";
import { Chip } from "@/components/ui/Chip";
import { Thumb } from "@/components/diagram/Thumb";
import {
  getCategoryBySlug,
  getCategoryGroups,
  getPostsByCategorySlug,
} from "@/lib/queries";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const segments = slug ?? [];
  const groups = await getCategoryGroups();

  // /categories — 인덱스
  if (segments.length === 0) {
    return (
      <>
        <PublicNav active="categories" />
        <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
          <div className="meta" style={{ marginBottom: 6 }}>카테고리</div>
          <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>전체 카테고리</h1>
          <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 8, maxWidth: 560 }}>
            글이 분류된 영역. 클릭해서 안으로 들어가보세요.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginTop: 36,
            }}
          >
            {groups.map((g) => (
              <Link
                key={g.slug}
                href={`/categories/${g.slug}`}
                className="card"
                style={{ padding: 22, color: "inherit", textDecoration: "none" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h3 style={{ margin: 0, fontSize: 18, color: "var(--fg-strong)" }}>{g.label}</h3>
                  <span className="meta">{g.count}편</span>
                </div>
                {g.children.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                    {g.children.map((c) => (
                      <Chip key={c.slug} variant="outline">
                        {c.label} · {c.count}
                      </Chip>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // /categories/<slug> 또는 /categories/<parent>/<child>
  const targetSlug = segments[segments.length - 1];
  const cat = await getCategoryBySlug(targetSlug);
  if (!cat) notFound();

  // URL 정합성: 자식 카테고리는 /categories/<parent>/<child> 형태여야 함
  // (간단히 처리: 일치하지 않아도 표시는 함)

  const posts = await getPostsByCategorySlug(cat.slug);
  const parentLabel = cat.parent_slug
    ? groups.find((g) => g.slug === cat.parent_slug)?.label
    : null;
  const activeChildSlug = cat.parent_slug ? cat.slug : undefined;

  // breadcrumb
  const crumbs: { href: string; label: string }[] = [
    { href: "/categories", label: "카테고리" },
  ];
  if (cat.parent_slug) {
    crumbs.push({ href: `/categories/${cat.parent_slug}`, label: parentLabel ?? cat.parent_slug });
  }
  crumbs.push({ href: `/categories/${segments.join("/")}`, label: cat.label });

  return (
    <>
      <PublicNav active="categories" />
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
            <div className="t-overline" style={{ marginBottom: 12 }}>전체 카테고리</div>
            <CategoryTree groups={groups} activeChildSlug={activeChildSlug} />
          </aside>

          <div>
            {posts.map((p) => (
              <div key={p.slug} className="post-card">
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <Chip variant="outline">{p.category}</Chip>
                    <span className="meta">
                      {p.date}
                    </span>
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
                  <Thumb kind={p.thumbKind} />
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
