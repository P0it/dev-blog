"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/markdown";

const HEADER_OFFSET = 120;

export function TocNav({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el != null);
    if (headings.length === 0) return;

    let frame = 0;
    const compute = () => {
      frame = 0;
      let current: string | null = null;
      for (const h of headings) {
        if (h.getBoundingClientRect().top - HEADER_OFFSET < 0) {
          current = h.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav className="toc">
      {items.map((tt) => {
        const cls = [tt.sub ? "sub" : "", tt.id === activeId ? "active" : ""]
          .filter(Boolean)
          .join(" ");
        return (
          <a key={tt.id} href={`#${tt.id}`} className={cls || undefined}>
            {tt.label}
          </a>
        );
      })}
    </nav>
  );
}
