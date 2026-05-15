import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

export function PostBody({ md, fallback = "본문 준비 중입니다." }: { md: string | null | undefined; fallback?: string }) {
  if (!md || !md.trim()) {
    return (
      <div className="prose" style={{ color: "var(--fg-alternative)", padding: "32px 0" }}>
        {fallback}
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
