import Link from "next/link";
import type { CategoryGroup } from "@/lib/types";

/**
 * 목록 위에 가로로 놓는 카테고리 필터.
 *
 * 카테고리가 최상위 몇 개 + 하위 몇 개라 트리로 그릴 이유가 없다. 첫 줄에 최상위,
 * 최상위를 고른 동안만 둘째 줄에 그 하위를 편다. 글이 0건인 카테고리는 빈 목록으로
 * 보내므로 숨기되, 지금 보고 있는 카테고리면 활성 표시가 사라지지 않게 남긴다.
 */
export function CategoryFilter({
  groups,
  activeSlug,
}: {
  groups: CategoryGroup[];
  activeSlug?: string;
}) {
  const activeParent = activeSlug
    ? groups.find((g) => g.slug === activeSlug || g.children.some((c) => c.slug === activeSlug))
    : undefined;

  const visibleGroups = groups.filter((g) => g.count > 0 || g === activeParent);
  const children =
    activeParent?.children.filter((c) => c.count > 0 || c.slug === activeSlug) ?? [];

  return (
    <nav className="cat-filter" aria-label="카테고리">
      <div className="cat-filter-row">
        <Link href="/posts" className={`cat-chip ${activeSlug ? "" : "active"}`}>
          전체
        </Link>
        {visibleGroups.map((g) => (
          <Link
            key={g.slug}
            href={`/posts/c/${g.slug}`}
            className={`cat-chip ${g === activeParent ? "active" : ""}`}
          >
            {g.label}
            <span className="cat-chip-count">{g.count}</span>
          </Link>
        ))}
      </div>

      {activeParent && children.length > 0 && (
        <div className="cat-filter-row cat-filter-sub">
          <Link
            href={`/posts/c/${activeParent.slug}`}
            className={`cat-chip sub ${activeSlug === activeParent.slug ? "active" : ""}`}
          >
            전체
          </Link>
          {children.map((c) => (
            <Link
              key={c.slug}
              href={`/posts/c/${activeParent.slug}/${c.slug}`}
              className={`cat-chip sub ${activeSlug === c.slug ? "active" : ""}`}
            >
              {c.label}
              <span className="cat-chip-count">{c.count}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
