"use client";

import { useState, type ReactNode } from "react";
import { BoundByHand, type BoundResult } from "./BoundByHand";
import { BOUND_ARR, bisectLeft, bisectRight } from "@/lib/algo/bisect-bounds";

/**
 * 틈 찾아 보기 → 되짚기. 네 틈을 다 찾기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 개수와 예상 비교는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function BoundReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<BoundResult | null>(null);
  const l2 = bisectLeft(BOUND_ARR, 2);
  const r2 = bisectRight(BOUND_ARR, 2);
  const l4 = bisectLeft(BOUND_ARR, 4);
  const r4 = bisectRight(BOUND_ARR, 4);

  return (
    <>
      <BoundByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <p className="algo-pairs-verdict" data-ok={res.predicted}>
            내 예상 <b>{res.guessLabel}</b> · 실제 <b>같다</b> → <b>{res.predicted ? "맞았어요" : "달랐어요"}</b>
          </p>
        )}
        <p>
          2 는 끝 틈 {r2} − 시작 틈 {l2} = <strong>{r2 - l2}장</strong>이었습니다. 줄에 없는 4 는 {r4} − {l4} ={" "}
          <strong>{r4 - l4}장</strong>, 두 틈이 한 자리에 겹쳤습니다.
          {res && res.wrong > 0 ? ` 틀리게 누른 ${res.wrong}번은 이유를 보고 다시 눌렀습니다.` : ""}
        </p>
        {children}
      </div>
    </>
  );
}
