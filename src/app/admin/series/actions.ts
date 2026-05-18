"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

async function guard() {
  if (!(await isAdmin())) throw new Error("unauthorized");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function revalidate() {
  revalidatePath("/admin/series");
  revalidatePath("/series");
}

export async function createSeries(input: {
  slug: string;
  title: string;
  description: string;
}): Promise<{ slug: string }> {
  await guard();
  const title = input.title.trim();
  if (!title) throw new Error("제목을 입력하세요");
  const slug = (slugify(input.slug) || slugify(title)).trim();
  if (!slug) throw new Error("슬러그를 만들 수 없습니다");

  const sb = supabaseServer();
  const { data: exists } = await sb
    .from("series")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (exists) throw new Error(`이미 있는 슬러그입니다: ${slug}`);

  const { error } = await sb.from("series").insert({
    slug,
    title,
    description: input.description.trim() || null,
  });
  if (error) throw error;
  revalidate();
  return { slug };
}

// 슬러그는 PK이자 posts.series_slug FK 대상이라 불변. title/description만 수정.
export async function updateSeries(input: {
  slug: string;
  title: string;
  description: string;
}): Promise<{ ok: true }> {
  await guard();
  const title = input.title.trim();
  if (!title) throw new Error("제목을 입력하세요");

  const sb = supabaseServer();
  const { error } = await sb
    .from("series")
    .update({ title, description: input.description.trim() || null })
    .eq("slug", input.slug);
  if (error) throw error;
  revalidate();
  return { ok: true };
}

// FK: posts.series_slug ON DELETE SET NULL → 글은 남고 시리즈 소속만 해제.
export async function deleteSeries(slug: string): Promise<{ ok: true }> {
  await guard();
  const sb = supabaseServer();
  const { error } = await sb.from("series").delete().eq("slug", slug);
  if (error) throw error;
  revalidate();
  return { ok: true };
}
