"use client";

import { useState, type ReactNode } from "react";
import { SortByHand } from "./SortByHand";

/**
 * 손으로 정렬해 보기 → 다 맞추면 뒤 설명이 열린다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 바꾼 횟수는 이 컴포넌트가 직접 찍는다 — 서버 쪽에서 함수를 children 으로 넘길 수 없다.
 * `minSwaps` 는 옆칸 교환의 최소 횟수(앞이 더 큰 쌍의 수)이고 `compares` 는 버블 정렬이 하는 비교 횟수다.
 */
export function SortReveal({
  children,
  minSwaps,
  compares,
}: {
  children: ReactNode;
  minSwaps: number;
  compares: number;
}) {
  const [swaps, setSwaps] = useState<number | null>(null);

  return (
    <>
      <SortByHand onDone={setSwaps} />
      <div className="algo-reveal" data-shown={swaps !== null}>
        <p>
          <strong>{swaps ?? 0}번</strong> 바꿔서 맞췄습니다.{" "}
          {swaps !== null && swaps === minSwaps
            ? `옆 칸끼리만 바꿀 때 가장 적은 ${minSwaps}번이에요.`
            : `옆 칸끼리만 바꾸면 이 줄은 아무리 잘해도 ${minSwaps}번 아래로는 안 됩니다.`}
        </p>
        <p>
          키가 거꾸로 선 쌍이 {minSwaps}개이고, 옆 칸을 한 번 바꾸면 그 쌍이 많아야 하나 줄기 때문입니다.
        </p>
        <p>
          버블 정렬도 바꾸기는 <strong>{minSwaps}번</strong>, 비교는 <strong>{compares}번</strong> 합니다.
        </p>
        {children}
      </div>
    </>
  );
}
