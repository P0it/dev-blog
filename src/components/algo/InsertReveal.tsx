"use client";

import { useState, type ReactNode } from "react";
import { InsertByHand, type InsertResult } from "./InsertByHand";

/**
 * 카드 끼우기 → 되짚기. 다 끼우기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 횟수와 예상 비교는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function InsertReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<InsertResult | null>(null);

  return (
    <>
      <InsertByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <p className="algo-pairs-verdict" data-ok={res.guess === res.actual}>
            내 예상 <b>{res.guess}번</b> · 실제 <b>{res.actual}번</b> → <b>{res.guess === res.actual ? "맞았어요" : "달랐어요"}</b>
          </p>
        )}
        <p>
          카드를 정렬하는 데 견주기 <strong>{res?.compares ?? 0}번</strong>, 밀기 <strong>{res?.shifts ?? 0}번</strong>이 들었습니다.
        </p>
        {children}
      </div>
    </>
  );
}
