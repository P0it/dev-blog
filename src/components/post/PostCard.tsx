import Link from "next/link";
import { CoverThumb } from "@/components/post/CoverThumb";
import { Chip } from "@/components/ui/Chip";
import type { Post } from "@/lib/types";

export function PostCard({ post, hrefBase = "/posts" }: { post: Post; hrefBase?: string }) {
  return (
    <Link href={`${hrefBase}/${post.slug}`} className="post-card" style={{ color: "inherit" }}>
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          {post.category && <Chip variant="outline">{post.category}</Chip>}
          <span className="meta">{post.date}</span>
        </div>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div style={{ display: "flex", gap: 6 }}>
          {post.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      </div>
      <CoverThumb post={post} />
    </Link>
  );
}
