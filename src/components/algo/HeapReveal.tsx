"use client";

import { useState, type ReactNode } from "react";
import { HeapByHand, type HeapResult } from "./HeapByHand";

/**
 * 접수대 해 보기 → 되짚기. 맨 위까지 올리기 전에는 뒤 설명이 숨어 있다.
 *
 * 예상이 맞았는지는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 처음부터를 누르면 결과를 비워 되짚기도 다시 숨는다.
 */
export function HeapReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<HeapResult | null>(null);
  const hit = res !== null && res.guess === res.ups;

  return (
    <>
      <HeapByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-pairs-verdict" data-ok={hit}>
          내 예상 <b>{res?.guess}번</b> · 실제 <b>{res?.ups}번</b> → {hit ? "맞았어요" : "달랐어요"}
        </p>
        {children}
      </div>
    </>
  );
}
