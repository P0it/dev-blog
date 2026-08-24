"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type TrialCase = {
  title: string;
  symptom: string;
  attempt: string;
  result: string;
};

export function Trials({ cases }: { cases: TrialCase[] }) {
  // 여러 개가 동시에 열려 있을 수 있다. 예전엔 하나만 열려서 다음 걸 펼치면
  // 읽던 게 접혔고, 전부 보려면 케이스마다 눌러야 했다.
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const headRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 스크롤을 내리면 다가오는 케이스가 알아서 펼쳐진다.
  //
  // 화면 아래쪽(55~92%)에 들어올 때만 연다. 읽고 있는 줄보다 아래에서 펼쳐져야
  // 늘어난 높이가 아래로 밀리고, 보던 위치가 튀지 않는다.
  // 한 번 연 것은 다시 닫지 않는다 — 위로 스크롤할 때 접히면 그게 더 튄다.
  useEffect(() => {
    const els = headRefs.current.filter((e): e is HTMLButtonElement => e !== null);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .map((e) => els.indexOf(e.target as HTMLButtonElement))
          .filter((i) => i >= 0);
        if (!hit.length) return;
        setOpen((prev) => {
          const next = new Set(prev);
          let changed = false;
          for (const i of hit) if (!next.has(i)) (next.add(i), (changed = true));
          return changed ? next : prev;
        });
      },
      { rootMargin: "-55% 0px -8% 0px", threshold: 0 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [cases.length]);

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="lab-stagger">
      {cases.map((c, i) => {
        const isOpen = open.has(i);
        return (
          <div key={i} className={`lab-panel lab-trial${isOpen ? " open" : ""}`}>
            <button
              type="button"
              className="lab-trial-head"
              aria-expanded={isOpen}
              ref={(el) => {
                headRefs.current[i] = el;
              }}
              onClick={() => toggle(i)}
            >
              <span className="lab-trial-title">
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                {c.title}
              </span>
              <ChevronDown size={18} className="chev" />
            </button>

            {isOpen ? (
              <>
                {c.symptom && (
                  <div className="lab-trial-row">
                    <span className="tag">증상</span>
                    <span>{c.symptom}</span>
                  </div>
                )}
                {c.attempt && (
                  <div className="lab-trial-row">
                    <span className="tag">시도</span>
                    <span>{c.attempt}</span>
                  </div>
                )}
                {c.result && (
                  <div className="lab-trial-row">
                    <span className="tag">결론</span>
                    <span>{c.result}</span>
                  </div>
                )}
              </>
            ) : (
              c.symptom && <div className="lab-trial-peek">{c.symptom}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
