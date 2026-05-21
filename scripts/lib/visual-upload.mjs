// 렌더된 시각자료 PNG를 Supabase Storage(post-images 버킷)에 올린다.
// 어드민 에디터의 이미지 업로드(src/app/admin/editor/actions.ts)와 같은 버킷·경로 규칙.

import { randomUUID } from "node:crypto";

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase service-role 클라이언트
 * @param {Buffer} pngBuffer
 * @returns {Promise<string>} 공개 URL
 */
export async function uploadVisual(supabase, pngBuffer) {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const path = `${date}/visual-${randomUUID().slice(0, 8)}.png`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, pngBuffer, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: false,
    });
  if (error) throw new Error(`Supabase 업로드 실패: ${error.message}`);

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("publicUrl 생성 실패");
  return data.publicUrl;
}
