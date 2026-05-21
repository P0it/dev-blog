"use server";

import { spawn } from "node:child_process";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { deriveExcerpt } from "@/lib/markdown";
import { thumbKindFromSlug } from "@/lib/thumb";
import type { ThumbKind } from "@/lib/types";

// velog식 미니멀 입력: 제목·태그·카테고리·썸네일·본문.
// 슬러그(제목→slugify) / 읽는시간(본문 분량) / 요약(본문 첫 `>`)은 자동.
// 썸네일은 업로드 이미지(coverImage)가 우선, 없으면 패턴(thumbKind).
// thumbKind 가 null 이면 슬러그 해시로 패턴을 자동 결정한다.
// 시리즈·추천 등 미사용 필드는 row에 포함하지 않아 기존 값이 보존된다.
export type EditorInput = {
  originalSlug: string | null; // null = 신규
  title: string;
  bodyMd: string;
  categorySlug: string | null;
  tags: string[];
  coverImage: string | null;
  thumbKind: ThumbKind | null; // null = 슬러그 해시로 자동
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

// 신규 글의 slug — 기존 글은 originalSlug를 유지(URL 안정).
// 제목이 비어 있으면 timestamp fallback으로 임시 슬러그.
function resolveSlug(input: EditorInput, fallback: "draft" | "post"): string {
  if (input.originalSlug) return input.originalSlug;
  return (slugify(input.title) || `${fallback}-${Date.now()}`).trim();
}

// 카드/검색/OG/RSS가 의존하는 excerpt는 본문 첫 `>` 블록에서 파생.
// 본문에 `>` 블록이 없으면 기존 DB값을 보존(시드 글 안전).
async function resolveExcerpt(input: EditorInput): Promise<string | null> {
  const derived = deriveExcerpt(input.bodyMd);
  if (derived) return derived;
  if (!input.originalSlug) return null;
  const sb = supabaseServer();
  const { data } = await sb
    .from("posts")
    .select("excerpt")
    .eq("slug", input.originalSlug)
    .maybeSingle();
  return data?.excerpt ?? null;
}

export async function saveDraft(input: EditorInput): Promise<{ slug: string }> {
  await guard();
  const slug = resolveSlug(input, "draft");
  const excerpt = await resolveExcerpt(input);
  const sb = supabaseServer();

  const baseRow = {
    slug,
    title: input.title,
    excerpt,
    body_md: input.bodyMd || null,
    category_slug: input.categorySlug || null,
    tags: input.tags,
    cover_image: input.coverImage || null,
    thumb_kind: input.thumbKind ?? thumbKindFromSlug(slug),
    reading_min: input.readingMin || null,
    status: "draft" as const,
  };

  if (input.originalSlug) {
    // 업데이트 — series/is_featured는 row에서 제외해 기존 값 유지.
    const { error } = await sb.from("posts").update(baseRow).eq("slug", input.originalSlug);
    if (error) throw error;
  } else {
    const { error } = await sb.from("posts").insert({ ...baseRow, is_featured: false });
    if (error) throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/posts/${slug}`);
  return { slug };
}

export async function publishPost(input: EditorInput): Promise<{ slug: string }> {
  await guard();
  const slug = resolveSlug(input, "post");
  const excerpt = await resolveExcerpt(input);
  const sb = supabaseServer();

  // 기존 발행일이 있으면 유지, 없으면 now()
  let publishedAt: string | null = null;
  if (input.originalSlug) {
    const { data } = await sb.from("posts").select("published_at").eq("slug", input.originalSlug).maybeSingle();
    publishedAt = data?.published_at ?? null;
  }
  if (!publishedAt) publishedAt = new Date().toISOString();

  const baseRow = {
    slug,
    title: input.title,
    excerpt,
    body_md: input.bodyMd || null,
    category_slug: input.categorySlug || null,
    tags: input.tags,
    cover_image: input.coverImage || null,
    thumb_kind: input.thumbKind ?? thumbKindFromSlug(slug),
    reading_min: input.readingMin || null,
    status: "published" as const,
    published_at: publishedAt,
  };

  if (input.originalSlug) {
    const { error } = await sb.from("posts").update(baseRow).eq("slug", input.originalSlug);
    if (error) throw error;
  } else {
    const { error } = await sb.from("posts").insert({ ...baseRow, is_featured: false });
    if (error) throw error;
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/posts/c", "layout");
  revalidatePath(`/posts/${slug}`);
  return { slug };
}

// claude CLI subprocess — 한국어 글을 영어로 번역해 JSON으로 반환.
// /admin은 로컬 전용이라 mac에 설치된 claude CLI를 그대로 사용.
function callClaude(prompt: string, timeoutMs = 120_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["-p", prompt], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const t = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("claude CLI 타임아웃"));
    }, timeoutMs);
    child.stdout.on("data", (d) => { out += d.toString(); });
    child.stderr.on("data", (d) => { err += d.toString(); });
    child.on("error", (e) => { clearTimeout(t); reject(e); });
    child.on("close", (code) => {
      clearTimeout(t);
      if (code !== 0) reject(new Error(`claude exit ${code}: ${err}`));
      else resolve(out);
    });
  });
}

export async function translatePost(slug: string): Promise<{ ok: true }> {
  await guard();
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("posts")
    .select("title,excerpt,body_md")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("글을 찾을 수 없음");

  const prompt = `다음 한국어 글을 자연스러운 영어로 번역하세요. 마크다운 형식과 코드 블록은 그대로 유지하세요. 결과는 다른 텍스트 없이 JSON 한 개만 출력하세요:

{"title": "...", "excerpt": "...", "body_md": "..."}

[제목]
${data.title}

[요약]
${data.excerpt ?? ""}

[본문]
${data.body_md ?? ""}`;

  const raw = await callClaude(prompt);
  // raw에서 첫 { ~ 마지막 } 추출
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("claude 응답에 JSON이 없음");
  let parsed: { title: string; excerpt: string; body_md: string };
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch (e) {
    throw new Error(`JSON 파싱 실패: ${(e as Error).message}`);
  }

  const { error: upErr } = await sb
    .from("posts")
    .update({
      title_en: parsed.title,
      excerpt_en: parsed.excerpt,
      body_md_en: parsed.body_md,
      translated_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (upErr) throw upErr;

  revalidatePath(`/posts/${slug}`);
  revalidatePath(`/en/posts/${slug}`);
  return { ok: true };
}

export async function uploadImage(formData: FormData): Promise<{ url: string }> {
  await guard();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("file 누락");
  if (!file.type.startsWith("image/")) throw new Error(`이미지 아님: ${file.type}`);
  if (file.size > 5 * 1024 * 1024) throw new Error("5MB 초과");

  const ext = file.name.split(".").pop()?.toLowerCase() || file.type.split("/")[1] || "bin";
  const stamp = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID().slice(0, 8);
  const path = `${stamp}/${id}.${ext}`;

  const sb = supabaseServer();
  const { error } = await sb.storage
    .from("post-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = sb.storage.from("post-images").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function deletePost(slug: string): Promise<void> {
  await guard();
  const sb = supabaseServer();
  const { error } = await sb.from("posts").delete().eq("slug", slug);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/posts");
}
