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
