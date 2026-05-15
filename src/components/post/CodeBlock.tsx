import { Copy, FileCode2 } from "lucide-react";
import type { ReactNode } from "react";

export type CodeLine = {
  n: number;
  tokens: ReactNode;
};

export function CodeBlock({
  filename,
  language,
  lines,
}: {
  filename: string;
  language: string;
  lines: CodeLine[];
}) {
  return (
    <div className="codeblock">
      <div className="codeblock-head">
        <div className="filename">
          <FileCode2 size={14} />
          <span>{filename}</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span>{language}</span>
          <Copy size={14} style={{ opacity: 0.7 }} />
        </div>
      </div>
      <div className="codeblock-body">
        {lines.map((l) => (
          <div key={l.n}>
            <span className="ln">{l.n || ""}</span>
            {l.tokens}
          </div>
        ))}
      </div>
    </div>
  );
}
