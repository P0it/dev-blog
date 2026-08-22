"use client";

import { useEffect, useRef, useState } from "react";
import { Mermaid } from "@/components/post/Mermaid";

export type Step = { label: string; md: string };

// 다이어그램을 왼쪽에 고정해 두고, 오른쪽 단계를 스크롤하면 해당 노드가 점등된다.
// mermaid 가 그린 SVG 의 노드를 순서대로 집어 현재 단계 인덱스와 맞춘다.
export function Architecture({ diagram, steps }: { diagram: string | null; steps: Step[] }) {
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const els = stepRefs.current.filter((e): e is HTMLDivElement => e !== null);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!hit) return;
        const i = els.indexOf(hit.target as HTMLDivElement);
        if (i >= 0) setActive(i);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: 0 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [steps.length]);

  // 활성 단계에 대응하는 mermaid 노드에 클래스를 건다.
  // mermaid 는 비동기로 그리므로, 아직 SVG 가 없으면 다음 프레임에 다시 본다.
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      const svg = panelRef.current?.querySelector("svg");
      if (!svg) {
        raf = requestAnimationFrame(paint);
        return;
      }
      const nodes = Array.from(svg.querySelectorAll<SVGGElement>("g.node"));
      nodes.forEach((n, i) => n.classList.toggle("lab-node-on", i === active));
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [active, diagram]);

  if (!diagram) {
    return (
      <div className="lab-arch-steps">
        {steps.map((s, i) => (
          <div key={i} className="lab-arch-step on">
            <b>{s.label}</b>
            {s.md}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="lab-arch">
      <div className="lab-panel lab-corner lab-arch-panel" ref={panelRef}>
        <Mermaid code={diagram} />
      </div>
      <div className="lab-arch-steps">
        {steps.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            className={`lab-arch-step${i === active ? " on" : ""}`}
          >
            <b>{s.label}</b>
            {s.md}
          </div>
        ))}
      </div>
    </div>
  );
}
