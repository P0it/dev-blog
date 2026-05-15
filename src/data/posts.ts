import type { Post } from "@/lib/types";

export const featuredPosts: Post[] = [
  {
    slug: "claude-code-subprocess",
    title: "Claude Code subprocess 패턴 — 워커 없이 AI를 호출하는 가장 단순한 방법",
    excerpt:
      "로컬 어드민에서 직접 CLI를 띄우면 launchd, websocket, 큐 전부 사라진다.",
    category: "에이전트",
    tags: ["claude-code", "subprocess", "에이전트"],
    date: "2026.05.04",
    readingMin: "12분",
    thumbKind: "a",
    isFeatured: true,
    featuredChips: [
      { variant: "blue", label: "에이전트" },
      { variant: "default", label: "deep dive" },
    ],
    year: "2026",
  },
  {
    slug: "mcp-ecosystem",
    title: "MCP가 바꾸고 있는 개발자 도구 생태계",
    excerpt: "도구 발견, 권한, 그리고 작은 프로토콜이 어디까지 갈 수 있는지.",
    category: "MCP",
    tags: ["mcp", "도구"],
    date: "2026.04.28",
    readingMin: "8분",
    thumbKind: "b",
    isFeatured: true,
    featuredChips: [{ variant: "purple", label: "MCP" }],
    year: "2026",
  },
  {
    slug: "news-briefing-system",
    title: "News Briefing System — 매일 06:00의 카카오톡 봇",
    excerpt:
      "Claude Max + macOS launchd 만으로 만든 1인용 뉴스레터 시스템.",
    category: "실험",
    tags: ["launchd", "kakaotalk", "1인용"],
    date: "2026.04.20",
    readingMin: "6분",
    thumbKind: "c",
    isFeatured: true,
    featuredChips: [{ variant: "green", label: "실험" }],
    year: "2026",
  },
];

export const recentPosts: Post[] = [
  {
    slug: "routines-verification",
    title: "Routines로 무엇이 되고 무엇이 안 되는지 — 직접 검증 노트",
    excerpt:
      "문서와 실제 동작이 다른 지점들. 토큰 한도, 백그라운드 큐, 에러 핸들링까지.",
    category: "에이전트",
    tags: ["claude-code", "subprocess", "개발기"],
    date: "2026.05.10",
    readingMin: "7분",
    thumbKind: "d",
    year: "2026",
  },
  {
    slug: "how-i-built-this-blog",
    title: "이 블로그를 만든 이야기 — 로컬 어드민 + Vercel 독자 사이트",
    excerpt:
      "왜 worker를 안 쓰고 Mac에서만 글을 쓰기로 했는가. 다기기 셋업 5분.",
    category: "개발자 도구",
    tags: ["next.js", "supabase", "개발기"],
    date: "2026.05.05",
    readingMin: "9분",
    thumbKind: "e",
    year: "2026",
  },
  {
    slug: "ai-draft-lessons",
    title: "AI 자동 초안 기능을 만들면서 배운 것",
    excerpt:
      "YouTube 자막 + Readability + Claude subprocess. 30~60초 만에 검토 가능한 초안이 나온다.",
    category: "트렌드",
    tags: ["claude-code", "ai", "draft"],
    date: "2026.04.30",
    readingMin: "5분",
    thumbKind: "f",
    year: "2026",
  },
];

export const archive2026Extra: Pick<Post, "slug" | "title" | "date" | "category">[] = [
  { date: "2026.04.18", slug: "claude-code-context", title: "Claude Code 컨텍스트 관리 — 무엇을 잊고 무엇을 들고 있는가", category: "에이전트" },
  { date: "2026.04.10", slug: "tool-calling-observations", title: "AI 에이전트의 tool calling — 6개월간의 관찰", category: "에이전트" },
];

export const archive2025: Pick<Post, "slug" | "title" | "date" | "category">[] = [
  { date: "2025.12.22", slug: "year-in-review-2025", title: "올해 만든 것들 — 1인 개발 회고", category: "회고" },
  { date: "2025.11.30", slug: "server-actions-patterns", title: "Next.js App Router에서의 Server Actions 패턴", category: "웹 인프라" },
  { date: "2025.10.14", slug: "supabase-rls-month", title: "Supabase RLS 한 달 운영기", category: "웹 인프라" },
];

export const allPosts: Post[] = [...featuredPosts, ...recentPosts];

export function getPostBySlug(slug: string): Post | undefined {
  return allPosts.find((p) => p.slug === slug);
}
