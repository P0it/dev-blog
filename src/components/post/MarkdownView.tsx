"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Mermaid } from "@/components/post/Mermaid";

export function MarkdownView({ md }: { md: string }) {
  return (
    <div className="prose post-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          code(props) {
            const { className, children } = props as {
              className?: string;
              children?: React.ReactNode;
            };
            const match = /language-(\w+)/.exec(className ?? "");
            const lang = match?.[1];
            const text = String(children ?? "").replace(/\n$/, "");

            if (lang === "mermaid") {
              return <Mermaid code={text} />;
            }
            // 일반 코드 블록 / 인라인 코드는 기본 렌더 유지
            return <code className={className}>{children}</code>;
          },
        }}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}
