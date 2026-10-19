"use client";

import { useState, type ReactNode } from "react";
import { MemoByHand, MEMO_N, type MemoResult } from "./MemoByHand";
import { memoComputes, memoCalls, plainCalls } from "@/lib/algo/memoization";

/**
 * 호출 나무 처리해 보기 → 되짚기. 끝까지 처리하기 전에는 뒤 설명이 숨어 있다.
 *
 * 내 예상과 실제는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 「처음부터」를 누르면 ② 가 다시 숨고 결과도 비운다.
 */
export function MemoReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<MemoResult | null>(null);

  return (
    <>
      <MemoByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-memo-verdict">
          내 예상 <b>{res?.guess ?? ""}</b> · 실제 <b>{memoComputes(MEMO_N)}번</b> → {res?.predicted ? "맞았어요" : "달랐어요"}
        </p>
        <p>
          나무의 호출은 {plainCalls(MEMO_N)}번이었습니다. 수첩을 쓰니 호출은 {memoCalls(MEMO_N)}번으로 줄었습니다. 그중{" "}
          <strong>계산은 {res?.computes ?? 0}번</strong>, 수첩에서 꺼내 쓴 것은 {res?.hits ?? 0}번이었습니다.
        </p>
        {children}
      </div>
    </>
  );
}
