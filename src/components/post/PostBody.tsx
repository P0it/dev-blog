import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

export function PostBody({ md }: { md: string | null | undefined }) {
  if (!md || !md.trim()) {
    return (
      <div className="prose" style={{ color: "var(--fg-alternative)", padding: "32px 0" }}>
        본문 준비 중입니다.
      </div>
    );
  }
  return (
    <div className="prose post-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
        {md}
      </ReactMarkdown>
    </div>
  );
}
