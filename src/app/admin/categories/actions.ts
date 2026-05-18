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
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
}

export async function createCategory(input: {
  slug: string;
  label: string;
  parentSlug: string | null;
}): Promise<{ slug: string }> {
  await guard();
  const label = input.label.trim();
  if (!label) throw new Error("이름을 입력하세요");
  const slug = (slugify(input.slug) || slugify(label)).trim();
  if (!slug) throw new Error("슬러그를 만들 수 없습니다");

  const sb = supabaseServer();
  const { data: exists } = await sb
    .from("categories")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (exists) throw new Error(`이미 있는 슬러그입니다: ${slug}`);

  const { data: maxRow } = await sb
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await sb.from("categories").insert({
    slug,
    label,
    parent_slug: input.parentSlug || null,
    sort_order,
  });
  if (error) throw error;
  revalidate();
  return { slug };
}

// 슬러그는 PK이자 FK 대상이라 불변. label / parent만 수정.
export async function updateCategory(input: {
  slug: string;
  label: string;
  parentSlug: string | null;
}): Promise<{ ok: true }> {
  await guard();
  const label = input.label.trim();
  if (!label) throw new Error("이름을 입력하세요");
  if (input.parentSlug && input.parentSlug === input.slug)
    throw new Error("자기 자신을 상위로 둘 수 없습니다");

  const sb = supabaseServer();
  const { error } = await sb
    .from("categories")
    .update({ label, parent_slug: input.parentSlug || null })
    .eq("slug", input.slug);
  if (error) throw error;
  revalidate();
  return { ok: true };
}

// FK: posts.category_slug / categories.parent_slug 모두 ON DELETE SET NULL.
// 삭제 시 해당 글은 미분류, 자식 카테고리는 최상위가 된다.
export async function deleteCategory(slug: string): Promise<{ ok: true }> {
  await guard();
  const sb = supabaseServer();
  const { error } = await sb.from("categories").delete().eq("slug", slug);
  if (error) throw error;
  revalidate();
  return { ok: true };
}

// 전역 sort_order 기준 인접 항목과 교환(↑↓).
export async function moveCategoryOrder(
  slug: string,
  dir: "up" | "down",
): Promise<{ ok: true }> {
  await guard();
  const sb = supabaseServer();
  const { data: all, error } = await sb
    .from("categories")
    .select("slug,sort_order")
    .order("sort_order");
  if (error) throw error;
  const list = all ?? [];
  const i = list.findIndex((c) => c.slug === slug);
  if (i < 0) throw new Error("카테고리를 찾을 수 없습니다");
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return { ok: true }; // 끝 — 변화 없음

  const a = list[i];
  const b = list[j];
  const r1 = await sb.from("categories").update({ sort_order: b.sort_order }).eq("slug", a.slug);
  if (r1.error) throw r1.error;
  const r2 = await sb.from("categories").update({ sort_order: a.sort_order }).eq("slug", b.slug);
  if (r2.error) throw r2.error;
  revalidate();
  return { ok: true };
}
