"use client";

import { useEffect, useRef, useState } from "react";
import { Mermaid } from "@/components/post/Mermaid";

export type Step = { label: string; md: string };

// 다이어그램을 왼쪽에 고정해 두고, 오른쪽 단계를 스크롤하면 그 단계가 말하는
// 조각이 점등된다. 짝은 이름으로 맞춘다 — `### 제목` 과 같은 이름의 노드, 없으면
// 같은 이름의 subgraph 상자. 둘 다 못 찾으면 예전처럼 N 번째 노드로 떨어진다.
// 구조는 순서가 아니라 배치라, 계층을 그리면 노드 수와 단계 수가 어긋나기 때문이다.

// 비교용 정규화 — 제목의 부연("Expo 앱 — 한 코드로 세 플랫폼")은 앞부분만 남기고,
// 공백·기호를 지워 원고와 다이어그램의 사소한 표기 차이를 흡수한다.
function norm(s: string) {
  return s
    .split(/[—–\-:·|(]/)[0]
    .replace(/[\s_.,'"`*]/g, "")
    .toLowerCase();
}

export function Architecture({ diagram, steps }: { diagram: string | null; steps: Step[] }) {
  const [active, setActive] = useState(0);
  // 가로로 긴 다이어그램(LR 계열)은 좁은 칼럼에 넣으면 글자가 안 읽힌다.
  // 렌더된 SVG 비율을 재서 2:1 을 넘으면 폭 전체를 쓰는 밴드로 눕힌다.
  const [wide, setWide] = useState(false);
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
      const vb = svg.viewBox?.baseVal;
      if (vb && vb.height > 0) setWide(vb.width / vb.height > 2);
      const nodes = Array.from(svg.querySelectorAll<SVGGElement>("g.node"));
      const clusters = Array.from(svg.querySelectorAll<SVGGElement>("g.cluster"));
      const label = (el: Element) => norm(el.textContent ?? "");
      // 활성 단계가 가리키는 요소를 찾는다. 노드 → 상자 → N 번째 노드 순.
      const key = norm(steps[active]?.label ?? "");
      const target =
        (key && nodes.find((n) => label(n) === key)) ||
        (key && clusters.find((c) => label(c) === key)) ||
        nodes[active] ||
        null;
      nodes.forEach((n) => n.classList.toggle("lab-node-on", n === target));
      clusters.forEach((c) => c.classList.toggle("lab-cluster-on", c === target));
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [active, diagram, steps]);

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
    <div className={wide ? "lab-arch lab-arch-band" : "lab-arch"}>
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
