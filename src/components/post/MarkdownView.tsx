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

// mermaid 코드블록은 shiki 하이라이팅 대상이 아니므로 pretty-code가 보기 전에
// 컨테이너 div로 치환한다. rehype-react에서 다시 <Mermaid>로 매핑된다.
function rehypeExtractMermaid() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || typeof index !== "number") return;
      const code = node.children.find(
        (c): c is Element => c.type === "element" && c.tagName === "code"
      );
      if (!code) return;
      const classes = (code.properties?.className as string[] | undefined) ?? [];
      if (!classes.includes("language-mermaid")) return;
      const text = code.children
        .filter((c): c is Text => c.type === "text")
        .map((c) => c.value)
        .join("");
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { "data-mermaid-source": text },
        children: [],
      };
    });
  };
}

type DivProps = React.HTMLAttributes<HTMLDivElement> & {
  "data-mermaid-source"?: string;
};

function DivOrMermaid(props: DivProps) {
  const source = props["data-mermaid-source"];
  if (typeof source === "string") {
    return <Mermaid code={source} />;
  }
  return <div {...props} />;
}

export async function MarkdownView({ md }: { md: string }) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    // 본문에 섞인 <u>·<mark> 등 raw HTML을 트리에 통합
    .use(rehypeRaw)
    .use(rehypeExtractMermaid)
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
        div: DivOrMermaid,
      },
    })
    .process(md);

  return <div className="prose post-body">{file.result}</div>;
}
