// 본문 마크다운에서 ```visual JSON 코드 블록을 추출한다.

// ```visual\n{...}\n``` — 펜스 라인 사이의 JSON 문자열을 캡처.
const VISUAL_BLOCK = /```visual[ \t]*\r?\n([\s\S]*?)\r?\n```/g;

/**
 * @param {string} bodyMd
 * @returns {{ raw: string, json: string }[]} raw=블록 전체(치환 대상), json=내부 문자열
 */
export function extractVisualBlocks(bodyMd) {
  const blocks = [];
  if (typeof bodyMd !== "string" || !bodyMd) return blocks;
  VISUAL_BLOCK.lastIndex = 0;
  let m;
  while ((m = VISUAL_BLOCK.exec(bodyMd)) !== null) {
    blocks.push({ raw: m[0], json: m[1] });
  }
  return blocks;
}
