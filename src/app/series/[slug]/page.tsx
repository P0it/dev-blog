import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { CoverThumb } from "@/components/post/CoverThumb";
import { getAllSeries, getSeriesContext, getSeriesPosts } from "@/lib/queries";

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
  return { title: ctx.title, description: ctx.description ?? `${ctx.title} 연재` };
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
      <PublicNav active="" locale="ko" switchPath={`/series/${slug}`} />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>
          <Link href="/series" style={{ color: "inherit" }}>시리즈</Link>
        </div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>{ctx.title}</h1>
        {ctx.description && (
          <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 8, maxWidth: 640 }}>
            {ctx.description}
          </p>
        )}
        <div className="meta" style={{ marginTop: 8 }}>{posts.length}편</div>

        <div style={{ marginTop: 32 }}>
          {posts.map((p, i) => (
            <div key={p.slug} className="post-card">
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <Chip variant="blue">{i + 1}</Chip>
                  <Chip variant="outline">{p.category}</Chip>
                  <span className="meta">
                    {p.date}
                  </span>
                </div>
                <Link href={`/posts/${p.slug}`} style={{ color: "inherit" }}>
                  <h3>{p.title}</h3>
                </Link>
                {p.excerpt && <p>{p.excerpt}</p>}
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
