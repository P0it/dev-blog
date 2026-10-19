"use client";

import { useState, type ReactNode } from "react";
import { CoinByHand, GUESS_LABEL, type CoinResult } from "./CoinByHand";

/**
 * 동전 거슬러 주기 → 되짚기. 세트 B 에서 더 적게 줄 수 있다는 걸 보기 전에는 뒤 설명이 숨어 있다.
 * 「처음부터」를 누르면 다시 숨는다.
 *
 * 예상과 실제 비교는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 정답은 "아니다"(큰 동전부터 주면 3개인데 3 + 3 으로 2개가 가능하다)다.
 */
export function CoinReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<CoinResult | null>(null);
  const right = res?.guess === "no";

  return (
    <>
      <CoinByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <p className="algo-pairs-verdict" data-ok={right}>
            내 예상 <b>{GUESS_LABEL[res.guess]}</b> · 실제 <b>아니다</b> → <b>{right ? "맞았어요" : "달랐어요"}</b>
          </p>
        )}
        <p>
          세트 A는 큰 동전부터 줘서 <strong>{res?.aCount ?? 0}개</strong>로 끝났습니다. 세트 B는 큰 동전부터 주면{" "}
          <strong>{res?.bCount ?? 0}개</strong>인데, 다른 방법으로는 <strong>{res?.bBest ?? 0}개</strong>입니다.
        </p>
        {children}
      </div>
    </>
  );
}
