import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { PostCard } from "@/components/post/PostCard";
import { MorePosts } from "@/components/post/MorePosts";
import type { Locale, Post } from "@/lib/types";
import { pathFor, tFor } from "@/lib/i18n";

export function HomeView({
  locale,
  // featured 는 큐레이션 임시 숨김 동안 미사용 — props 시그니처는 호출부 호환 위해 유지.
  featured: _featured,
  recent,
  hasMore = false,
}: {
  locale: Locale;
  featured: Post[];
  recent: Post[];
  hasMore?: boolean;
}) {
  const t = tFor(locale);
  return (
    <>
      <PublicNav active="home" locale={locale} switchPath="/" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        {/* 큐레이션(Editor's Picks) 섹션 — 임시 숨김. featured 데이터·is_featured 플래그는 그대로 살림. */}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
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
        {/* 첫 6개에서 목록이 끊기면 글이 그게 전부인 줄로 읽힌다. 스크롤로 이어 받는다. */}
        <MorePosts
          offset={recent.length}
          hasMore={hasMore}
          hrefBase={pathFor(locale, "/posts")}
        />
      </div>
      <Footer />
    </>
  );
}
