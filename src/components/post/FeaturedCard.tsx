import Link from "next/link";
import { Thumb } from "@/components/diagram/Thumb";
import { Chip } from "@/components/ui/Chip";
import type { Post } from "@/lib/types";

export function FeaturedCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`} className="featured-card" style={{ color: "inherit" }}>
      <Thumb kind={post.thumbKind} />
      <div className="body">
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {(post.featuredChips ?? []).map((c, i) => (
            <Chip key={i} variant={c.variant}>
              {c.label}
            </Chip>
          ))}
        </div>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="meta">
          {post.date} <span className="dot-sep" /> {post.readingMin}
        </div>
      </div>
    </Link>
  );
}
