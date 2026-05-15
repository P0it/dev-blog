import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import type { CategoryGroup, Locale, Post } from "@/lib/types";
import { pathFor, tFor } from "@/lib/i18n";

type ArchiveItem = { date: string; slug: string; title: string; category: string };

export function ArchiveView({
  locale,
  posts,
  groups,
}: {
  locale: Locale;
  posts: Post[];
  groups: CategoryGroup[];
}) {
  const t = tFor(locale);

  const byYear = new Map<string, ArchiveItem[]>();
  for (const p of posts) {
    const list = byYear.get(p.year) ?? [];
    list.push({ date: p.date.slice(5), slug: p.slug, title: p.title, category: p.category });
    byYear.set(p.year, list);
  }
  const yearGroups = [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, items]) => ({ year, items }));

  const topCats = [...groups]
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const postsBase = pathFor(locale, "/posts");

  return (
    <>
      <PublicNav active="home" locale={locale} switchPath="/posts" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>
          {t.archive} · {posts.length}{t.posts}
        </div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>{t.allPosts}</h1>
        <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 8, maxWidth: 560 }}>
          {t.archiveLead}
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
          <Chip variant="blue">{locale === "ko" ? "전체" : "All"}</Chip>
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
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-alternative)" }}>
                    {p.date}
                  </div>
                  <Link
                    href={`${postsBase}/${p.slug}`}
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "var(--fg-strong)",
                      letterSpacing: "-0.005em",
                      textDecoration: "none",
                    }}
                  >
                    {p.title}
                  </Link>
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
