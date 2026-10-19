"use client";

import { useState, type ReactNode } from "react";
import { QuickByHand, type QuickResult } from "./QuickByHand";

/**
 * 가르기 → 되짚기. 기준 카드를 놓기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 장수와 예상 비교는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 이미 정렬된 카드로 해 본 경우에는 "왼쪽이 비어 한쪽으로 쏠렸다"를 먼저 말한다.
 */
export function QuickReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<QuickResult | null>(null);

  return (
    <>
      <QuickByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && res.guess !== null && (
          <p className="algo-pairs-verdict" data-ok={res.guess === res.left}>
            내 예상 <b>{res.guess}장</b> · 실제 <b>{res.left}장</b> →{" "}
            <b>{res.guess === res.left ? "맞았어요" : "달랐어요"}</b>
          </p>
        )}
        <p>
          {res?.sortedStart ? (
            <>
              이미 정렬된 카드라 기준 {res.pivot} 보다 작은 카드가 없습니다. 왼쪽 <strong>{res.left}장</strong>, 오른쪽{" "}
              <strong>{res.right}장</strong>으로 한쪽에 쏠렸습니다.
            </>
          ) : (
            <>
              기준 카드를 두고 왼쪽 <strong>{res?.left ?? 0}장</strong>, 오른쪽{" "}
              <strong>{res?.right ?? 0}장</strong>으로 갈렸습니다.
            </>
          )}
        </p>
        {res && (
          <p className="algo-chain">
            왼쪽 {res.left}장 | 기준 {res.pivot} | 오른쪽 {res.right}장
            <span>가르는 순간 기준 카드는 {res.left}번 칸에 제자리가 정해졌습니다.</span>
          </p>
        )}
        {children}
      </div>
    </>
  );
}
