"use client";

import { useState, type ReactNode } from "react";
import { SortByHand } from "./SortByHand";

/**
 * 손으로 정렬해 보기 → 다 맞추면 뒤 설명이 열린다.
 *
 * 바꾼 횟수는 이 컴포넌트가 직접 찍는다 — 서버 쪽에서 함수를 children 으로 넘길 수 없다.
 */
export function SortReveal({ children }: { children: ReactNode }) {
  const [swaps, setSwaps] = useState<number | null>(null);

  return (
    <>
      <SortByHand onDone={setSwaps} />
      <div className="algo-reveal" data-shown={swaps !== null}>
        <p>
          <strong>{swaps ?? 0}번</strong> 바꿔서 맞췄습니다. 여러분은 전체를 눈으로 보고
          골랐습니다.
        </p>
        {children}
      </div>
    </>
  );
}
