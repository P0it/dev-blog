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

// 서버 HTML 의 글 스크립트를 잠근다(PageBody 가 마운트 뒤 순서대로 실행). 원래 type 은 글이 쓸 리 없는
// data-pve-type 에 보관한다 — data-type 은 글 스크립트가 제 용도로 쓸 수 있다.
export const INERT_SCRIPT_TYPE = "text/post-page";
export const ORIG_SCRIPT_TYPE = "data-pve-type";

export function lockScripts(html: string): string {
  return html.replace(/<script\b([^>]*)>/gi, (_m, attrs: string) => {
    const type = /\stype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1];
    const rest = attrs.replace(/\stype\s*=\s*(["'][^"']*["']|[^\s>]+)/i, "");
    return `<script type="${INERT_SCRIPT_TYPE}"${rest}${type ? ` ${ORIG_SCRIPT_TYPE}="${type}"` : ""}>`;
  });
}
