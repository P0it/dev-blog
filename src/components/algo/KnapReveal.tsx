"use client";

import { useState, type ReactNode } from "react";
import { KnapByHand, type KnapResult } from "./KnapByHand";

/**
 * 표 채우기 → 되짚기. 표를 다 채우기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 예상과 실제는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function KnapReveal({ children }: { children: ReactNode }) {
  const [r, setR] = useState<KnapResult | null>(null);
  const hit = r !== null && r.guess === r.actual;

  return (
    <>
      <KnapByHand onDone={setR} onReset={() => setR(null)} />
      <div className="algo-reveal" data-shown={r !== null}>
        <p>
          내 예상 <strong>가치 {r?.guess ?? 0}</strong> · 실제 <strong>가치 {r?.actual ?? 0}</strong> →{" "}
          <strong>{hit ? "맞았어요" : "달랐어요"}</strong>
        </p>
        {children}
      </div>
    </>
  );
}
