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
      const altRaw = String(spec.alt || spec.title || "시각자료").trim();
      const altAttr = altRaw
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // 라이트 — 실패하면 블록 전체 실패 처리
      const lightPng = await renderVisual({
        baseUrl,
        pattern: spec.pattern,
        spec,
        token,
        theme: "light",
      });
      const lightUrl = await uploadVisual(supabase, lightPng);

      // 다크 — 실패해도 라이트 단독으로 폴백(본문은 살림)
      let darkUrl = null;
      try {
        const darkPng = await renderVisual({
          baseUrl,
          pattern: spec.pattern,
          spec,
          token,
          theme: "dark",
        });
        darkUrl = await uploadVisual(supabase, darkPng);
      } catch (darkErr) {
        log(`  · ${patternLabel} 다크 렌더 실패, 라이트만 사용: ${darkErr?.message ?? darkErr}`);
      }

      if (darkUrl) {
        // 블로그 테마에 따라 globals.css 가 둘 중 하나만 보여준다
        replacement =
          `<figure class="visual-figure">` +
          `<img class="visual-img visual-light" src="${lightUrl}" alt="${altAttr}" />` +
          `<img class="visual-img visual-dark" src="${darkUrl}" alt="" aria-hidden="true" />` +
          `</figure>`;
      } else {
        replacement = `![${altRaw.replace(/[[\]]/g, " ")}](${lightUrl})`;
      }
      rendered += 1;
      log(`  ✓ visual: ${patternLabel}${darkUrl ? " (light+dark)" : " (light)"}`);
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
