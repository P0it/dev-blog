"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

async function guard() {
  if (!(await isAdmin())) throw new Error("unauthorized");
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// URL → 초안: placeholder draft 1개 + ai_jobs(pending) 1개.
// 실제 본문 생성은 로컬 Mac mini 워커가 처리.
export async function requestDraftFromUrl(input: {
  url: string;
  note: string;
}): Promise<{ slug: string }> {
  await guard();
  const url = input.url.trim();
  if (!isHttpUrl(url)) throw new Error("유효한 http(s) URL이 아닙니다");

  const sb = supabaseServer();
  const slug = `ai-draft-${Date.now()}`;

  const { error: pErr } = await sb.from("posts").insert({
    slug,
    title: `(AI 대기) ${url}`,
    status: "draft",
  });
  if (pErr) throw pErr;

  const { error: jErr } = await sb.from("ai_jobs").insert({
    type: "draft_from_url",
    post_slug: slug,
    source_url: url,
    instruction: input.note?.trim() || null,
    status: "pending",
  });
  if (jErr) throw jErr;

  revalidatePath("/admin/posts");
  return { slug };
}

// 기존 글에 URL→초안 채우기: 새 placeholder 만들지 않고 해당 글에 job만 건다.
// (에디터에서 빈/기존 글을 URL 내용으로 채울 때)
export async function requestDraftIntoPost(input: {
  slug: string;
  url: string;
  note: string;
}): Promise<{ ok: true }> {
  await guard();
  const slug = input.slug.trim();
  const url = input.url.trim();
  if (!slug) throw new Error("slug 누락");
  if (!isHttpUrl(url)) throw new Error("유효한 http(s) URL이 아닙니다");

  const sb = supabaseServer();
  const { data: post, error: findErr } = await sb
    .from("posts")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!post) throw new Error("글을 찾을 수 없습니다 (먼저 임시 저장하세요)");

  const { error: jErr } = await sb.from("ai_jobs").insert({
    type: "draft_from_url",
    post_slug: slug,
    source_url: url,
    instruction: input.note?.trim() || null,
    status: "pending",
  });
  if (jErr) throw jErr;

  revalidatePath("/admin/posts");
  revalidatePath("/admin/editor");
  return { ok: true };
}

// 초안 개선: ai_jobs(revise, pending) 1개. 요청마다 새 row → 여러 번 반복 가능.
export async function requestRevision(input: {
  slug: string;
  feedback: string;
}): Promise<{ ok: true }> {
  await guard();
  const slug = input.slug.trim();
  const feedback = input.feedback?.trim();
  if (!slug) throw new Error("slug 누락");
  if (!feedback) throw new Error("피드백 내용을 입력하세요");

  const sb = supabaseServer();

  const { data: post, error: findErr } = await sb
    .from("posts")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!post) throw new Error("글을 찾을 수 없습니다");

  const { error: jErr } = await sb.from("ai_jobs").insert({
    type: "revise",
    post_slug: slug,
    instruction: feedback,
    status: "pending",
  });
  if (jErr) throw jErr;

  revalidatePath("/admin/posts");
  return { ok: true };
}

// 목록에서 삭제 — 기존 deletePost는 /admin으로 redirect하므로 목록 전용으로 분리.
export async function deletePostFromList(slug: string): Promise<{ ok: true }> {
  await guard();
  const sb = supabaseServer();
  const { error } = await sb.from("posts").delete().eq("slug", slug);
  if (error) throw error;
  revalidatePath("/admin/posts");
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}
