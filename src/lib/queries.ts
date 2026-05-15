import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  Post,
  Project,
  CategoryGroup,
  ThumbKind,
  ChipVariant,
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
    tags: row.tags ?? [],
    date,
    readingMin: row.reading_min ?? "",
    thumbKind: (row.thumb_kind as ThumbKind) ?? "a",
    isFeatured: row.is_featured,
    featuredChips: row.featured_chips,
    year: date.slice(0, 4),
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
