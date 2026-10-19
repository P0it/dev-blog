"use client";

import { useState, type ReactNode } from "react";
import { PairsByHand, type PairsResult } from "./PairsByHand";
import { PAIR_CARDS } from "@/lib/algo/two-pointers";
import { pairCount } from "@/lib/algo/big-o";

/**
 * 짝 찾아 보기 → 되짚기. 찾기 전에는 뒤 설명이 숨어 있다.
 *
 * 합을 본 횟수는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function PairsReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<PairsResult | null>(null);

  return (
    <>
      <PairsByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p>
          합을 <strong>{res?.checks ?? 0}번</strong> 보고 찾았습니다. 카드가 {PAIR_CARDS.length}장이라 모든 쌍은{" "}
          {pairCount(PAIR_CARDS.length)}가지입니다.
          {res && res.wrong > 0 ? ` 잘못 고른 ${res.wrong}번은 이유를 보고 되돌렸습니다.` : ""}
        </p>
        {children}
      </div>
    </>
  );
}
