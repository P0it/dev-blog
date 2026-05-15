import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import {
  featuredPosts,
  recentPosts,
  archive2026Extra,
  archive2025,
} from "@/data/posts";

type ArchiveItem = { date: string; slug: string; title: string; category: string };

function buildArchive(): { year: string; items: ArchiveItem[] }[] {
  const items2026: ArchiveItem[] = [
    ...recentPosts.map((p) => ({
      date: p.date.slice(5),
      slug: p.slug,
      title: p.title,
      category: p.category,
    })),
    ...featuredPosts.map((p) => ({
      date: p.date.slice(5),
      slug: p.slug,
      title: p.title,
      category: p.category,
    })),
    ...archive2026Extra.map((p) => ({
      date: p.date.slice(5),
      slug: p.slug,
      title: p.title,
      category: p.category,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const items2025: ArchiveItem[] = archive2025.map((p) => ({
    date: p.date.slice(5),
    slug: p.slug,
    title: p.title,
    category: p.category,
  }));

  return [
    { year: "2026", items: items2026 },
    { year: "2025", items: items2025 },
  ];
}

export default function ArchivePage() {
  const groups = buildArchive();
  const total = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <>
      <PublicNav active="home" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>
          아카이브 · {total}편
        </div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>모든 글</h1>
        <p
          style={{
            color: "var(--fg-neutral)",
            fontSize: 15,
            marginTop: 8,
            maxWidth: 560,
          }}
        >
          시간순으로 정렬한 전체 글. 연도와 카테고리로 필터하세요.
        </p>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 28,
            paddingBottom: 20,
            borderBottom: "1px solid var(--line-subtle)",
            flexWrap: "wrap",
          }}
        >
          <Chip variant="blue">전체</Chip>
          <Chip>2026</Chip>
          <Chip>2025</Chip>
          <span style={{ flex: 1 }} />
          <Chip variant="outline">에이전트 · 14</Chip>
          <Chip variant="outline">개발자 도구 · 11</Chip>
          <Chip variant="outline">실험 · 7</Chip>
        </div>

        <div style={{ marginTop: 32 }}>
          {groups.map((g) => (
            <div key={g.year} style={{ marginBottom: 48 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "var(--fg-alternative)",
                  letterSpacing: "-0.02em",
                  marginBottom: 16,
                }}
              >
                {g.year}
              </div>
              {g.items.map((p) => (
                <div
                  key={p.slug}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 120px",
                    gap: 24,
                    padding: "16px 0",
                    borderBottom: "1px solid var(--line-subtle)",
                    alignItems: "baseline",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: "var(--fg-alternative)",
                    }}
                  >
                    {p.date}
                  </div>
                  <a
                    href={`/posts/${p.slug}`}
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "var(--fg-strong)",
                      letterSpacing: "-0.005em",
                      textDecoration: "none",
                    }}
                  >
                    {p.title}
                  </a>
                  <div style={{ textAlign: "right" }}>
                    <Chip variant="outline">{p.category}</Chip>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
