"use client";

import { useEffect, useState } from "react";

export type RailItem = { id: string; label: string };

export function SectionRail({ items }: { items: RailItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const targets = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!targets.length) return;

    // 화면 상단 근처를 지나는 섹션을 현재로 본다.
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-12% 0px -66% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav className="lab-rail" aria-label="섹션">
      {items.map((it, i) => (
        <a key={it.id} href={`#${it.id}`} className={it.id === active ? "on" : undefined}>
          <i />
          {String(i + 1).padStart(2, "0")} {it.label}
        </a>
      ))}
    </nav>
  );
}
