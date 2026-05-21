import { renderMarkdown } from "@/components/post/markdownRender";

// 발행 페이지용 — 서버 컴포넌트에서 본문을 비동기 렌더한다.
// 에디터 라이브 프리뷰는 클라이언트에서 도는 MarkdownPreview를 쓴다(같은 파이프라인).
export async function MarkdownView({ md }: { md: string }) {
  return renderMarkdown(md);
}
