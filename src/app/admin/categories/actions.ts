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

// 2단계(부모→자식) 모델 보장. finalParent = slug → parentSlug|null 의 최종 상태.
// 위반 시 사람이 읽을 메시지로 throw (UI가 막아도 서버에서 한 번 더 방어).
function assertTwoLevel(finalParent: Map<string, string | null>) {
  for (const [slug, parent] of finalParent) {
    if (parent == null) continue;
    if (parent === slug) throw new Error("자기 자신을 상위로 둘 수 없습니다");
    if (!finalParent.has(parent))
      throw new Error(`상위 카테고리가 없습니다: ${parent}`);
    // 부모가 또 부모를 가지면 3단계 → 금지
    if (finalParent.get(parent) != null)
      throw new Error("2단계까지만 가능합니다 (3단계 중첩 불가)");
  }
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
  const parentSlug = input.parentSlug || null;

  const sb = supabaseServer();
  const { data: exists } = await sb
    .from("categories")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (exists) throw new Error(`이미 있는 슬러그입니다: ${slug}`);

  // 부모가 있으면 그 부모는 최상위여야 한다(2단계 보장)
  if (parentSlug) {
    const { data: p } = await sb
      .from("categories")
      .select("slug,parent_slug")
      .eq("slug", parentSlug)
      .maybeSingle();
    if (!p) throw new Error(`상위 카테고리가 없습니다: ${parentSlug}`);
    if (p.parent_slug)
      throw new Error("2단계까지만 가능합니다 (3단계 중첩 불가)");
  }

  // sort_order = 같은 형제 그룹(같은 parent_slug)의 마지막 + 1
  const base = sb
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const { data: maxRow } = await (parentSlug
    ? base.eq("parent_slug", parentSlug)
    : base.is("parent_slug", null)
  ).maybeSingle();
  const sort_order = (maxRow?.sort_order ?? -1) + 1;

  const { error } = await sb.from("categories").insert({
    slug,
    label,
    parent_slug: parentSlug,
    sort_order,
  });
  if (error) throw error;
  revalidate();
  return { slug };
}

// 이름만 변경(인라인 편집용). 슬러그는 PK/FK 대상이라 불변, parent는 안 건드림.
export async function renameCategory(
  slug: string,
  labelRaw: string,
): Promise<{ ok: true }> {
  await guard();
  const label = labelRaw.trim();
  if (!label) throw new Error("이름을 입력하세요");
  const sb = supabaseServer();
  const { error } = await sb
    .from("categories")
    .update({ label })
    .eq("slug", slug);
  if (error) throw error;
  revalidate();
  return { ok: true };
}

// 슬러그는 PK이자 FK 대상이라 불변. label / parent만 수정 + 2단계 가드.
export async function updateCategory(input: {
  slug: string;
  label: string;
  parentSlug: string | null;
}): Promise<{ ok: true }> {
  await guard();
  const label = input.label.trim();
  if (!label) throw new Error("이름을 입력하세요");
  const parentSlug = input.parentSlug || null;

  const sb = supabaseServer();
  const { data: all, error: e0 } = await sb
    .from("categories")
    .select("slug,parent_slug");
  if (e0) throw e0;
  // 자식을 가진 항목은 최상위여야 한다(자식이 손자가 되는 것 방지)
  if (parentSlug && (all ?? []).some((c) => c.parent_slug === input.slug))
    throw new Error("하위 카테고리가 있는 항목은 최상위여야 합니다");

  const finalParent = new Map<string, string | null>();
  for (const c of all ?? []) finalParent.set(c.slug, c.parent_slug ?? null);
  finalParent.set(input.slug, parentSlug);
  assertTwoLevel(finalParent);

  const { error } = await sb
    .from("categories")
    .update({ label, parent_slug: parentSlug })
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

// 전역 sort_order 기준 인접 항목과 교환(↑↓). 신 UI(드래그 트리)로 대체 예정.
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

// 드래그 트리에서 호출 — 카테고리의 parent_slug + sort_order 최종 상태를 일괄 반영.
// 클라이언트는 변경 후 트리 전체를 형제 그룹별 0..n 순서로 보내준다.
export async function reorderCategories(
  items: { slug: string; parentSlug: string | null; sortOrder: number }[],
): Promise<{ ok: true }> {
  await guard();
  if (items.length === 0) return { ok: true };

  const sb = supabaseServer();
  const { data: all, error: e0 } = await sb
    .from("categories")
    .select("slug,parent_slug");
  if (e0) throw e0;
  const known = new Set((all ?? []).map((c) => c.slug));

  // 최종 부모 맵: 기존 상태에서 시작해 들어온 변경으로 덮어쓴다(부분 payload도 안전).
  const finalParent = new Map<string, string | null>();
  for (const c of all ?? []) finalParent.set(c.slug, c.parent_slug ?? null);
  for (const it of items) {
    if (!known.has(it.slug))
      throw new Error(`카테고리를 찾을 수 없습니다: ${it.slug}`);
    finalParent.set(it.slug, it.parentSlug || null);
  }
  assertTwoLevel(finalParent);

  // 한 행씩 갱신(블로그 규모 — 항목 수 적음). 하나라도 실패하면 throw.
  for (const it of items) {
    const { error } = await sb
      .from("categories")
      .update({ parent_slug: it.parentSlug || null, sort_order: it.sortOrder })
      .eq("slug", it.slug);
    if (error) throw error;
  }
  revalidate();
  return { ok: true };
}
