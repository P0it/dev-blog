"use client";

import { useState, type ReactNode } from "react";
import { SpreadByHand } from "./SpreadByHand";

/**
 * 도착 칸에 닿으면 뒤 설명이 열린다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 걸음 수는 이 컴포넌트가 직접 찍는다 — 서버 쪽에서 함수를 children 으로 넘길 수 없다.
 */
export function SpreadReveal({ children }: { children: ReactNode }) {
  const [steps, setSteps] = useState<number | null>(null);

  return (
    <>
      <SpreadByHand onDone={setSteps} />
      <div className="algo-reveal" data-shown={steps !== null}>
        <p>
          도착 칸에 <strong>{steps ?? 0}걸음</strong>째에 처음 닿았습니다. 한 걸음마다 이웃 칸이 한 겹씩 물들었습니다.
        </p>
        {children}
      </div>
    </>
  );
}
