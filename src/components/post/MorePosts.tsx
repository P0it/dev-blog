"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PostCard } from "@/components/post/PostCard";
import type { Post } from "@/lib/types";

const PAGE = 6;

// 홈 '최근 글' 뒤를 이어 받는다.
// 첫 화면은 서버가 그리고, 그 아래부터 스크롤이 센티넬에 닿을 때 한 장(6개)씩 붙인다.
// 자동 로딩이 안 먹는 환경(관찰자 미지원·스크롤 없이 도달)을 위해 버튼도 같이 둔다.
export function MorePosts({
  offset,
  hasMore: initialHasMore,
  hrefBase = "/posts",
}: {
  offset: number;
  hasMore: boolean;
  hrefBase?: string;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  // 중복 요청 방지 — 관찰자와 버튼이 동시에 부를 수 있다.
  const inFlight = useRef(false);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !hasMore) return;
    inFlight.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/posts/recent?offset=${offset + posts.length}&limit=${PAGE}`);
      if (!res.ok) throw new Error(String(res.status));
      const data: { posts: Post[]; hasMore: boolean } = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [hasMore, offset, posts.length]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || failed || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      // 바닥에 닿기 전에 미리 받아 와서 목록이 끊겨 보이지 않게.
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, hasMore, failed]);

  return (
    <>
      {posts.map((p) => (
        <PostCard key={p.slug} post={p} hrefBase={hrefBase} />
      ))}

      <div ref={sentinel} />

      {hasMore && (
        <div className="feed-more">
          {loading ? (
            <>
              <span className="feed-spinner" aria-hidden />
              <span className="meta">더 불러오는 중…</span>
            </>
          ) : (
            <button type="button" className="btn btn-outline" onClick={loadMore}>
              {failed ? "다시 시도" : "더 보기"}
            </button>
          )}
        </div>
      )}

      {!hasMore && (
        <div className="feed-end">
          <span className="feed-end-line" aria-hidden />
          <p>여기까지가 최근 글 전부입니다.</p>
          <div className="feed-end-links">
            <Link href="/posts" className="btn btn-outline btn-sm">
              카테고리로 보기
            </Link>
            <Link href="/tags" className="btn btn-ghost btn-sm">
              태그로 찾기
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
