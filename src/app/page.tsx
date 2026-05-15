import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { FeaturedCard } from "@/components/post/FeaturedCard";
import { PostCard } from "@/components/post/PostCard";
import { featuredPosts, recentPosts } from "@/data/posts";

export default function HomePage() {
  return (
    <>
      <PublicNav active="home" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 22, margin: 0, letterSpacing: "-0.01em" }}>큐레이션</h2>
          <div className="meta">에디터 추천 · {featuredPosts.length}</div>
        </div>
        <div className="featured">
          {featuredPosts.map((p) => (
            <FeaturedCard key={p.slug} post={p} />
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
          <h2 style={{ fontSize: 22, margin: 0, letterSpacing: "-0.01em" }}>최근 글</h2>
          <Link href="/posts" className="meta" style={{ color: "var(--fg-primary)" }}>
            모두 보기 →
          </Link>
        </div>
        {recentPosts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
      <Footer />
    </>
  );
}
