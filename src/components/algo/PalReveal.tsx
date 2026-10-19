"use client";

import { useState, type ReactNode } from "react";
import { PalByHand, type PalResult } from "./PalByHand";

/**
 * 글자 카드 견주기 → 되짚기. 「아버지」 와 회문 하나를 끝내기 전에는 뒤 설명이 숨어 있다.
 * 「처음부터」를 누르면 다시 숨는다.
 *
 * 예상과 실제 비교, 견준 쌍의 수는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function PalReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<PalResult | null>(null);
  const ok = res ? (res.guess === "differ") === !res.actual : false;
  const first = res?.done.find((d) => d.palindrome);
  const bad = res?.done.find((d) => !d.palindrome);

  return (
    <>
      <PalByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <p className="algo-pairs-verdict" data-ok={ok}>
            내 예상 <b>{res.guess === "differ" ? "다르다" : res.guess === "same" ? "같다" : "알 수 없다"}</b> · 실제{" "}
            <b>{res.actual ? "같다" : "다르다"}</b> → <b>{ok ? "맞았어요" : "달랐어요"}</b>
          </p>
        )}
        <p>
          {bad && (
            <>
              「{bad.word}」 는 <strong>{bad.checks}쌍</strong>만 견주고 끝났습니다. 다른 글자가 나오는 순간 더 볼 필요가 없습니다.{" "}
            </>
          )}
          {first && (
            <>
              「{first.word}」 는 끝까지 <strong>{first.checks}쌍</strong>을 견줬고 가운데 글자는 짝 없이 건너뛰었습니다.
            </>
          )}
        </p>
        {children}
      </div>
    </>
  );
}
