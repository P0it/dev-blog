// DB row shapes. Keep these aligned with supabase/migrations/0001_init.sql.

import type { ChipVariant, ThumbKind } from "@/lib/types";

export type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  parent_id: string | null;
  sort_order: number;
};

export type TagRow = {
  id: string;
  slug: string;
  label: string;
};

export type SeriesRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: "active" | "completed" | "paused";
};

export type PostStatus = "draft" | "scheduled" | "published";

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string;
  category_id: string | null;
  series_id: string | null;
  series_position: number | null;
  status: PostStatus;
  published_at: string | null;
  reading_min: number | null;
  thumb_kind: ThumbKind | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type PostFeaturedChipRow = {
  id: string;
  post_id: string;
  position: number;
  variant: ChipVariant;
  label: string;
};

export type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  year: string;
  description: string;
  plan: string | null;
  build: string | null;
  stack: string[];
  url: string | null;
  host: "vercel" | "cloudflare" | null;
  thumb_kind: ThumbKind | null;
  sort_order: number;
};
