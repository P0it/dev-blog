"use client";

import { useState, type ReactNode } from "react";
import { LockByHand } from "./LockByHand";
import { lockCombos } from "@/lib/algo/brute-force";

/**
 * 자물쇠 열어 보기 → 되짚기. 끝내기 전에는 뒤 설명이 숨어 있다.
 *
 * 열어 본 횟수는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 「처음부터」를 누르면 되짚기도 다시 숨는다. 옛 결과가 남으면 새로 해 본 일과 어긋난다.
 */
export function LockReveal({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<{ tries: number; gaveUp: boolean } | null>(null);
  const [round, setRound] = useState(0);

  return (
    <>
      <LockByHand
        key={round}
        onDone={(tries, gaveUp) => setResult({ tries, gaveUp })}
        onReset={() => {
          setResult(null);
          setRound((r) => r + 1);
        }}
      />
      <div className="algo-reveal" data-shown={result !== null}>
        <p>
          {result?.gaveUp ? (
            <>
              <strong>{result.tries}번</strong> 해 봤지만 못 열었습니다. 번호는 모두 {lockCombos(3).toLocaleString("ko-KR")}가지였습니다.
            </>
          ) : (
            <>
              <strong>{result?.tries ?? 0}번</strong> 만에 열었습니다. 운이 좋으면 빨리 열리고, 운이 나쁘면 {lockCombos(3).toLocaleString("ko-KR")}번째에 열립니다.
            </>
          )}
        </p>
        {children}
      </div>
    </>
  );
}
