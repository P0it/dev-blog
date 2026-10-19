"use client";

import { useState, type ReactNode } from "react";
import { LockByHand } from "./LockByHand";
import { lockCombos } from "@/lib/algo/brute-force";

/**
 * 자물쇠 열어 보기 → 되짚기. 열기 전에는 뒤 설명이 숨어 있다.
 *
 * 돌린 횟수는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function LockReveal({ children }: { children: ReactNode }) {
  const [tries, setTries] = useState<number | null>(null);

  return (
    <>
      <LockByHand onDone={setTries} />
      <div className="algo-reveal" data-shown={tries !== null}>
        <p>
          <strong>{tries ?? 0}번</strong> 돌려서 열었습니다. 세 자리 번호는 모두 {lockCombos(3).toLocaleString("ko-KR")}가지입니다.
        </p>
        {children}
      </div>
    </>
  );
}
