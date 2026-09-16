import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { CoverThumb } from "@/components/post/CoverThumb";
import { getAllSeries } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const revalidate = 60;

const DESC = "여러 글을 순서대로 묶은 시리즈 모음.";

export const metadata: Metadata = {
  title: "시리즈",
  description: DESC,
  alternates: { canonical: `${SITE.url}/series` },
  openGraph: {
    type: "website",
    url: `${SITE.url}/series`,
    title: "시리즈",
    description: DESC,
  },
};

function fmtRange(first: string | null, last: string | null): string | null {
  if (!first) return null;
  const f = first.slice(0, 7).replace("-", ".");
  const l = (last ?? first).slice(0, 7).replace("-", ".");
  return f === l ? f : `${f} – ${l}`;
}

export default async function SeriesIndexPage() {
  const series = await getAllSeries();

  return (
    <>
      <PublicNav active="series" locale="ko" switchPath="/series" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>Series</div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>시리즈</h1>
        <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 8, maxWidth: 560 }}>{DESC}</p>

        <div className="series-grid">
          {series.length === 0 && <Chip>아직 시리즈가 없습니다</Chip>}
          {series.map((s) => {
            const range = fmtRange(s.firstAt, s.lastAt);
            return (
              <Link key={s.slug} href={`/series/${s.slug}`} className="series-card">
                {/* 앞 3편 표지를 부채꼴로 겹쳐 '묶음'임을 한눈에 보이게 한다 */}
                <div className="series-card-covers" aria-hidden>
                  {s.preview.length === 0 && <div className="series-card-cover series-card-cover-empty" />}
                  {s.preview.map((p) => (
                    <div key={p.slug} className="series-card-cover">
                      <CoverThumb post={p} fill />
                    </div>
                  ))}
                </div>
                <div className="series-card-body">
                  <div className="series-card-meta">
                    <span className="series-card-count">{s.count}편</span>
                    {range && <span className="series-card-range">{range}</span>}
                  </div>
                  <h3 className="series-card-title">{s.title}</h3>
                  {s.description && <p className="series-card-desc">{s.description}</p>}
                  {s.preview[0] && (
                    <div className="series-card-first">
                      <span className="series-card-first-label">1편</span>
                      <span className="series-card-first-title">{s.preview[0].title}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}
