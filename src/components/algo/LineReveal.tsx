"use client";

import { useState, type ReactNode } from "react";
import { LineByHand, type LineResult } from "./LineByHand";
import { LINE_PEOPLE, insertFrontMoves, appendMoves } from "@/lib/algo/array-list";

/**
 * 줄 세워 보기 → 되짚기. 새 사람을 세우기 전에는 뒤 설명이 숨어 있다.
 *
 * 처음부터를 누르면 되짚기도 다시 숨는다 — 옛 결과가 남으면 새로 해 보는 것과 어긋난다.
 * 횟수와 예상의 맞고 틀림은 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function LineReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<LineResult | null>(null);

  return (
    <>
      <LineByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <p className="algo-line-verdict" data-right={res.predictedRight}>
            내 예상: {res.predicted} → <b>{res.predictedRight ? "맞았어요" : "틀렸어요"}</b>
          </p>
        )}
        <p>
          맨 앞에 끼우려고 <strong>{res?.moved ?? insertFrontMoves(LINE_PEOPLE.length)}번</strong> 밀었습니다. 줄 선 {LINE_PEOPLE.length}명이 전부 한
          칸씩 움직였습니다. 맨 뒤에 붙였다면 <strong>{appendMoves(LINE_PEOPLE.length)}번</strong>이었습니다.
        </p>
        {children}
      </div>
    </>
  );
}
