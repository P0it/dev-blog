"use client";

import { useState, type ReactNode } from "react";
import { GcdByHand, type GcdResult } from "./GcdByHand";

/**
 * 타일 깔기 → 되짚기. 바닥을 다 깔기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 예상과 실제 비교는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function GcdReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<GcdResult | null>(null);
  const right = res !== null && res.guess === res.last;

  return (
    <>
      <GcdByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <p className="algo-pairs-verdict" data-ok={right}>
            내 예상 한 변 <b>{res.guess}</b> · 실제 한 변 <b>{res.last}</b> → <b>{right ? "맞았어요" : "달랐어요"}</b>
          </p>
        )}
        <p>
          바닥은 <strong>48×18 → 12×18 → 12×6 → 끝</strong>으로 줄었습니다. 줄마다 긴 변을 짧은 변으로 나눈 <strong>나머지</strong>만
          남았습니다.
        </p>
        {children}
      </div>
    </>
  );
}
