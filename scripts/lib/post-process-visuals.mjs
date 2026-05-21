// 본문 후처리: ```visual JSON 블록을 PNG로 굽고 Supabase에 올린 뒤
// 마크다운 이미지 ![alt](url) 로 치환한다.
// 블록 하나가 실패해도 본문 전체는 살리고, 그 블록만 안내 문구로 대체한다.

import { extractVisualBlocks } from "./visual-extract.mjs";
import { renderVisual } from "./visual-render.mjs";
import { uploadVisual } from "./visual-upload.mjs";

/**
 * @param {string} bodyMd
 * @param {{
 *   supabase: import("@supabase/supabase-js").SupabaseClient,
 *   baseUrl: string,
 *   token?: string,
 *   log?: (msg: string) => void,
 * }} ctx
 * @returns {Promise<{ bodyMd: string, rendered: number, failed: number }>}
 */
export async function postProcessVisuals(bodyMd, ctx) {
  const { supabase, baseUrl, token, log = () => {} } = ctx;
  const blocks = extractVisualBlocks(bodyMd);
  if (blocks.length === 0) return { bodyMd, rendered: 0, failed: 0 };

  let result = bodyMd;
  let rendered = 0;
  let failed = 0;

  for (const block of blocks) {
    let patternLabel = "visual";
    let replacement;
    try {
      const spec = JSON.parse(block.json);
      if (!spec || typeof spec.pattern !== "string") {
        throw new Error("pattern 필드 누락");
      }
      patternLabel = spec.pattern;

      const png = await renderVisual({
        baseUrl,
        pattern: spec.pattern,
        spec,
        token,
      });
      const url = await uploadVisual(supabase, png);
      const alt = String(spec.alt || spec.title || "시각자료")
        .replace(/[[\]]/g, " ")
        .trim();
      replacement = `![${alt}](${url})`;
      rendered += 1;
      log(`  ✓ visual: ${patternLabel} → ${url}`);
    } catch (err) {
      failed += 1;
      log(`  ✗ visual 실패 (${patternLabel}): ${err?.message ?? String(err)}`);
      replacement = `> ⚠️ 시각자료 자동 생성에 실패했습니다 (${patternLabel}). 수동 확인이 필요합니다.`;
    }
    // 함수형 치환 — replacement 내 $ 등이 특수 패턴으로 해석되지 않도록.
    result = result.replace(block.raw, () => replacement);
  }

  return { bodyMd: result, rendered, failed };
}
