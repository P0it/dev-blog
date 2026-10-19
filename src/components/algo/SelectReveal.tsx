"use client";

import { useState, type ReactNode } from "react";
import { SelectByHand, type SelectResult } from "./SelectByHand";

/**
 * 카드 늘어놓기 → 되짚기. 다 늘어놓기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 횟수와 예상 비교는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 이미 정렬된 카드로 해 본 경우에는 "정렬돼 있는데도 견준 횟수가 같다"를 먼저 말한다.
 */
export function SelectReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<SelectResult | null>(null);

  return (
    <>
      <SelectByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && res.guess !== null && (
          <p className="algo-pairs-verdict" data-ok={res.guess === res.firstPlaced}>
            내 예상 <b>{res.guess}</b> · 실제 <b>{res.firstPlaced}</b> →{" "}
            <b>{res.guess === res.firstPlaced ? "맞았어요" : "달랐어요"}</b>
          </p>
        )}
        <p>
          {res?.sortedStart ? (
            <>
              이미 정렬된 카드인데도 견준 횟수는 <strong>{res.compares}번</strong>입니다. 바꾼 횟수는{" "}
              <strong>{res.swaps}번</strong>입니다.
            </>
          ) : (
            <>
              카드를 정렬하는 데 <strong>{res?.compares ?? 0}번</strong> 견주고 <strong>{res?.swaps ?? 0}번</strong>{" "}
              바꿨습니다.
            </>
          )}
        </p>
        {children}
      </div>
    </>
  );
}
