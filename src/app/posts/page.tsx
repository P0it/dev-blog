import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { getAllPosts, getCategoryGroups } from "@/lib/queries";

export const revalidate = 60;

type ArchiveItem = { date: string; slug: string; title: string; category: string };

export default async function ArchivePage() {
  const [posts, groups] = await Promise.all([getAllPosts(), getCategoryGroups()]);

  // year → items
  const byYear = new Map<string, ArchiveItem[]>();
  for (const p of posts) {
    const list = byYear.get(p.year) ?? [];
    list.push({
      date: p.date.slice(5),
      slug: p.slug,
      title: p.title,
      category: p.category,
    });
    byYear.set(p.year, list);
  }
  const yearGroups = [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, items]) => ({ year, items }));

  // 상위 카테고리 칩 — 자식 포함 count로 상위 3개
  const topCats = [...groups]
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <>
      <PublicNav active="home" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>
          아카이브 · {posts.length}편
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
          {yearGroups.map((g) => (
            <Chip key={g.year}>{g.year}</Chip>
          ))}
          <span style={{ flex: 1 }} />
          {topCats.map((c) => (
            <Chip key={c.slug} variant="outline">
              {c.label} · {c.count}
            </Chip>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          {yearGroups.map((g) => (
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
