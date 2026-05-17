import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  Post,
  Project,
  CategoryGroup,
  ThumbKind,
  ChipVariant,
  Locale,
} from "@/lib/types";

// "2026-05-04T00:00:00Z" → "2026.05.04"
function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

type CategoryRow = {
  slug: string;
  label: string;
  parent_slug: string | null;
  sort_order: number;
};

type PostRow = {
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string | null;
  category_slug: string | null;
  tags: string[];
  thumb_kind: string;
  reading_min: string | null;
  is_featured: boolean;
  featured_chips: { variant: ChipVariant; label: string }[];
  status: string;
  published_at: string | null;
  title_en?: string | null;
  excerpt_en?: string | null;
  body_md_en?: string | null;
  translated_at?: string | null;
};

type ProjectRow = {
  name: string;
  year: string;
  description: string | null;
  plan: string | null;
  build_note: string | null;
  stack: string[];
  thumb_kind: string;
  url: string | null;
  host: string | null;
  sort_order: number;
};

async function categoryLabelMap(): Promise<Map<string, string>> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("categories").select("slug,label");
  if (error) throw error;
  return new Map((data ?? []).map((c) => [c.slug, c.label]));
}

function rowToPost(row: PostRow, labels: Map<string, string>): Post {
  const date = fmtDate(row.published_at);
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    category: row.category_slug ? labels.get(row.category_slug) ?? row.category_slug : "",
    categorySlug: row.category_slug,
    tags: row.tags ?? [],
    date,
    readingMin: row.reading_min ?? "",
    thumbKind: (row.thumb_kind as ThumbKind) ?? "a",
    isFeatured: row.is_featured,
    featuredChips: row.featured_chips,
    year: date.slice(0, 4),
    bodyMd: row.body_md,
    status: (row.status === "published" ? "published" : "draft"),
    titleEn: row.title_en ?? null,
    excerptEn: row.excerpt_en ?? null,
    bodyMdEn: row.body_md_en ?? null,
    translatedAt: row.translated_at ?? null,
  };
}

// 로케일에 맞춰 표시 필드를 결정. EN이 없으면 KO로 폴백.
export function localize(post: Post, locale: Locale): Post {
  if (locale !== "en") return post;
  const hasEn = !!(post.titleEn && post.titleEn.trim());
  if (!hasEn) return post;
  return {
    ...post,
    title: post.titleEn!,
    excerpt: post.excerptEn ?? post.excerpt,
    bodyMd: post.bodyMdEn ?? post.bodyMd,
  };
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const sb = supabaseServer();
  const labels = await categoryLabelMap();
  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data as PostRow[]).map((r) => rowToPost(r, labels));
}

export async function getRecentPosts(limit = 6): Promise<Post[]> {
  const sb = supabaseServer();
  const labels = await categoryLabelMap();
  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("is_featured", false)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as PostRow[]).map((r) => rowToPost(r, labels));
}

export async function getAllPosts(): Promise<Post[]> {
  const sb = supabaseServer();
  const labels = await categoryLabelMap();
  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data as PostRow[]).map((r) => rowToPost(r, labels));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const sb = supabaseServer();
  const labels = await categoryLabelMap();
  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToPost(data as PostRow, labels);
}

// 어드민 에디터용: status 필터 없음 (draft도 가져옴)
export async function getPostForEditor(slug: string): Promise<Post | null> {
  const sb = supabaseServer();
  const labels = await categoryLabelMap();
  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToPost(data as PostRow, labels);
}

export async function getAllCategoriesFlat(): Promise<
  { slug: string; label: string; parent_slug: string | null }[]
> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("categories")
    .select("slug,label,parent_slug")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function getAllPostSlugs(): Promise<string[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("posts")
    .select("slug")
    .eq("status", "published");
  if (error) throw error;
  return (data ?? []).map((r) => r.slug);
}

