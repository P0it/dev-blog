// 본문 후처리: ```visual(JSON) · ```illustration(raw SVG) 블록을
// 라이트·다크 PNG로 굽고 Supabase에 올린 뒤 <figure> 이미지로 치환한다.
// 블록 하나가 실패해도 본문 전체는 살리고, 그 블록만 안내 문구로 대체한다.

import { extractBlocks } from "./visual-extract.mjs";
import { renderVisual } from "./visual-render.mjs";
import { uploadVisual } from "./visual-upload.mjs";

function altToAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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
  const blocks = extractBlocks(bodyMd);
  if (blocks.length === 0) return { bodyMd, rendered: 0, failed: 0 };

  let result = bodyMd;
  let rendered = 0;
  let failed = 0;

  for (const block of blocks) {
    let label = block.kind;
    let replacement;
    try {
      // 블록 종류별로 렌더 입력(pattern·data)과 alt 를 정한다
      let pattern;
      let data;
      let altRaw;
      if (block.kind === "illustration") {
        const svg = block.content.trim();
        if (!svg.startsWith("<svg")) {
          throw new Error("illustration 블록이 <svg>로 시작하지 않음");
        }
        pattern = "illustration";
        data = svg;
        const t = svg.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        altRaw = (t ? t[1] : "일러스트").trim();
      } else {
        const spec = JSON.parse(block.content);
        if (!spec || typeof spec.pattern !== "string") {
          throw new Error("pattern 필드 누락");
        }
        pattern = spec.pattern;
        label = spec.pattern;
        data = JSON.stringify(spec);
        altRaw = String(spec.alt || spec.title || "시각자료").trim();
      }

      // 라이트 — 실패하면 블록 전체 실패 처리
      const lightPng = await renderVisual({ baseUrl, pattern, data, token, theme: "light" });
      const lightUrl = await uploadVisual(supabase, lightPng);

      // 다크 — 실패해도 라이트 단독으로 폴백
      let darkUrl = null;
      try {
        const darkPng = await renderVisual({ baseUrl, pattern, data, token, theme: "dark" });
        darkUrl = await uploadVisual(supabase, darkPng);
      } catch (darkErr) {
        log(`  · ${label} 다크 렌더 실패, 라이트만 사용: ${darkErr?.message ?? darkErr}`);
      }

      if (darkUrl) {
        replacement =
          `<figure class="visual-figure">` +
          `<img class="visual-img visual-light" src="${lightUrl}" alt="${altToAttr(altRaw)}" />` +
          `<img class="visual-img visual-dark" src="${darkUrl}" alt="" aria-hidden="true" />` +
          `</figure>`;
      } else {
        replacement = `![${altRaw.replace(/[[\]]/g, " ")}](${lightUrl})`;
      }
      rendered += 1;
      log(`  ✓ ${label}${darkUrl ? " (light+dark)" : " (light)"}`);
    } catch (err) {
      failed += 1;
      log(`  ✗ ${label} 실패: ${err?.message ?? String(err)}`);
      replacement = `> ⚠️ 시각자료 자동 생성에 실패했습니다 (${label}). 수동 확인이 필요합니다.`;
    }
    // 함수형 치환 — replacement 내 $ 등이 특수 패턴으로 해석되지 않도록.
    result = result.replace(block.raw, () => replacement);
  }

  return { bodyMd: result, rendered, failed };
}
