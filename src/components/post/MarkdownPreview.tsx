"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { renderMarkdown } from "@/components/post/markdownRender";

// 어드민 에디터 라이브 프리뷰. 발행 페이지(MarkdownView)와 같은 renderMarkdown
// 파이프라인을 브라우저에서 비동기 실행한다. MarkdownView는 async 서버 컴포넌트라
// "use client" 트리(PostEditor)에서 직접 렌더하면 React가 막는다 — 그래서 별도 컴포넌트.
export function MarkdownPreview({
  md,
  fallback = "본문 미리보기",
}: {
  md: string;
  fallback?: ReactNode;
}) {
  // 렌더 완료 전까지 직전 결과를 유지해 타이핑 중 깜빡임을 막는다.
  const [node, setNode] = useState<ReactNode>(null);

  useEffect(() => {
    if (!md.trim()) {
      setNode(null);
      return;
    }
    let cancelled = false;
    // 키 입력마다 전체 파이프라인을 돌리지 않게 디바운스.
    const timer = setTimeout(() => {
      renderMarkdown(md)
        .then((rendered) => {
          if (!cancelled) setNode(rendered);
        })
        .catch((e: unknown) => {
          if (!cancelled) {
            setNode(
              <pre
                style={{
                  fontSize: 12,
                  color: "var(--fg-alternative)",
                  whiteSpace: "pre-wrap",
                }}
              >
                프리뷰 렌더 실패: {(e as Error).message}
              </pre>
            );
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [md]);

  if (!md.trim()) {
    return (
      <div className="prose" style={{ color: "var(--fg-alternative)", padding: "32px 0" }}>
        {fallback}
      </div>
    );
  }

  return node;
}
