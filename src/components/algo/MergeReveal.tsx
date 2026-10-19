"use client";

import { useState, type ReactNode } from "react";
import { MergeByHand, type MergeResult } from "./MergeByHand";

/**
 * 합쳐 보기 → 되짚기. 다 합치기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 횟수와 예상 비교는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 「내 예상 / 실제 / 맞았나」는 한 줄로 보인다.
 */
export function MergeReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<MergeResult | null>(null);

  return (
    <>
      <MergeByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <p className="algo-pairs-verdict" data-ok={res.guess === res.placed}>
            내 예상 <b>{res.guess}번</b> · 실제 <b>{res.placed}번</b> →{" "}
            <b>{res.guess === res.placed ? "맞았어요" : "달랐어요"}</b>
          </p>
        )}
        <p>
          카드 여섯 장을 <strong>{res?.placed ?? 0}번</strong> 내려놓아 합쳤습니다. 맨 앞 두 장만 견주면 됐습니다. 견준 횟수는{" "}
          <strong>{res?.compares ?? 0}번</strong>입니다.
        </p>
        {children}
      </div>
    </>
  );
}
