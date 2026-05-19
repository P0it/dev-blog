"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { Mermaid } from "@/components/post/Mermaid";

export function MarkdownView({ md }: { md: string }) {
  return (
    <div className="prose post-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // rehypeRaw: 본문 내 <u>밑줄</u>·<mark>형광펜</mark> 등 raw HTML을 렌더.
        // 본문은 어드민/로컬 AI 워커가 작성하는 신뢰된 CMS 콘텐츠라 허용.
        // rehypeSlug보다 먼저 둬서 raw가 트리에 파싱된 뒤 헤딩 id가 매겨지게 한다.
        rehypePlugins={[rehypeRaw, rehypeSlug]}
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
