"use server";

import { spawn } from "node:child_process";
import sharp from "sharp";
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
  coverBrightness: number | null; // 0~1. 업로드 시 sharp 로 계산. 외부 URL·SVG=null
  thumbKind: ThumbKind | null; // null = 슬러그 해시로 자동
  publishedAt: string | null; // 백데이트용 — null = 자동 처리(발행 시 now())
  sourceDate: string | null;  // 원문(인용/번역 대상)의 작성·업로드 일자. null = 모름
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

// 날짜 기준 미래 차단. 클라이언트가 노출하는 `<input type="date" max=오늘>` 우회
// 대비 + TZ 차 ±1일 허용 (서버가 UTC인데 사용자가 KST 인 경우 등).
function isFutureDateISO(iso: string): boolean {
  const pickedDate = iso.slice(0, 10);
  const tomorrowUtcDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return pickedDate > tomorrowUtcDate;
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

  // 사용자가 입력한 published_at은 미래 방어 후 반영. 비어 있으면 row에서 제외해
  // 기존 값(있다면)을 보존.
  if (input.publishedAt && isFutureDateISO(input.publishedAt)) {
    throw new Error("미래 날짜는 허용되지 않습니다");
  }
  const baseRow: Record<string, unknown> = {
    slug,
    title: input.title,
    excerpt,
    body_md: input.bodyMd || null,
    category_slug: input.categorySlug || null,
    tags: input.tags,
    cover_image: input.coverImage || null,
    cover_brightness: input.coverImage ? input.coverBrightness : null,
    thumb_kind: input.thumbKind ?? thumbKindFromSlug(slug),
    reading_min: input.readingMin || null,
    source_date: input.sourceDate || null,
    status: "draft" as const,
  };
  if (input.publishedAt) baseRow.published_at = input.publishedAt;

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

  // UI 입력이 있으면 그 값을 우선, 없으면 기존 DB 값 유지, 그래도 없으면 now().
  // UI `max` 속성을 우회하는 미래 날짜는 서버에서도 차단.
  if (input.publishedAt && isFutureDateISO(input.publishedAt)) {
    throw new Error("미래 날짜는 허용되지 않습니다");
  }
  let publishedAt: string | null = input.publishedAt;
  if (!publishedAt && input.originalSlug) {
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
    cover_brightness: input.coverImage ? input.coverBrightness : null,
    thumb_kind: input.thumbKind ?? thumbKindFromSlug(slug),
    reading_min: input.readingMin || null,
    source_date: input.sourceDate || null,
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

// 업로드 이미지는 sharp로 리사이즈+WebP 변환해 저장(Storage 1GB 한도 절약).
// 본문 표시폭이 720px(레티나 1440px)이라 1600px 초과분은 화질 손해 없이 줄인다.
// GIF(애니메이션)·SVG(벡터)는 변환하면 손상되므로 원본 그대로 통과시킨다.
const UPLOAD_MAX_WIDTH = 1600;
const UPLOAD_WEBP_QUALITY = 90;

// 평균 휘도(Rec.709, 0~1). sharp.stats() 의 채널 평균을 가중합.
// 실패해도 업로드 자체는 막지 않게 try/catch 로 감싼다 — null 이면 PostDetailView 가
// 기본 스크림/흰글씨로 폴백한다.
async function computeBrightness(buf: Buffer): Promise<number | null> {
  try {
    const stats = await sharp(buf).stats();
    const ch = stats.channels;
    if (ch.length < 3) {
      // 그레이스케일은 첫 채널 평균만으로 충분.
      return Math.max(0, Math.min(1, ch[0].mean / 255));
    }
    const lum = 0.2126 * ch[0].mean + 0.7152 * ch[1].mean + 0.0722 * ch[2].mean;
    return Math.max(0, Math.min(1, lum / 255));
  } catch {
    return null;
  }
}

export async function uploadImage(
  formData: FormData,
): Promise<{ url: string; brightness: number | null }> {
  await guard();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("file 누락");
  if (!file.type.startsWith("image/")) throw new Error(`이미지 아님: ${file.type}`);
  if (file.size > 8 * 1024 * 1024) throw new Error("8MB 초과");

  // GIF·SVG는 원본 유지, 그 외 래스터 이미지는 압축 후 WebP로 저장.
  const passthrough = file.type === "image/gif" || file.type === "image/svg+xml";

  let body: Buffer | File;
  let contentType: string;
  let ext: string;
  let brightness: number | null = null;
  if (passthrough) {
    body = file;
    contentType = file.type;
    ext = file.type === "image/gif" ? "gif" : "svg";
    // GIF 는 첫 프레임으로 휘도 계산. SVG 는 벡터라 패스(null).
    if (file.type === "image/gif") {
      const raw = Buffer.from(await file.arrayBuffer());
      brightness = await computeBrightness(raw);
    }
  } else {
    const input = Buffer.from(await file.arrayBuffer());
    try {
      body = await sharp(input)
        .rotate() // EXIF 방향 보정
        .resize({ width: UPLOAD_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: UPLOAD_WEBP_QUALITY })
        .toBuffer();
    } catch (e) {
      throw new Error(`이미지 처리 실패: ${(e as Error).message}`);
    }
    contentType = "image/webp";
    ext = "webp";
    brightness = await computeBrightness(body);
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID().slice(0, 8);
  const path = `${stamp}/${id}.${ext}`;

  const sb = supabaseServer();
  const { error } = await sb.storage
    .from("post-images")
    .upload(path, body, { contentType, upsert: false });
  if (error) throw error;

  const { data } = sb.storage.from("post-images").getPublicUrl(path);
  return { url: data.publicUrl, brightness };
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
