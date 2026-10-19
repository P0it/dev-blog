"use client";

import { useState, type ReactNode } from "react";
import { QueenByHand, type QueenResult } from "./QueenByHand";
import { QUEEN_N, countSolutions } from "@/lib/algo/n-queens";

const SOLUTIONS = countSolutions(QUEEN_N);

/**
 * 퀸을 다 놓으면 뒤 설명이 열린다. 「처음부터」를 누르면 다시 숨고 결과도 비운다.
 *
 * 내 예상과 실제는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function QueenReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<QueenResult | null>(null);

  return (
    <>
      <QueenByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-queen-verdict">
          내 예상 <b>{res?.guessLabel ?? ""}</b> · 실제 <b>안 된다</b> → {res?.predicted ? "맞았어요" : "달랐어요"}
        </p>
        <p>
          {`퀸을 ${res?.places ?? 0}번 놓고 ${res?.backs ?? 0}번 거둬서 해를 찾았습니다. 첫 줄 맨 왼쪽은 막다른 길이었습니다. 이 보드에서 퀸 ${QUEEN_N}개를 서로 노리지 않게 놓는 방법은 모두 ${SOLUTIONS}가지입니다.`}
        </p>
        {children}
      </div>
    </>
  );
}
