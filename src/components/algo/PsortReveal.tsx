"use client";

import { useState, type ReactNode } from "react";
import { PsortByHand, type PsortResult } from "./PsortByHand";

/**
 * 기준 하나씩 적용해 보기 → 되짚기. 목표 순서를 만들기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 예상과 실제 비교, 누른 횟수는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function PsortReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<PsortResult | null>(null);

  return (
    <>
      <PsortByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <p className="algo-pairs-verdict" data-ok={res.hit}>
            내 예상 <b>{res.guess}</b> · 실제 <b>{res.actual}</b> → <b>{res.hit ? "맞았어요" : "달랐어요"}</b>
          </p>
        )}
        <p>
          기준을 <strong>{res?.presses.length ?? 0}번</strong> 적용해서 만들었습니다. 가장 적게는 2번입니다. 이름순을 먼저, 점수순을 나중에 합니다.
        </p>
        {children}
      </div>
    </>
  );
}
