"use client";

import { useState, type ReactNode } from "react";
import { DollsByHand } from "./DollsByHand";

/**
 * 예상 → 열고 닫아 보기 → 되짚기. 다 닫기 전에는 뒤 설명이 숨어 있다.
 *
 * 처음 예상이 맞았는지는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 「처음부터」를 누르면 `null` 이 와서 되짚기가 다시 숨는다.
 */
export function DollsReveal({ children }: { children: ReactNode }) {
  const [right, setRight] = useState<boolean | null>(null);

  return (
    <>
      <DollsByHand onDone={setRight} />
      <div className="algo-reveal" data-shown={right !== null}>
        <p>
          처음 예상은 <strong>{right ? "맞았습니다" : "달랐습니다"}</strong>. 맨 안쪽에는 구슬만 있었고 더 열 상자는 없었습니다.
        </p>
        <p>
          구슬 4개를 세려면 상자를 <strong>4개</strong> 거쳐야 했습니다. 닫을 때마다 안쪽 답에 1을 더해 바깥 답이 정해졌습니다.
        </p>
        {children}
      </div>
    </>
  );
}