export async function getCategoryGroups(): Promise<CategoryGroup[]> {
  const sb = supabaseServer();
  const [{ data: cats, error: e1 }, { data: posts, error: e2 }] = await Promise.all([
    sb.from("categories").select("*").order("sort_order"),
    sb.from("posts").select("category_slug").eq("status", "published"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  // category_slug별 글 수
  const counts = new Map<string, number>();
  for (const p of posts ?? []) {
    if (!p.category_slug) continue;
    counts.set(p.category_slug, (counts.get(p.category_slug) ?? 0) + 1);
  }

  const rows = (cats as CategoryRow[]) ?? [];
  const parents = rows.filter((c) => c.parent_slug === null);
  const children = rows.filter((c) => c.parent_slug !== null);

  return parents.map((parent) => {
    const myChildren = children
      .filter((c) => c.parent_slug === parent.slug)
      .map((c) => ({
        slug: c.slug,
        label: c.label,
        count: counts.get(c.slug) ?? 0,
      }));
    const directCount = counts.get(parent.slug) ?? 0;
    const total = directCount + myChildren.reduce((a, c) => a + c.count, 0);
    return {
      slug: parent.slug,
      label: parent.label,
      count: total,
      expanded: myChildren.length > 0,
      children: myChildren,
    };
  });
}

// 같은 카테고리 + 태그 겹침 점수로 연관 글 추천.
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const sb = supabaseServer();
  const labels = await categoryLabelMap();
  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("status", "published")
    .neq("slug", post.slug)
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const tagSet = new Set(post.tags);
  const scored = (data as PostRow[])
    .map((r) => {
      const sharedTags = (r.tags ?? []).filter((t) => tagSet.has(t)).length;
      const sameCat = r.category_slug && r.category_slug === post.categorySlug ? 1 : 0;
      return { row: r, score: sharedTags * 2 + sameCat };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((x) => rowToPost(x.row, labels));
}

export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("posts")
    .select("tags")
    .eq("status", "published");
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    for (const t of (row.tags as string[]) ?? []) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const sb = supabaseServer();
  const labels = await categoryLabelMap();
  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("status", "published")
    .contains("tags", [tag])
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data as PostRow[]).map((r) => rowToPost(r, labels));
}

export async function searchPosts(rawQuery: string): Promise<Post[]> {
  const q = rawQuery.trim();
  if (!q) return [];
  const sb = supabaseServer();
  const labels = await categoryLabelMap();

  // %, _, , 등 이스케이프
  const esc = q.replace(/[%_,]/g, "\\$&");
  const pattern = `%${esc}%`;

  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("status", "published")
    .or(
      [
        `title.ilike.${pattern}`,
        `excerpt.ilike.${pattern}`,
        `body_md.ilike.${pattern}`,
        `title_en.ilike.${pattern}`,
        `excerpt_en.ilike.${pattern}`,
        `body_md_en.ilike.${pattern}`,
      ].join(","),
    )
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data as PostRow[]).map((r) => rowToPost(r, labels));
}

export async function getCategoryBySlug(
  slug: string,
): Promise<{ slug: string; label: string; parent_slug: string | null } | null> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("categories")
    .select("slug,label,parent_slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// 어떤 카테고리에 속한 글들. slug가 부모면 자식 카테고리 글까지 포함.
export async function getPostsByCategorySlug(slug: string): Promise<Post[]> {
  const sb = supabaseServer();
  const labels = await categoryLabelMap();

  const { data: children } = await sb
    .from("categories")
    .select("slug")
    .eq("parent_slug", slug);
  const slugs = [slug, ...(children ?? []).map((c) => c.slug)];

  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("status", "published")
    .in("category_slug", slugs)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data as PostRow[]).map((r) => rowToPost(r, labels));
}

export async function getProjects(): Promise<Project[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data as ProjectRow[]).map((r) => ({
    k: (r.thumb_kind as ThumbKind) ?? "a",
    name: r.name,
    year: r.year,
    desc: r.description ?? "",
    plan: r.plan ?? "",
    build: r.build_note ?? "",
    stack: r.stack ?? [],
    url: r.url ?? "",
    host: (r.host as Project["host"]) ?? "vercel",
  }));
}

// 어드민 대시보드용 집계
export async function getAdminStats(): Promise<{
  published: number;
  drafts: number;
}> {
  const sb = supabaseServer();
  const [{ count: published }, { count: drafts }] = await Promise.all([
    sb.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    sb.from("posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
  ]);
  return { published: published ?? 0, drafts: drafts ?? 0 };
}

function monthStartIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

// page_views 테이블이 아직 없으면(마이그레이션 전) null 반환.
export async function getViewStats(): Promise<{
  monthly: number | null;
  total: number | null;
  topPosts: { slug: string; title: string; views: number }[];
}> {
  const sb = supabaseServer();
  try {
    const [{ count: monthly, error: e1 }, { count: total, error: e2 }] = await Promise.all([
      sb
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStartIso()),
      sb.from("page_views").select("*", { count: "exact", head: true }),
    ]);
    if (e1 || e2) return { monthly: null, total: null, topPosts: [] };

    const { data: rows } = await sb
      .from("page_views")
      .select("slug")
      .not("slug", "is", null)
      .gte("created_at", monthStartIso())
      .limit(5000);

    const counts = new Map<string, number>();
    for (const r of rows ?? []) {
      if (!r.slug) continue;
      counts.set(r.slug, (counts.get(r.slug) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    let titles = new Map<string, string>();
    if (top.length > 0) {
      const { data: posts } = await sb
        .from("posts")
        .select("slug,title")
        .in("slug", top.map(([s]) => s));
      titles = new Map((posts ?? []).map((p) => [p.slug, p.title]));
    }

    return {
      monthly: monthly ?? 0,
      total: total ?? 0,
      topPosts: top.map(([slug, views]) => ({
        slug,
        title: titles.get(slug) ?? slug,
        views,
      })),
    };
  } catch {
    return { monthly: null, total: null, topPosts: [] };
  }
}

export async function getPostViews(slug: string): Promise<number | null> {
  const sb = supabaseServer();
  try {
    const { count, error } = await sb
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .eq("slug", slug);
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

export async function getRecentDrafts(limit = 6): Promise<
  { slug: string; title: string; status: "Draft" | "Published"; updated_at: string }[]
> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("posts")
    .select("slug,title,status,updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    slug: r.slug,
    title: r.title,
    status: r.status === "published" ? "Published" : "Draft",
    updated_at: r.updated_at,
  }));
}
