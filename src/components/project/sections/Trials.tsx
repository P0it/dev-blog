"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type TrialCase = {
  title: string;
  symptom: string;
  attempt: string;
  result: string;
};

export function Trials({ cases }: { cases: TrialCase[] }) {
  // 첫 케이스만 펼친 채로 시작한다 — 무엇이 들었는지 한 눈에 보이게.
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="lab-stagger">
      {cases.map((c, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`lab-panel lab-trial${isOpen ? " open" : ""}`}>
            <button
              type="button"
              className="lab-trial-head"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
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
