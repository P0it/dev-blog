"use client";

import { useState, type ReactNode } from "react";
import { QueueByHand, type QueueResult } from "./QueueByHand";
import { TEACHER } from "@/lib/algo/queue-deque";

/**
 * 줄 처리해 보기 → 되짚기. 다 처리하기 전에는 뒤 설명이 숨어 있다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 받은 순서와 예상이 맞았는지는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function QueueReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<QueueResult | null>(null);

  const label = (n: number) => (n === TEACHER ? "선생님" : `${n}번`);

  return (
    <>
      <QueueByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <>
            <p className="algo-chain">
              {res.order.map(label).join(" → ")}
              <span>먼저 선 사람이 먼저 받았습니다. 선생님만 맨 앞에 끼었습니다.</span>
            </p>
            <p>
              내 예상은 <strong>{res.predicted ? "맞았습니다" : "달랐습니다"}</strong>. 선생님이 오기 전까지 5번 손님은 줄에서
              다섯 번째로 받을 차례였습니다. 선생님이 맨 앞에 서자 여섯 번째가 됐습니다.
            </p>
          </>
        )}
        {children}
      </div>
    </>
  );
}
