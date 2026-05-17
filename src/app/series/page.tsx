import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { getAllSeries } from "@/lib/queries";

export const revalidate = 60;

export default async function SeriesIndexPage() {
  const series = await getAllSeries();

  return (
    <>
      <PublicNav active="" locale="ko" switchPath="/series" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>시리즈</div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>연재</h1>
        <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 8, maxWidth: 560 }}>
          여러 글을 순서대로 묶은 연재 모음.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginTop: 36 }}>
          {series.length === 0 && <Chip>아직 시리즈가 없습니다</Chip>}
          {series.map((s) => (
            <Link
              key={s.slug}
              href={`/series/${s.slug}`}
              className="card"
              style={{ padding: 22, color: "inherit", textDecoration: "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h3 style={{ margin: 0, fontSize: 18, color: "var(--fg-strong)" }}>{s.title}</h3>
                <span className="meta">{s.count}편</span>
              </div>
              {s.description && (
                <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--fg-neutral)", lineHeight: 1.6 }}>
                  {s.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
