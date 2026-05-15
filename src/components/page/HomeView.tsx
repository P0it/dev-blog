import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { FeaturedCard } from "@/components/post/FeaturedCard";
import { PostCard } from "@/components/post/PostCard";
import type { Locale, Post } from "@/lib/types";
import { pathFor, tFor } from "@/lib/i18n";

export function HomeView({
  locale,
  featured,
  recent,
}: {
  locale: Locale;
  featured: Post[];
  recent: Post[];
}) {
  const t = tFor(locale);
  return (
    <>
      <PublicNav active="home" locale={locale} switchPath="/" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 22, margin: 0, letterSpacing: "-0.01em" }}>{t.curation}</h2>
          <div className="meta">
            {t.editorPick} · {featured.length}
          </div>
        </div>
        <div className="featured">
          {featured.map((p) => (
            <FeaturedCard key={p.slug} post={p} hrefBase={pathFor(locale, "/posts")} />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          <h2 style={{ fontSize: 22, margin: 0, letterSpacing: "-0.01em" }}>{t.recent}</h2>
          <Link href={pathFor(locale, "/posts")} className="meta" style={{ color: "var(--fg-primary)" }}>
            {t.viewAll}
          </Link>
        </div>
        {recent.map((p) => (
          <PostCard key={p.slug} post={p} hrefBase={pathFor(locale, "/posts")} />
        ))}
      </div>
      <Footer />
    </>
  );
}
