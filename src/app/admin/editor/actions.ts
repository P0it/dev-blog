"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

export type EditorInput = {
  originalSlug: string | null; // null = 신규
  slug: string;
  title: string;
  excerpt: string;
  bodyMd: string;
  categorySlug: string | null;
  tags: string[];
  thumbKind: string;
  isFeatured: boolean;
  readingMin: string;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function guard() {
  if (!(await isAdmin())) throw new Error("unauthorized");
}

export async function saveDraft(input: EditorInput): Promise<{ slug: string }> {
  await guard();
  const slug = (input.slug || slugify(input.title) || `draft-${Date.now()}`).trim();
  const sb = supabaseServer();

  const row = {
    slug,
    title: input.title,
    excerpt: input.excerpt || null,
    body_md: input.bodyMd || null,
    category_slug: input.categorySlug || null,
    tags: input.tags,
    thumb_kind: input.thumbKind || "a",
    reading_min: input.readingMin || null,
    is_featured: input.isFeatured,
    status: "draft" as const,
  };

  if (input.originalSlug && input.originalSlug !== slug) {
    // 슬러그 변경: 기존 row update with new slug
    const { error } = await sb.from("posts").update(row).eq("slug", input.originalSlug);
    if (error) throw error;
  } else {
    const { error } = await sb.from("posts").upsert(row, { onConflict: "slug" });
    if (error) throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/posts/${slug}`);
  return { slug };
}

export async function publishPost(input: EditorInput): Promise<{ slug: string }> {
  await guard();
  const slug = (input.slug || slugify(input.title) || `post-${Date.now()}`).trim();
  const sb = supabaseServer();

  // 기존 발행일이 있으면 유지, 없으면 now()
  let publishedAt: string | null = null;
  if (input.originalSlug) {
    const { data } = await sb.from("posts").select("published_at").eq("slug", input.originalSlug).maybeSingle();
    publishedAt = data?.published_at ?? null;
  }
  if (!publishedAt) publishedAt = new Date().toISOString();

  const row = {
    slug,
    title: input.title,
    excerpt: input.excerpt || null,
    body_md: input.bodyMd || null,
    category_slug: input.categorySlug || null,
    tags: input.tags,
    thumb_kind: input.thumbKind || "a",
    reading_min: input.readingMin || null,
    is_featured: input.isFeatured,
    status: "published" as const,
    published_at: publishedAt,
  };

  if (input.originalSlug && input.originalSlug !== slug) {
    const { error } = await sb.from("posts").update(row).eq("slug", input.originalSlug);
    if (error) throw error;
  } else {
    const { error } = await sb.from("posts").upsert(row, { onConflict: "slug" });
    if (error) throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath(`/posts/${slug}`);
  return { slug };
}

export async function deletePost(slug: string): Promise<void> {
  await guard();
  const sb = supabaseServer();
  const { error } = await sb.from("posts").delete().eq("slug", slug);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}
