"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";

// 어드민 비주얼 편집기의 블록 AI 수정. 로컬 워커(npm run ai:worker)가 처리하고
// 결과는 ai_jobs.result_html 에만 남는다 — posts 는 편집기가 수락할 때만 바뀐다.

async function guard() {
  if (!(await isAdmin())) throw new Error("unauthorized");
}

export type BlockJob = {
  status: "pending" | "processing" | "done" | "error";
  resultHtml: string | null;
  message: string | null;
};

export async function requestBlockRevise(input: {
  slug: string;
  blockHtml: string;
  instruction: string;
}): Promise<{ id: number }> {
  await guard();
  const instruction = input.instruction.trim();
  if (!input.slug) throw new Error("저장된 글에서만 쓸 수 있습니다");
  if (!instruction) throw new Error("요청 내용을 적어 주세요");
  if (!/^\s*<section[\s>]/i.test(input.blockHtml)) throw new Error("블록 HTML 이 section 이 아닙니다");

  const { data, error } = await supabaseServer()
    .from("ai_jobs")
    .insert({
      type: "block_revise",
      post_slug: input.slug,
      instruction,
      block_html: input.blockHtml,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id as number };
}

export async function getBlockJob(id: number): Promise<BlockJob> {
  await guard();
  const { data, error } = await supabaseServer()
    .from("ai_jobs")
    .select("status,result,result_html")
    .eq("id", id)
    .eq("type", "block_revise")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("작업을 찾을 수 없습니다");
  return {
    status: data.status as BlockJob["status"],
    resultHtml: data.result_html ?? null,
    message: data.result ?? null,
  };
}

// 대기 중일 때만 취소한다. 이미 워커가 잡았으면 끝날 때까지 둔다.
export async function cancelBlockJob(id: number): Promise<void> {
  await guard();
  const { error } = await supabaseServer()
    .from("ai_jobs")
    .update({ status: "error", result: "취소", finished_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending");
  if (error) throw error;
}
