export type ThumbKind =
  | "a" | "b" | "c" | "d" | "e" | "f"
  | "g" | "h" | "i" | "j" | "k" | "l";

export type ChipVariant = "default" | "blue" | "purple" | "green" | "outline";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug?: string | null;
  tags: string[];
  date: string;
  publishedAt?: string | null;
  sourceDate?: string | null;
  readingMin: string;
  thumbKind: ThumbKind;
  coverImage?: string | null;
  coverBrightness?: number | null;
  isFeatured?: boolean;
  featuredChips?: { variant: ChipVariant; label: string }[];
  year: string;
  bodyMd?: string | null;
  status?: "draft" | "published";
  titleEn?: string | null;
  excerptEn?: string | null;
  bodyMdEn?: string | null;
  translatedAt?: string | null;
  seriesSlug?: string | null;
  seriesOrder?: number | null;
};

export type Locale = "ko" | "en";

export type SeriesContext = {
  slug: string;
  title: string;
  description: string | null;
  items: { slug: string; title: string; order: number | null }[];
};

export type ProjectHost = "vercel" | "cloudflare" | "local" | "none";

// 화면을 올릴 판. 쓰인 기술이 아니라 **캡처를 무엇으로 찍었는지**가 기준이다 —
// 웹으로 만들었어도 폰 화면으로 쓰는 물건이면 "mobile" 이다.
// 판을 그림 비율로만 고르면 데스크탑 전체 페이지 캡처가 "폰의 긴 캡처"와 겹쳐
// 폰 판에 우겨넣어진다. 그래서 원고가 직접 정한다.
export type ProjectPlatform = "mobile" | "web";

export type Project = {
  slug: string;
  name: string;
  year: string;
  tagline: string;
  logoEmoji: string;
  logoBg: string;
  logoUrl: string | null;
  status: string;
  // 사이트 노출 여부. status(운영중/실험중/중단)와는 다른 질문이다.
  visibility: "draft" | "published";
  body: string;
  stack: string[];
  url: string | null;
  host: ProjectHost;
  platform: ProjectPlatform;
  heroMedia: string | null;
  heroPoster: string | null;
  shots: string[];
};

export type CategoryNode = {
  slug: string;
  label: string;
  count: number;
};

export type CategoryGroup = {
  slug: string;
  label: string;
  count: number;
  expanded: boolean;
  children: CategoryNode[];
};
