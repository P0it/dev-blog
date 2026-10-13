import { PageBody } from "@/components/post/PageBody";
import { highlightPageCode } from "@/lib/page-code";

// 페이지 글 본문 — 서버에서 코드 블록을 칠한 뒤(page-code.ts) 클라이언트 PageBody 에 넘긴다.
export async function PageBodyServer({ html }: { html: string }) {
  return <PageBody html={await highlightPageCode(html)} />;
}
