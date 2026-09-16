import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { CoverThumb } from "@/components/post/CoverThumb";
import { getAllSeries, getSeriesContext, getSeriesPosts } from "@/lib/queries";
import { SITE } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

export async function generateStaticParams() {
  const series = await getAllSeries();
  return series.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await getSeriesContext(slug);
  if (!ctx) return {};
  const url = `${SITE.url}/series/${ctx.slug}`;
  const description = ctx.description ?? `${ctx.title} 시리즈`;
  return {
    title: ctx.title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: ctx.title, description },
  };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getSeriesContext(slug);
  if (!ctx) notFound();
  const posts = await getSeriesPosts(slug);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: SITE.name, path: "/" },
          { name: "시리즈", path: "/series" },
          { name: ctx.title, path: `/series/${ctx.slug}` },
        ])}
      />
      <PublicNav active="series" locale="ko" switchPath={`/series/${slug}`} />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>
          <Link href="/series" style={{ color: "inherit" }}>Series</Link>
        </div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>{ctx.title}</h1>
        {ctx.description && (
          <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 8, maxWidth: 640 }}>
            {ctx.description}
          </p>
        )}
        <div className="meta" style={{ marginTop: 8 }}>{posts.length}편</div>

        <ol className="series-ep-list">
          {posts.map((p, i) => (
            <li key={p.slug} className="series-ep">
              <Link href={`/posts/${p.slug}`} className="series-ep-link">
                <span className="series-ep-idx">{String(i + 1).padStart(2, "0")}</span>
                <div className="series-ep-body">
                  <h3 className="series-ep-title">{p.title}</h3>
                  {p.excerpt && <p className="series-ep-excerpt">{p.excerpt}</p>}
                  <div className="series-ep-meta">
                    {p.date && <span>{p.date}</span>}
                    {p.readingMin && <span>{p.readingMin}</span>}
                  </div>
                </div>
                <div className="series-ep-thumb">
                  <CoverThumb post={p} fill />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <Footer />
    </>
  );
}
