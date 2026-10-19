"use client";

import { useState, type ReactNode } from "react";
import { HashByHand, type HashResult } from "./HashByHand";

/**
 * 사물함에 넣어 보기 → 되짚기. 여섯 개를 다 넣기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 내 예상과 실제는 한 줄로 찍는다 — 서버에서 함수를 children 으로 넘길 수 없어 이 컴포넌트가 직접 맡는다.
 */
export function HashReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<HashResult | null>(null);

  return (
    <>
      <HashByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <>
            <p className="algo-chain">
              zed → 3번 칸
              <span>내 예상은 {res.predicted ? "맞았습니다" : "달랐습니다"}</span>
            </p>
            <p>
              <code>zed</code> 는 3번 칸으로 갔고, 거기에는 이미 <code>bob</code> 이 있었습니다. 칸은 8개뿐인데 이름표가 여섯
              개라, 두 이름표가 같은 칸을 가리키는 일이 생겼습니다.
            </p>
          </>
        )}
        {children}
      </div>
    </>
  );
}
