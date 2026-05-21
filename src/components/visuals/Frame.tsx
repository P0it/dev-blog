import type { ReactNode } from "react";

/** step·stat 카드의 공통 외곽 — eyebrow·title 은 있을 때만 렌더. */
export function Frame({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
}) {
  const hasHead = Boolean(eyebrow || title);
  return (
    <div className="vis vis-frame">
      {hasHead && (
        <div className="vis-head">
          {eyebrow && <div className="vis-eyebrow">{eyebrow}</div>}
          {title && <div className="vis-title">{title}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
