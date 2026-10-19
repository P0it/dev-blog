"use client";

import { useState, type ReactNode } from "react";
import { ParamByHand, type ParamResult } from "./ParamByHand";
import { PILES, LIMIT_HOURS, hoursFor } from "@/lib/algo/parametric-search";
import { worstCaseGuesses } from "@/lib/algo/up-down";

const MAX = Math.max(...PILES);

/**
 * 속도 골라 보기 → 되짚기. 가장 느린 속도를 찾기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 예상 비교와 시도 횟수는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function ParamReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<ParamResult | null>(null);

  return (
    <>
      <ParamByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <p className="algo-pairs-verdict" data-ok={res.predicted}>
            내 예상 <b>{res.guessLabel}</b> · 실제 <b>된다 · 딱 맞는다</b> → <b>{res.predicted ? "맞았어요" : "달랐어요"}</b>
          </p>
        )}
        <p>
          가장 느린 속도는 <strong>{res?.answer ?? 4}</strong>였습니다. 속도가 {res?.answer ?? 4}일 때{" "}
          {hoursFor(PILES, res?.answer ?? 4)}시간이라 {LIMIT_HOURS}시간 안에 되고, 하나 더 느리면{" "}
          {hoursFor(PILES, (res?.answer ?? 4) - 1)}시간이라 안 됩니다.
        </p>
        <p>
          시험한 횟수는 <strong>{res?.tries ?? 0}번</strong>이었습니다. 속도 후보가 {MAX}개라 1부터 하나씩 해 보면 최대{" "}
          {MAX}번, 반씩 줄이면 최대 {worstCaseGuesses(MAX)}번입니다.
        </p>
        {children}
      </div>
    </>
  );
}
