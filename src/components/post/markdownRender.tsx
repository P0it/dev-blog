import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import type { Element, Root, Text } from "hast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeReact from "rehype-react";
import { visit } from "unist-util-visit";
import { Mermaid } from "@/components/post/Mermaid";
import { CatalogVisual } from "@/components/visuals/registry";
import { Illustration } from "@/components/visuals/Illustration";

// 발행 페이지(MarkdownView)와 에디터 라이브 프리뷰(MarkdownPreview)가 공유하는
// 마크다운 렌더 파이프라인. async 서버 컴포넌트는 "use client" 트리에서 직접
// 쓸 수 없으므로, 컴포넌트가 아닌 순수 함수로 분리해 양쪽에서 호출한다.

// LLM 생성 SVG에서 스크립트·이벤트 핸들러 제거 (신뢰 파이프라인이지만 기본 가드).
function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "");
}

// mermaid / visual / illustration 코드블록은 shiki 하이라이팅 대상이 아니므로
// pretty-code가 보기 전에 컨테이너 div로 치환한다. rehype-react에서 다시
// 각 컴포넌트로 매핑된다.
const FENCE_MAP: Record<string, string> = {
  "language-mermaid": "data-mermaid-source",
  "language-visual": "data-visual-source",
  "language-illustration": "data-illustration-source",
};

function rehypeExtractBlocks() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || typeof index !== "number") return;
      const code = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "code"
      );
      if (!code) return;
      const classes = (code.properties?.className as string[] | undefined) ?? [];
      const dataAttr = classes.map((c) => FENCE_MAP[c]).find(Boolean);
      if (!dataAttr) return;
      const text = code.children
        .filter((c): c is Text => c.type === "text")
        .map((c) => c.value)
        .join("");
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { [dataAttr]: text },
        children: [],
      };
    });
  };
}

type DivProps = React.HTMLAttributes<HTMLDivElement> & {
  "data-mermaid-source"?: string;
  "data-visual-source"?: string;
  "data-illustration-source"?: string;
};

function DivOrVisual(props: DivProps) {
  const mermaid = props["data-mermaid-source"];
  if (typeof mermaid === "string") return <Mermaid code={mermaid} />;

  const visual = props["data-visual-source"];
  if (typeof visual === "string") return <CatalogVisual json={visual} />;

  const illus = props["data-illustration-source"];
  if (typeof illus === "string") return <Illustration svg={sanitizeSvg(illus)} />;

  return <div {...props} />;
}

export async function renderMarkdown(md: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    // 본문에 섞인 <u>·<mark> 등 raw HTML을 트리에 통합
    .use(rehypeRaw)
    .use(rehypeExtractBlocks)
    .use(rehypePrettyCode, {
      // Night Owl 단일 테마 (Sarah Drasner). 사이트 라이트/다크와 무관하게 코드블록은 항상 다크.
      theme: "night-owl",
      keepBackground: false,
      defaultLang: { block: "plaintext", inline: "plaintext" },
    })
    .use(rehypeSlug)
    .use(rehypeReact, {
      Fragment,
      jsx,
      jsxs,
      components: {
        div: DivOrVisual,
      },
    })
    .process(md);

  return <div className="prose post-body">{file.result}</div>;
}
