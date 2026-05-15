export type ThumbKind = "a" | "b" | "c" | "d" | "e" | "f";

export type ChipVariant = "default" | "blue" | "purple" | "green" | "outline";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categorySlug?: string | null;
  tags: string[];
  date: string;
  readingMin: string;
  thumbKind: ThumbKind;
  isFeatured?: boolean;
  featuredChips?: { variant: ChipVariant; label: string }[];
  year: string;
  bodyMd?: string | null;
  status?: "draft" | "published";
  titleEn?: string | null;
  excerptEn?: string | null;
  bodyMdEn?: string | null;
  translatedAt?: string | null;
};

export type Locale = "ko" | "en";

export type Project = {
  k: ThumbKind;
  name: string;
  year: string;
  desc: string;
  plan: string;
  build: string;
  stack: string[];
  url: string;
  host: "vercel" | "cloudflare";
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
