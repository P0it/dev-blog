// 본문 마크다운에서 시각자료 블록을 추출한다.
//  ```visual       — JSON (step/stat/callout 카탈로그)
//  ```illustration — raw SVG (개념 일러스트)

const BLOCK = /```(visual|illustration)[ \t]*\r?\n([\s\S]*?)\r?\n```/g;

/**
 * @param {string} bodyMd
 * @returns {{ kind: "visual"|"illustration", raw: string, content: string }[]}
 *   raw=블록 전체(치환 대상), content=펜스 사이 내용
 */
export function extractBlocks(bodyMd) {
  const blocks = [];
  if (typeof bodyMd !== "string" || !bodyMd) return blocks;
  BLOCK.lastIndex = 0;
  let m;
  while ((m = BLOCK.exec(bodyMd)) !== null) {
    blocks.push({ kind: m[1], raw: m[0], content: m[2] });
  }
  return blocks;
}
