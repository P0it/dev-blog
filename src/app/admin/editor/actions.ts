"use server";

import { spawn } from "node:child_process";
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
  redirect("/admin");
}
