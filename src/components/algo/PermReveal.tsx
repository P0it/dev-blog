"use client";

import { useState, type ReactNode } from "react";
import { PermByHand, type PermResult } from "./PermByHand";
import { PERM_ITEMS, permutationsOf, countPerm } from "@/lib/algo/permutations";

const TOTAL = permutationsOf(PERM_ITEMS).length;
/** 한 번도 헛걸음하지 않고 모두 찾을 때 친구를 세우는 횟수 — 나무의 칸 수(3 + 6 + 6). */
const MIN_PLACES = Array.from({ length: PERM_ITEMS.length }, (_, k) => countPerm(PERM_ITEMS.length, k + 1)).reduce(
  (a, b) => a + b,
  0,
);

/**
 * 모든 순서를 찾으면 뒤 설명이 열린다. 「처음부터」를 누르면 다시 숨고 결과도 비운다.
 *
 * 내 예상과 실제는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function PermReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<PermResult | null>(null);

  return (
    <>
      <PermByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-perm-verdict">
          내 예상 <b>{res?.guess ?? ""}가지</b> · 실제 <b>{TOTAL}가지</b> → {res?.predicted ? "맞았어요" : "달랐어요"}
        </p>
        <p className="algo-chain">
          <b>3 × 2 × 1 = {TOTAL}가지</b>
          <span>
            첫 자리 3가지 → 둘째 자리 2가지 → 셋째 자리 1가지. 친구를 세운 횟수는 {res?.places ?? ""}번이었습니다. 헛걸음 없이 찾으면{" "}
            {MIN_PLACES}번입니다.
          </span>
        </p>
        {children}
      </div>
    </>
  );
}
