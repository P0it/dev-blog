import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import type {
  CategoryRow,
  PostFeaturedChipRow,
  PostRow,
  TagRow,
} from "./types";

type PostJoin = PostRow & {
  category: Pick<CategoryRow, "slug" | "label"> | null;
  post_tags: { tag: Pick<TagRow, "slug" | "label"> | null }[];
  post_featured_chips: Pick<PostFeaturedChipRow, "position" | "variant" | "label">[];
};

const POST_SELECT = `
  id, slug, title, excerpt, body_md, category_id, series_id, series_position,
  status, published_at, reading_min, thumb_kind, is_featured, created_at, updated_at,
  category:categories ( slug, label ),
  post_tags ( tag:tags ( slug, label ) ),
  post_featured_chips ( position, variant, label )
`;

function rowToPost(row: PostJoin): Post {
  const date = row.published_at
    ? new Date(row.published_at).toISOString().slice(0, 10).replaceAll("-", ".")
    : "";
  const year = row.published_at
    ? new Date(row.published_at).getUTCFullYear().toString()
    : "";
  const tags = row.post_tags
    .map((pt) => pt.tag?.label)
    .filter((label): label is string => Boolean(label));
  const featuredChips = row.post_featured_chips
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ variant: c.variant, label: c.label }));

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    category: row.category?.label ?? "",
    tags,
    date,
    readingMin: row.reading_min ? `${row.reading_min}분` : "",
    thumbKind: row.thumb_kind ?? "a",
    isFeatured: row.is_featured,
    featuredChips: featuredChips.length ? featuredChips : undefined,
    year,
  };
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as PostJoin[]).map(rowToPost);
}

export async function getRecentPosts(limit = 12): Promise<Post[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .eq("is_featured", false)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as PostJoin[]).map(rowToPost);
}

export async function getPostBySlug(
  slug: string,
): Promise<{ post: Post; body_md: string } | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as PostJoin;
  return { post: rowToPost(row), body_md: row.body_md };
}
