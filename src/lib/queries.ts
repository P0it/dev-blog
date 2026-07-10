import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type {
  Post,
  Project,
  CategoryGroup,
  ThumbKind,
  ChipVariant,
  Locale,
  SeriesContext,
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
  cover_image: string | null;
  cover_brightness: number | null;
  reading_min: string | null;
  is_featured: boolean;
  featured_chips: { variant: ChipVariant; label: string }[];
  status: string;
  published_at: string | null;
  source_date: string | null;
  title_en?: string | null;
  excerpt_en?: string | null;
  body_md_en?: string | null;
  translated_at?: string | null;
  series_slug?: string | null;
  series_order?: number | null;
};

type ProjectRow = {
  slug: string;
  name: string;
  year: string;
  description: string | null;
  plan: string | null;
  build_note: string | null;
  body_md: string | null;
  stack: string[];
  thumb_kind: string;
  url: string | null;
  host: string | null;
  sort_order: number;
};

function rowToProject(r: ProjectRow): Project {
  return {
    k: (r.thumb_kind as ThumbKind) ?? "a",
    slug: r.slug,
    name: r.name,
    year: r.year,
    desc: r.description ?? "",
    plan: r.plan ?? "",
    build: r.build_note ?? "",
    body: r.body_md ?? "",
    stack: r.stack ?? [],
    url: r.url ?? "",
    host: (r.host as Project["host"]) ?? "vercel",
  };
}

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
    publishedAt: row.published_at,
    sourceDate: row.source_date ?? null,
    readingMin: row.reading_min ?? "",
    thumbKind: (row.thumb_kind as ThumbKind) ?? "a",
    coverImage: row.cover_image ?? null,
    coverBrightness: row.cover_brightness ?? null,
    isFeatured: row.is_featured,
    featuredChips: row.featured_chips,
    year: date.slice(0, 4),
    bodyMd: row.body_md,
    status: (row.status === "published" ? "published" : "draft"),
    titleEn: row.title_en ?? null,
    excerptEn: row.excerpt_en ?? null,
    bodyMdEn: row.body_md_en ?? null,
    translatedAt: row.translated_at ?? null,
    seriesSlug: row.series_slug ?? null,
    seriesOrder: row.series_order ?? null,
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
    .select("slug,label,parent_slug,sort_order")
    .order("sort_order");
  if (error) throw error;
  const rows = data ?? [];
  // 트리 순서로 평탄화: 최상위(정렬순) 바로 뒤에 그 자식들(정렬순).
  // sort_order는 '형제 그룹 내 순서'라 그룹별로 잘라야 정확하다(전역 정렬해도
  // 그룹 내 상대 순서는 보존되므로 마이그레이션 적용 전에도 안전).
  type Flat = { slug: string; label: string; parent_slug: string | null };
  const pick = (c: (typeof rows)[number]): Flat => ({
    slug: c.slug,
    label: c.label,
    parent_slug: c.parent_slug,
  });
  const out: Flat[] = [];
  for (const t of rows.filter((c) => !c.parent_slug)) {
    out.push(pick(t));
    for (const ch of rows.filter((c) => c.parent_slug === t.slug))
      out.push(pick(ch));
  }
  // 부모가 사라진 고아 자식도 누락 없이 뒤에 붙인다(방어)
  const seen = new Set(out.map((c) => c.slug));
  for (const c of rows) if (!seen.has(c.slug)) out.push(pick(c));
  return out;
}

export type AdminCategory = {
  slug: string;
  label: string;
  parent_slug: string | null;
  sort_order: number;
  postCount: number;
};

