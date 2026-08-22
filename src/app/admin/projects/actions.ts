"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import type { ProjectHost } from "@/lib/types";

async function guard() {
  if (!(await isAdmin())) throw new Error("unauthorized");
}

export type ProjectInput = {
  originalSlug: string | null;
  slug: string;
  name: string;
  year: string;
  tagline: string;
  logoUrl: string;
  logoBg: string;
  status: string;
  url: string;
  host: ProjectHost;
  stack: string[];
  bodyMd: string;
};

const HOSTS: ProjectHost[] = ["vercel", "cloudflare", "local", "none"];

// 슬러그는 포스트와 같은 규칙 — 한글 슬러그는 정적 prerender 에서 404 로 고정된다.
function normalizeSlug(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(s)) {
    throw new Error("슬러그는 소문자·숫자·하이픈만 쓸 수 있습니다");
  }
  return s;
}

function toRow(input: ProjectInput) {
  const name = input.name.trim();
  if (!name) throw new Error("이름을 입력하세요");

  const url = input.url.trim();
  if (url && !/^https?:\/\//.test(url)) {
    throw new Error("URL 은 https:// 로 시작하는 절대 주소여야 합니다");
  }

  return {
    slug: normalizeSlug(input.slug),
    name,
    year: input.year.trim(),
    tagline: input.tagline.trim(),
    logo_url: input.logoUrl.trim() || null,
    logo_bg: input.logoBg.trim() || "#1B1C1E",
    status: input.status.trim() || "실험중",
    url: url || null,
    host: HOSTS.includes(input.host) ? input.host : "none",
    stack: input.stack.map((t) => t.trim()).filter(Boolean),
    body_md: input.bodyMd,
  };
}

// 저장 시 노출 상태는 건드리지 않는다. 신규는 draft 로 들어가고,
// 이미 발행된 프로젝트를 저장하면 발행 상태 그대로 본문만 갱신된다.
async function upsert(input: ProjectInput, visibility?: "draft" | "published") {
  const sb = supabaseServer();
  const row = toRow(input);
  const prev = input.originalSlug;

  if (prev) {
    const patch = visibility ? { ...row, visibility } : row;
    const { error } = await sb.from("projects").update(patch).eq("slug", prev);
    if (error) throw error;
  } else {
    const { error } = await sb
      .from("projects")
      .insert({ ...row, visibility: visibility ?? "draft" });
    if (error) throw error;
  }

  revalidatePath("/admin/projects");
  revalidatePath("/lab");
  revalidatePath(`/lab/${row.slug}`);
  if (prev && prev !== row.slug) revalidatePath(`/lab/${prev}`);
  return { slug: row.slug };
}

export async function saveProjectDraft(input: ProjectInput): Promise<{ slug: string }> {
  await guard();
  return upsert(input);
}

export async function publishProject(input: ProjectInput): Promise<{ slug: string }> {
  await guard();
  return upsert(input, "published");
}

export async function publishProjectBySlug(slug: string): Promise<{ ok: true }> {
  await guard();
  const sb = supabaseServer();
  const { error } = await sb.from("projects").update({ visibility: "published" }).eq("slug", slug);
  if (error) throw error;
  revalidatePath("/admin/projects");
  revalidatePath("/lab");
  revalidatePath(`/lab/${slug}`);
  return { ok: true };
}

export async function unpublishProject(slug: string): Promise<{ ok: true }> {
  await guard();
  const sb = supabaseServer();
  const { error } = await sb.from("projects").update({ visibility: "draft" }).eq("slug", slug);
  if (error) throw error;
  revalidatePath("/admin/projects");
  revalidatePath("/lab");
  revalidatePath(`/lab/${slug}`);
  return { ok: true };
}

export async function deleteProject(slug: string): Promise<{ ok: true }> {
  await guard();
  const sb = supabaseServer();
  const { error } = await sb.from("projects").delete().eq("slug", slug);
  if (error) throw error;
  revalidatePath("/admin/projects");
  revalidatePath("/lab");
  return { ok: true };
}
