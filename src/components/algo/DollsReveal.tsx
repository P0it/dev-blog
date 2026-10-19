"use client";

import { useState, type ReactNode } from "react";
import { DollsByHand } from "./DollsByHand";

/**
 * 열고 닫아 보기 → 되짚기. 다 닫기 전에는 뒤 설명이 숨어 있다.
 *
 * 누른 횟수는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function DollsReveal({ children }: { children: ReactNode }) {
  const [moves, setMoves] = useState<number | null>(null);

  return (
    <>
      <DollsByHand onDone={setMoves} />
      <div className="algo-reveal" data-shown={moves !== null}>
        <p>
          <strong>{moves ?? 0}번</strong> 눌러서 다 열고 다 닫았습니다. 닫을 때는 열었던 순서가 정확히 거꾸로였습니다.
        </p>
        {children}
      </div>
    </>
  );
}
