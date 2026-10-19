"use client";

import { useState, type ReactNode } from "react";
import { BudgetByHand } from "./BudgetByHand";

/**
 * 예상을 걸어 보기 → 되짚기. 확인을 누르기 전에는 뒤 설명이 숨어 있다.
 *
 * 맞힌 개수는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function BudgetReveal({ children }: { children: ReactNode }) {
  const [hits, setHits] = useState<number | null>(null);

  return (
    <>
      <BudgetByHand onDone={setHits} />
      <div className="algo-reveal" data-shown={hits !== null}>
        <p>
          세 방법 중 <strong>{hits ?? 0}개</strong>를 맞혔습니다. 시간은 대부분 <strong>몇 번 하느냐</strong>가 정합니다.
        </p>
        {children}
      </div>
    </>
  );
}
