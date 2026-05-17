import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { searchPosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  const parts: React.ReactNode[] = [];
  let i = 0;
  let pos = idx;
  while (pos >= 0) {
    parts.push(text.slice(i, pos));
    parts.push(
      <mark
        key={pos}
        style={{ background: "var(--bg-emphasized)", color: "var(--fg-strong)", borderRadius: 3, padding: "0 2px" }}
      >
        {text.slice(pos, pos + q.length)}
      </mark>,
    );
    i = pos + q.length;
    pos = text.toLowerCase().indexOf(q.toLowerCase(), i);
  }
  parts.push(text.slice(i));
  return parts;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q ? await searchPosts(q) : [];

  return (
    <>
      <PublicNav active="" locale="ko" switchPath="/search" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>검색</div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>
          {q ? `"${q}"` : "글 검색"}
        </h1>

        <form
          action="/search"
          method="get"
          style={{ marginTop: 24, display: "flex", gap: 8, maxWidth: 560 }}
        >
          <input
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="제목, 본문, 태그…"
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "var(--bg-base)",
              border: "1px solid var(--line-normal)",
              borderRadius: 10,
              fontSize: 15,
              color: "var(--fg-strong)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "12px 18px",
              background: "var(--fg-strong)",
              color: "var(--bg-base)",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            검색
          </button>
        </form>

        <div className="meta" style={{ marginTop: 16 }}>
          {q ? `${results.length}건` : "키워드를 입력하세요."}
        </div>

        <div style={{ marginTop: 24 }}>
          {results.map((p) => (
            <div key={p.slug} className="post-card">
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <Chip variant="outline">{p.category}</Chip>
                  <span className="meta">
                    {p.date}
                    {p.readingMin && (<><span className="dot-sep" />{p.readingMin}</>)}
                  </span>
                </div>
                <Link href={`/posts/${p.slug}`} style={{ color: "inherit" }}>
                  <h3>{highlight(p.title, q)}</h3>
                </Link>
                {p.excerpt && <p>{highlight(p.excerpt, q)}</p>}
                {p.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.tags.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
