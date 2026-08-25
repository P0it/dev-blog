"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export type RailItem = { id: string; label: string };
export type RailCta = { href: string; label: string };

export function SectionRail({ items, cta }: { items: RailItem[]; cta?: RailCta | null }) {
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
    <div className="lab-rail-wrap">
      <nav className="lab-rail" aria-label="섹션">
        {items.map((it, i) => (
          <a key={it.id} href={`#${it.id}`} className={it.id === active ? "on" : undefined}>
            <i />
            <em>{String(i + 1).padStart(2, "0")}</em>
            {it.label}
          </a>
        ))}
      </nav>
      {/* 히어로 우상단 바로가기는 표지 장식에 가까워 눈에 잘 안 든다. 본문을 읽는
          내내 따라오는 자리에 같은 링크를 한 번 더 세운다. 레일이 사라지는 폭에서는
          본문 맨 위로 떨어져 가로로 넓게 선다. */}
      {cta && (
        <a className="lab-rail-cta" href={cta.href} target="_blank" rel="noreferrer">
          <span>
            {cta.label}
            <ArrowUpRight size={16} />
          </span>
        </a>
      )}
    </div>
  );
}
