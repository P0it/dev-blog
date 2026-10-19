"use client";

import { useState, type ReactNode } from "react";
import { EditByHand, EDIT_ANSWER, type EditResult } from "./EditByHand";

/**
 * 편집기 해 보기 → 되짚기. 두 번 되돌리기 전에는 뒤 설명이 숨어 있다.
 *
 * 예상이 맞았는지·무엇이 남았는지는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 처음부터를 누르면 결과를 비워 되짚기도 다시 숨는다.
 */
export function StackReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<EditResult | null>(null);
  const hit = res?.guess === EDIT_ANSWER;

  return (
    <>
      <EditByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-pairs-verdict" data-ok={hit}>
          내 예상 <b>{res?.guess}</b> · 실제 <b>{res?.remaining}</b> → {hit ? "맞았어요" : "달랐어요"}
        </p>
        <p>
          되돌릴 때 나간 순서는 <strong>{res?.undone.join(" → ")}</strong> 였습니다. 가장 먼저 한 일이 끝까지 남았습니다.
        </p>
        {children}
      </div>
    </>
  );
}
