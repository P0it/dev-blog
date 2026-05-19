import Link from "next/link";
import { Thumb } from "@/components/diagram/Thumb";
import { Chip } from "@/components/ui/Chip";
import type { Post } from "@/lib/types";

export function PostCard({ post, hrefBase = "/posts" }: { post: Post; hrefBase?: string }) {
  return (
    <div className="post-card">
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <Chip variant="outline">{post.category}</Chip>
          <span className="meta">
            {post.date}
          </span>
        </div>
        <Link href={`${hrefBase}/${post.slug}`} style={{ color: "inherit" }}>
          <h3>{post.title}</h3>
        </Link>
        <p>{post.excerpt}</p>
        <div style={{ display: "flex", gap: 6 }}>
          {post.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      </div>
      <Link href={`${hrefBase}/${post.slug}`} aria-label={post.title} style={{ display: "block" }}>
        <Thumb kind={post.thumbKind} />
      </Link>
    </div>
  );
}
