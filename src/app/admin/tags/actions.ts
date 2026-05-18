"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

async function guard() {
  if (!(await isAdmin())) throw new Error("unauthorized");
}

function revalidate() {
  revalidatePath("/admin/tags");
  revalidatePath("/tags");
  revalidatePath("/");
}

// 해당 태그를 가진 모든 글(draft 포함)의 tags[]를 변형한다.
async function mutateTaggedPosts(
  tag: string,
  transform: (tags: string[]) => string[],
): Promise<number> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("posts")
    .select("slug,tags")
    .contains("tags", [tag]);
  if (error) throw error;
  const posts = data ?? [];
  for (const p of posts) {
    const next = transform((p.tags as string[]) ?? []);
    const { error: upErr } = await sb
      .from("posts")
      .update({ tags: next })
      .eq("slug", p.slug);
    if (upErr) throw upErr;
  }
  return posts.length;
}

export async function renameTag(input: {
  from: string;
  to: string;
}): Promise<{ count: number }> {
  await guard();
  const from = input.from.trim();
  const to = input.to.trim();
  if (!from || !to) throw new Error("태그명을 입력하세요");
  if (from === to) return { count: 0 };

  const count = await mutateTaggedPosts(from, (tags) => {
    const set = new Set(tags.map((t) => (t === from ? to : t)));
    return [...set];
  });
  revalidate();
  return { count };
}

export async function deleteTag(tag: string): Promise<{ count: number }> {
  await guard();
  const t = tag.trim();
  if (!t) throw new Error("태그명이 비었습니다");
  const count = await mutateTaggedPosts(t, (tags) => tags.filter((x) => x !== t));
  revalidate();
  return { count };
}
