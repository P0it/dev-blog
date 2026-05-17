import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { getAllTags } from "@/lib/queries";

export const revalidate = 60;

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <>
      <PublicNav active="" locale="ko" switchPath="/tags" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>태그</div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>전체 태그</h1>
        <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 8, maxWidth: 560 }}>
          {tags.length}개의 태그. 큰 글씨일수록 글이 많습니다.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 36, alignItems: "baseline" }}>
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              style={{
                color: "var(--fg-strong)",
                textDecoration: "none",
                fontSize: 14 + Math.min(count, 8) * 2,
                fontWeight: count > 2 ? 700 : 500,
                lineHeight: 1.4,
              }}
            >
              {tag}
              <span style={{ fontSize: 12, color: "var(--fg-alternative)", marginLeft: 4 }}>
                {count}
              </span>
            </Link>
          ))}
          {tags.length === 0 && <Chip>아직 태그가 없습니다</Chip>}
        </div>
      </div>
      <Footer />
    </>
  );
}
