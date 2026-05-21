import type { CSSProperties } from "react";
import { ACCENT_TOKENS, type QuoteCardSpec } from "./types";

/** 인용 카드 — 원문·강연의 한 마디를 따옴표로 감싼 단일 박스. */
export function QuoteCard({ spec }: { spec: QuoteCardSpec }) {
  const t = ACCENT_TOKENS[spec.accent];
  const style = { "--vis-strong": t.strong } as CSSProperties;
  const hasBy = Boolean(spec.attribution || spec.role);
  return (
    <div className="vis vis-quote" style={style}>
      <div className="vis-quote-tx">{`“${spec.quote}”`}</div>
      {hasBy && (
        <div className="vis-quote-by">
          {spec.attribution && (
            <span className="vis-quote-name">{spec.attribution}</span>
          )}
          {spec.role && <span className="vis-quote-role">{spec.role}</span>}
        </div>
      )}
    </div>
  );
}
