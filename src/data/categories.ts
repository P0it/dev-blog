import type { CategoryGroup } from "@/lib/types";

export const categoryGroups: CategoryGroup[] = [
  {
    slug: "tech",
    label: "기술",
    count: 42,
    expanded: true,
    children: [
      { slug: "agent", label: "에이전트", count: 14 },
      { slug: "dev-tools", label: "개발자 도구", count: 11 },
      { slug: "solo-dev", label: "1인 개발", count: 9 },
      { slug: "coding-notes", label: "코딩 노트", count: 8 },
    ],
  },
  {
    slug: "reading",
    label: "독서",
    count: 18,
    expanded: true,
    children: [
      { slug: "notes", label: "독서 노트", count: 12 },
      { slug: "quotes", label: "문장 수집", count: 6 },
    ],
  },
  {
    slug: "thought",
    label: "생각",
    count: 15,
    expanded: true,
    children: [
      { slug: "work-life", label: "일과 삶", count: 8 },
      { slug: "values", label: "가치관·태도", count: 4 },
      { slug: "philosophy", label: "철학적 사고", count: 3 },
    ],
  },
  {
    slug: "business",
    label: "비즈니스",
    count: 11,
    expanded: true,
    children: [
      { slug: "insights", label: "인사이트", count: 7 },
      { slug: "product-strategy", label: "제품·전략", count: 4 },
    ],
  },
  {
    slug: "inbox",
    label: "수집함",
    count: 9,
    expanded: false,
    children: [],
  },
];
