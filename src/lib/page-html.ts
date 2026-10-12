// HTML 페이지형 글. body_md 첫 줄이 PAGE_MARKER 면 본문은 마크다운이 아니라
// 그 글 하나만을 위해 만든 HTML 조각이다. 상세 화면은 공통 틀(히어로·목차·
// 시리즈 열)을 빼고 이 HTML 을 화면 폭 그대로 그린다. 규약은 POSTING.md 「HTML 페이지 글」.
export const PAGE_MARKER = "<!-- page -->";

export function isPageBody(body: string | null | undefined): boolean {
  return !!body && body.trimStart().startsWith(PAGE_MARKER);
}

// 검색 스니펫·읽는 시간용 평문. style/script 내용은 글이 아니므로 통째로 뺀다.
export function pageText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(style|script|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
