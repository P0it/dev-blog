"use client";

import { useState, type ReactNode } from "react";
import { WindowByHand } from "./WindowByHand";

/**
 * 창 밀어 보기 → 되짚기. 끝까지 밀기 전에는 뒤 설명이 숨어 있다.
 *
 * 맞힌 횟수는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function WindowReveal({ children }: { children: ReactNode }) {
  const [hits, setHits] = useState<number | null>(null);

  return (
    <>
      <WindowByHand onDone={setHits} />
      <div className="algo-reveal" data-shown={hits !== null}>
        <p>
          일곱 번 중 <strong>{hits ?? 0}번</strong> 맞혔습니다. 밀 때마다 한 계산은 빼기 하나, 더하기 하나였습니다.
        </p>
        {children}
      </div>
    </>
  );
}
