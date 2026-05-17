import type { Locale } from "@/lib/types";

export const LABELS = {
  ko: {
    curation: "큐레이션",
    editorPick: "에디터 추천",
    recent: "최근 글",
    viewAll: "모두 보기 →",
    archive: "아카이브",
    posts: "편",
    allPosts: "모든 글",
    archiveLead: "시간순으로 정렬한 전체 글. 연도와 카테고리로 필터하세요.",
    toc: "목차",
    bodyPending: "본문 준비 중입니다.",
    related: "연관 글",
    switchTo: "EN",
  },
  en: {
    curation: "Featured",
    editorPick: "Editor's Picks",
    recent: "Recent posts",
    viewAll: "View all →",
    archive: "Archive",
    posts: "posts",
    allPosts: "All posts",
    archiveLead: "All posts sorted by date. Filter by year and category.",
    toc: "Contents",
    bodyPending: "Translation in progress.",
    related: "Related",
    switchTo: "KO",
  },
} satisfies Record<Locale, Record<string, string>>;

export type Labels = (typeof LABELS)["ko"];

export function tFor(locale: Locale): Labels {
  return LABELS[locale];
}

export function pathFor(locale: Locale, path: string): string {
  // path는 항상 KO 기준 (예: "/posts/foo"). EN이면 /en 접두사.
  if (locale === "ko") return path;
  if (path === "/") return "/en";
  return `/en${path}`;
}
