"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mermaid } from "@/components/post/Mermaid";

export type FlowStep = {
  label: string;
  md: string;
  branches: { when: string; then: string }[];
};

// 유저 플로우 — 사람이 움직이는 길. 데이터가 흐르는 길인 `구조` 와 역할이 다르다.
//
// 원고는 단계 목록만 담고 그림은 여기서 그린다. mermaid 에 맡기면 프로젝트마다
// 레이아웃이 제각각이고 한글 노드 폭도 흔들려서, 카드 레일로 고정했다.
// 단계 없이 mermaid 만 쓴 옛 원고는 그대로 다이어그램으로 떨어진다.
//
// 레일은 브라우저 스크롤바를 감추고 직접 그린다. OS 스크롤바는 화면 폭에 따라
// 두께와 모양이 제각각이라 카드와 같이 놓으면 페이지가 덜 다듬어져 보인다.
// 대신 넘치는 쪽만 흐려 잘린 카드가 "더 있다"는 신호가 되게 하고, 화살표와
// 진행 막대를 붙인다.
export function UserFlow({ diagram, steps }: { diagram: string | null; steps: FlowStep[] }) {
  const railRef = useRef<HTMLOListElement>(null);
  const [rail, setRail] = useState({ overflow: false, atStart: true, atEnd: true, ratio: 1, pos: 0 });

  const sync = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setRail({
      overflow: max > 4,
      atStart: el.scrollLeft <= 2,
      atEnd: el.scrollLeft >= max - 2,
      ratio: el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1,
      pos: max > 0 ? el.scrollLeft / max : 0,
    });
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [sync, steps.length]);

  // 카드 한 장씩 민다. 카드 폭을 실측해야 스냅 위치와 어긋나지 않는다.
  const nudge = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".lab-uflow-step");
    const by = card ? card.getBoundingClientRect().width : el.clientWidth * 0.8;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * by, behavior: smooth ? "smooth" : "auto" });
  };

  if (steps.length === 0) {
    return diagram ? (
      <div className="lab-panel lab-flow-diagram lab-reveal">
        <Mermaid code={diagram} />
      </div>
    ) : null;
  }

  return (
    <div
      className="lab-uflow-rail"
      data-overflow={rail.overflow}
      data-at-start={rail.atStart}
      data-at-end={rail.atEnd}
    >
      <ol className="lab-uflow lab-stagger" ref={railRef}>
        {steps.map((s, i) => (
          <li key={i} className="lab-uflow-step">
            <div className="lab-panel lab-uflow-card">
              <span className="lab-uflow-num">{String(i + 1).padStart(2, "0")}</span>
              <b className="lab-uflow-label">{s.label}</b>
              {s.md && <p className="lab-uflow-desc">{s.md}</p>}
              {s.branches.length > 0 && (
                <div className="lab-uflow-branches">
                  {s.branches.map((b, j) => (
                    <span key={j} className="lab-uflow-branch">
                      <em>{b.when}</em>
                      {b.then}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* 마지막 카드 뒤에는 화살표를 두지 않는다. CSS 가 :last-child 로 지운다. */}
            <span className="lab-uflow-link" aria-hidden="true" />
          </li>
        ))}
      </ol>

      {rail.overflow && (
        <>
          <button
            type="button"
            className="lab-uflow-nav prev"
            onClick={() => nudge(-1)}
            disabled={rail.atStart}
            aria-label="이전 단계"
          >
            <Chevron />
          </button>
          <button
            type="button"
            className="lab-uflow-nav next"
            onClick={() => nudge(1)}
            disabled={rail.atEnd}
            aria-label="다음 단계"
          >
            <Chevron />
          </button>
          <div className="lab-uflow-bar" aria-hidden="true">
            <i
              style={{
                width: `${rail.ratio * 100}%`,
                left: `${rail.pos * (100 - rail.ratio * 100)}%`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
