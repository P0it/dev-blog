"use client";

import { useState, type ReactNode } from "react";
import { SieveByHand, type SieveResult } from "./SieveByHand";
import { SIEVE_N, primesUpTo } from "@/lib/algo/sieve";

const ACTUAL = primesUpTo(SIEVE_N).length;

/**
 * 거르기를 끝내면 뒤 설명이 열린다. 「처음부터」를 누르면 다시 숨고 결과도 비운다.
 *
 * 내 예상과 실제는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function SieveReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<SieveResult | null>(null);

  return (
    <>
      <SieveByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-sieve-verdict">
          내 예상 <b>{res?.guess ?? ""}개</b> · 실제 <b>{ACTUAL}개</b> → {res?.predicted ? "맞았어요" : "달랐어요"}
        </p>
        <p className="algo-chain">
          {(res?.pressed ?? []).join(" → ")}
          <span>
            누른 수입니다. 마지막 수는 눌러도 지워지는 수가 없어서 거기서 끝났습니다.
          </span>
        </p>
        {children}
      </div>
    </>
  );
}
