"use client";

import { useEffect, useState } from "react";
import { Mermaid } from "@/components/post/Mermaid";

export type Step = { label: string; md: string };

// 구조 — 지금 돌아가는 물건이 어떤 덩어리로 나뉘고 그 사이로 무엇이 오가는가.
//
// 예전에는 그림을 sticky 로 붙박고 옆 설명을 스크롤하면 해당 노드가 켜졌는데,
// 둘 다 접었다. 붙박인 판이 설명을 덮었고, 판을 키울수록 읽을 자리가 줄었다.
// 지금은 그림 한 장을 크게 놓고 설명을 그 아래에 편다. 그림이 더 필요하면
// '크게 보기' 로 화면 전체에 원래 크기로 편다.
export function Architecture({ diagram, steps }: { diagram: string | null; steps: Step[] }) {
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!zoom) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [zoom]);

  return (
    <div className="lab-arch">
      {diagram && (
        <div className="lab-panel lab-corner lab-arch-panel">
          <button type="button" className="lab-arch-zoom" onClick={() => setZoom(true)}>
            크게 보기
          </button>
          {/* 구조도는 본문 폭을 다 쓰는 판에 올라가므로 글자를 한 단계 키운다. */}
          <Mermaid code={diagram} fontSize={16} />
        </div>
      )}

      <div className="lab-arch-steps">
        {steps.map((s, i) => (
          <div key={i} className="lab-arch-step">
            <b>{s.label}</b>
            {s.md}
          </div>
        ))}
      </div>

      {zoom && (
        // 노드가 많은 구조도는 본문 폭에서도 줄어든다. 화면 전체를 내주고
        // 원래 크기로 그린 다음, 넘치면 줄이는 대신 스크롤하게 둔다.
        <div className="lab-arch-modal" onClick={() => setZoom(false)} role="presentation">
          <button type="button" className="lab-arch-close" aria-label="닫기">
            닫기
          </button>
          <div className="lab-arch-modal-inner" onClick={(e) => e.stopPropagation()} role="presentation">
            <Mermaid code={diagram ?? ""} fontSize={18} />
          </div>
        </div>
      )}
    </div>
  );
}
