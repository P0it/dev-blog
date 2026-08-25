import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { CoverThumb } from "@/components/post/CoverThumb";
import { searchPosts, getAllTags } from "@/lib/queries";
import type { Post } from "@/lib/types";

export const dynamic = "force-dynamic";

// 검색 결과는 쿼리마다 URL 이 갈라져 얇은 중복 페이지가 된다. robots.ts 와 함께 색인에서 뺀다.
export const metadata: Metadata = {
  title: "검색",
  robots: { index: false, follow: true },
};

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
      <mark key={pos} className="search-mark">
        {text.slice(pos, pos + q.length)}
      </mark>,
    );
    i = pos + q.length;
    pos = text.toLowerCase().indexOf(q.toLowerCase(), i);
  }
  parts.push(text.slice(i));
  return parts;
}

// 제목·요약에 검색어가 없으면 본문 어디서 걸렸는지 보여준다.
// 어디서 왜 걸렸는지 안 보이면 결과 목록이 그냥 글 목록처럼 읽힌다.
function bodySnippet(bodyMd: string | null | undefined, q: string, radius = 90): string | null {
  if (!bodyMd || !q) return null;
  const plain = bodyMd
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const idx = plain.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return null;
  const start = Math.max(0, idx - radius);
  const end = Math.min(plain.length, idx + q.length + radius);
  return `${start > 0 ? "… " : ""}${plain.slice(start, end).trim()}${end < plain.length ? " …" : ""}`;
}

function has(text: string | null | undefined, q: string): boolean {
  return !!text && text.toLowerCase().includes(q.toLowerCase());
}

function SearchForm({ q }: { q: string }) {
  return (
    <form action="/search" method="get" className="search-form">
      <div className="search-field">
        <SearchIcon size={17} className="search-icon" />
        <input
          name="q"
          defaultValue={q}
          autoFocus
          className="search-input"
          placeholder="제목, 본문, 태그…"
          aria-label="검색어"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        검색
      </button>
    </form>
  );
}

function TagSuggestions({
  tags,
  title,
}: {
  tags: { tag: string; count: number }[];
  title: string;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="search-suggest">
      <div className="t-overline">{title}</div>
      <div className="search-suggest-tags">
        {tags.map(({ tag, count }) => (
          <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
            <Chip variant="outline">
              {tag}
              <span style={{ color: "var(--fg-assistive)", fontWeight: 500 }}>{count}</span>
            </Chip>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ post, q }: { post: Post; q: string }) {
  const inTitle = has(post.title, q);
  const inExcerpt = has(post.excerpt, q);
  // 제목·요약에서 이미 보이면 본문 스니펫은 중복이다.
  const snippet = inTitle || inExcerpt ? null : bodySnippet(post.bodyMd, q);

  return (
    <div className="post-card">
      <div>
        <div className="search-hit-meta">
          {post.category && <Chip variant="outline">{post.category}</Chip>}
          {post.date && <span>{post.date}</span>}
          {post.readingMin && (
            <>
              <span className="dot">·</span>
              <span>{post.readingMin}</span>
            </>
          )}
        </div>
        <Link href={`/posts/${post.slug}`} style={{ color: "inherit" }}>
          <h3>{highlight(post.title, q)}</h3>
        </Link>
        {post.excerpt && <p>{highlight(post.excerpt, q)}</p>}
        {snippet && <p className="search-snippet">{highlight(snippet, q)}</p>}
        {post.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {post.tags.map((t) => (
              <Chip key={t} variant={has(t, q) ? "blue" : "default"}>
                {t}
              </Chip>
            ))}
          </div>
        )}
      </div>
      <Link href={`/posts/${post.slug}`} aria-label={post.title}>
        <CoverThumb post={post} />
      </Link>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const [results, allTags] = await Promise.all([
    query ? searchPosts(query) : Promise.resolve([]),
    getAllTags(),
  ]);
  const popularTags = allTags.slice(0, 14);

  return (
    <>
      <PublicNav active="" locale="ko" switchPath="/search" />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>검색</div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>
          {query ? `"${query}"` : "글 검색"}
        </h1>

        <SearchForm q={query} />

        {!query && (
          <>
            <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 20, maxWidth: 560 }}>
              제목·요약·본문·태그를 한 번에 뒤집니다.
            </p>
            <TagSuggestions tags={popularTags} title="많이 쓰인 태그" />
          </>
        )}

        {query && results.length > 0 && (
          <>
            <div className="search-summary">
              <strong>{results.length}건</strong>
              <span className="meta">의 글을 찾았습니다.</span>
            </div>
            <div>
              {results.map((p) => (
                <ResultCard key={p.slug} post={p} q={query} />
              ))}
            </div>
          </>
        )}

        {query && results.length === 0 && (
          <>
            <div className="search-empty">
              <h2>&quot;{query}&quot; 와 일치하는 글이 없습니다</h2>
              <p>
                검색어를 줄이거나 다른 낱말로 바꿔 보세요. 제목·요약·본문·태그를 모두
                뒤졌습니다.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Link href="/posts" className="btn btn-outline">
                  전체 글 보기
                </Link>
                <Link href="/tags" className="btn btn-ghost">
                  태그로 찾기
                </Link>
              </div>
            </div>
            <TagSuggestions tags={popularTags} title="이런 주제는 어떠세요" />
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
