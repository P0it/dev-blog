"use client";

import { useState, type ReactNode } from "react";
import { RangeByHand, type Guess, type RangeResult } from "./RangeByHand";

const GUESS_TEXT: Record<Guess, string> = {
  hand: "칸을 하나씩 더하는 쪽",
  prefix: "깔아 둔 줄에서 빼는 쪽",
  same: "비슷할 것",
};

/**
 * 같은 질문 셋을 두 방법으로 풀어 보기 → 되짚기. 끝내기 전에는 뒤 설명이 숨어 있다.
 *
 * 손이 간 횟수와 예상은 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function RangeReveal({ children }: { children: ReactNode }) {
  const [r, setR] = useState<RangeResult | null>(null);

  const fewer: Guess = r ? (r.hand === r.prefix ? "same" : r.hand > r.prefix ? "prefix" : "hand") : "same";
  const hit = r !== null && r.guess === fewer;

  return (
    <>
      <RangeByHand onDone={setR} />
      <div className="algo-reveal" data-shown={r !== null}>
        <p>
          손이 간 횟수는 <strong>A 가 {r?.hand ?? 0}번, B 가 {r?.prefix ?? 0}번</strong>이었습니다.{" "}
          {r === null
            ? ""
            : fewer === "same"
              ? "두 방법이 비슷했습니다."
              : hit
                ? `예상한 대로 ${GUESS_TEXT[fewer]}이 덜 눌렀습니다.`
                : `덜 누른 쪽은 ${GUESS_TEXT[fewer]}이었습니다.`}
        </p>
        {children}
      </div>
    </>
  );
}