// 어드민 카테고리 관리용 — 전체 + 카테고리별 글 수(발행 기준).
export async function getCategoriesForAdmin(): Promise<AdminCategory[]> {
  const sb = supabaseServer();
  const [{ data: cats, error: e1 }, { data: posts, error: e2 }] = await Promise.all([
    sb.from("categories").select("slug,label,parent_slug,sort_order").order("sort_order"),
    sb.from("posts").select("category_slug").eq("status", "published"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const counts = new Map<string, number>();
  for (const p of posts ?? []) {
    if (p.category_slug) counts.set(p.category_slug, (counts.get(p.category_slug) ?? 0) + 1);
  }
  return (cats ?? []).map((c) => ({
    slug: c.slug,
    label: c.label,
    parent_slug: c.parent_slug,
    sort_order: c.sort_order,
    postCount: counts.get(c.slug) ?? 0,
  }));
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

  // 1순위: pg_trgm 유사도 랭킹 RPC (0004 마이그레이션 후)
  const rpc = await sb.rpc("search_posts", { q });
  if (!rpc.error && rpc.data) {
    return (rpc.data as PostRow[]).map((r) => rowToPost(r, labels));
  }

  // 폴백: 단순 ILIKE (RPC 없을 때)
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

// 시리즈 목록 (post 수 포함). series 테이블 없으면 [].
export async function getAllSeries(): Promise<
  { slug: string; title: string; description: string | null; count: number }[]
> {
  const sb = supabaseServer();
  try {
    const { data: series, error } = await sb
      .from("series")
      .select("slug,title,description")
      .order("created_at");
    if (error || !series) return [];
    const { data: posts } = await sb
      .from("posts")
      .select("series_slug")
      .eq("status", "published")
      .not("series_slug", "is", null);
    const counts = new Map<string, number>();
    for (const p of posts ?? []) {
      if (p.series_slug) counts.set(p.series_slug, (counts.get(p.series_slug) ?? 0) + 1);
    }
    return series.map((s) => ({ ...s, count: counts.get(s.slug) ?? 0 }));
  } catch {
    return [];
  }
}

export async function getAllSeriesFlat(): Promise<{ slug: string; title: string }[]> {
  const sb = supabaseServer();
  try {
    const { data, error } = await sb.from("series").select("slug,title").order("created_at");
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

// 한 시리즈의 메타 + 정렬된 글 목록. 없으면 null.
export async function getSeriesContext(seriesSlug: string): Promise<SeriesContext | null> {
  const sb = supabaseServer();
  try {
    const { data: s, error } = await sb
      .from("series")
      .select("slug,title,description")
      .eq("slug", seriesSlug)
      .maybeSingle();
    if (error || !s) return null;
    const { data: posts } = await sb
      .from("posts")
      .select("slug,title,series_order")
      .eq("status", "published")
      .eq("series_slug", seriesSlug)
      .order("series_order", { ascending: true, nullsFirst: false });
    return {
      slug: s.slug,
      title: s.title,
      description: s.description,
      items: (posts ?? []).map((p) => ({
        slug: p.slug,
        title: p.title,
        order: p.series_order,
      })),
    };
  } catch {
    return null;
  }
}

export async function getSeriesPosts(seriesSlug: string): Promise<Post[]> {
  const sb = supabaseServer();
  const labels = await categoryLabelMap();
  try {
    const { data, error } = await sb
      .from("posts")
      .select("*")
      .eq("status", "published")
      .eq("series_slug", seriesSlug)
      .order("series_order", { ascending: true, nullsFirst: false });
    if (error) return [];
    return (data as PostRow[]).map((r) => rowToPost(r, labels));
  } catch {
    return [];
  }
}

export async function getProjects(): Promise<Project[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return (data as ProjectRow[]).map(rowToProject);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  // 마이그레이션 전 slug 컬럼 부재 시 404 처리 (사이트는 계속 동작).
  if (error) return null;
  if (!data) return null;
  return rowToProject(data as ProjectRow);
}

export async function getAllProjectSlugs(): Promise<string[]> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("projects").select("slug");
  // 0005_project_detail 마이그레이션 적용 전에는 slug 컬럼이 없다.
  // 그 경우 빈 목록을 반환해 사이트 전체 빌드는 통과시키고,
  // /lab/[slug]는 마이그레이션 후 동작한다.
  if (error) return [];
  return (data as { slug: string }[]).map((r) => r.slug);
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

export type AdminPostRow = {
  slug: string;
  title: string;
  status: "draft" | "published";
  // 독자에게 보이는 작성일(=published_at). draft 처럼 아직 발행 전이면 updated_at 으로 폴백.
  displayDate: string;
  category: string;
  isFeatured: boolean;
  thumbKind: ThumbKind;
  coverImage: string | null;
  aiStatus: "pending" | "processing" | "done" | "error" | null;
};

// 어드민 글 목록 — draft + published 전체, 공개 페이지와 동일하게 작성일(published_at) 기준 정렬.
// published_at 이 없는 draft 는 맨 뒤로 가되 그 안에서는 updated_at desc.
// 각 글의 최신 ai_jobs 상태를 함께 매핑(테이블 없으면 null).
export async function getAllPostsForAdmin(): Promise<AdminPostRow[]> {
  const sb = supabaseServer();
  const labels = await categoryLabelMap();
  const { data, error } = await sb
    .from("posts")
    .select("slug,title,status,published_at,updated_at,category_slug,is_featured,thumb_kind,cover_image")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const aiBySlug = new Map<string, AdminPostRow["aiStatus"]>();
  try {
    const { data: jobs, error: jErr } = await sb
      .from("ai_jobs")
      .select("post_slug,status,created_at")
      .order("created_at", { ascending: false });
    if (!jErr) {
      for (const j of jobs ?? []) {
        if (j.post_slug && !aiBySlug.has(j.post_slug)) {
          aiBySlug.set(j.post_slug, j.status as AdminPostRow["aiStatus"]);
        }
      }
    }
  } catch {
    /* ai_jobs 마이그레이션 전이면 무시 */
  }

  const mapped: AdminPostRow[] = rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    status: r.status === "published" ? "published" : "draft",
    displayDate: r.published_at ?? r.updated_at,
    category: r.category_slug ? labels.get(r.category_slug) ?? r.category_slug : "",
    isFeatured: r.is_featured,
    thumbKind: (r.thumb_kind as ThumbKind) ?? "a",
    coverImage: r.cover_image ?? null,
    aiStatus: aiBySlug.get(r.slug) ?? null,
  }));

  // 작성중(draft)인 글을 항상 상단에 배치하고, 그 안에서는 최신순으로 정렬
  return mapped.sort((a, b) => {
    if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
    const da = a.displayDate ? new Date(a.displayDate).getTime() : 0;
    const db = b.displayDate ? new Date(b.displayDate).getTime() : 0;
    return db - da;
  });
}

// 어드민 태그 관리용 — draft 포함 전체에서 집계.
export async function getAllTagsForAdmin(): Promise<{ tag: string; count: number }[]> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("posts").select("tags");
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

// 글별 조회수 표 (전체 + 이번 달). page_views 없으면 [].
export async function getPostViewTable(): Promise<
  { slug: string; title: string; total: number; monthly: number }[]
> {
  const sb = supabaseServer();
  try {
    const { data: views, error } = await sb
      .from("page_views")
      .select("slug,created_at")
      .not("slug", "is", null)
      .limit(50000);
    if (error || !views) return [];
    const since = monthStartIso();
    const total = new Map<string, number>();
    const monthly = new Map<string, number>();
    for (const v of views) {
      if (!v.slug) continue;
      total.set(v.slug, (total.get(v.slug) ?? 0) + 1);
      if (v.created_at >= since) monthly.set(v.slug, (monthly.get(v.slug) ?? 0) + 1);
    }
    const { data: posts } = await sb.from("posts").select("slug,title");
    const titles = new Map((posts ?? []).map((p) => [p.slug, p.title]));
    return [...total.entries()]
      .map(([slug, t]) => ({
        slug,
        title: titles.get(slug) ?? slug,
        total: t,
        monthly: monthly.get(slug) ?? 0,
      }))
      .sort((a, b) => b.total - a.total);
  } catch {
    return [];
  }
}

export type OpsInfo = {
  env: { key: string; set: boolean }[];
  db: boolean;
  counts: { published: number; drafts: number; categories: number; series: number };
  aiJobs: {
    available: boolean;
    recent: {
      id: number;
      type: string;
      post_slug: string | null;
      status: string;
      result: string | null;
      created_at: string;
    }[];
  };
};

// 설정 = 읽기 전용 운영 정보. 새 테이블 없음.
export async function getOpsInfo(): Promise<OpsInfo> {
  const sb = supabaseServer();
  const envKeys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "ADMIN_PASSWORD",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_GISCUS_REPO",
  ];
  const env = envKeys.map((key) => ({ key, set: !!process.env[key] }));

  let db = true;
  let published = 0;
  let drafts = 0;
  let categories = 0;
  let series = 0;
  try {
    const [p, d, c, s] = await Promise.all([
      sb.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
      sb.from("posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
      sb.from("categories").select("*", { count: "exact", head: true }),
      sb.from("series").select("*", { count: "exact", head: true }),
    ]);
    published = p.count ?? 0;
    drafts = d.count ?? 0;
    categories = c.count ?? 0;
    series = s.count ?? 0;
    if (p.error) db = false;
  } catch {
    db = false;
  }

  let aiAvailable = true;
  let recent: OpsInfo["aiJobs"]["recent"] = [];
  try {
    const { data, error } = await sb
      .from("ai_jobs")
      .select("id,type,post_slug,status,result,created_at")
      .order("created_at", { ascending: false })
      .limit(15);
    if (error) aiAvailable = false;
    else recent = data ?? [];
  } catch {
    aiAvailable = false;
  }

  return {
    env,
    db,
    counts: { published, drafts, categories, series },
    aiJobs: { available: aiAvailable, recent },
  };
}
