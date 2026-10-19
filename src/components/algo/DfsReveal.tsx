"use client";

import { useState, type ReactNode } from "react";
import { DfsByHand, type DfsResult } from "./DfsByHand";
import { demoBranches } from "@/lib/algo/dfs";

const BRANCH = demoBranches();
const ACTUAL = BRANCH.rightSteps >= 0 ? "도착한다" : "막다른 길이다";

/**
 * 도착 칸에 닿으면 뒤 설명이 열린다. 「처음부터」를 누르면 다시 숨는다.
 *
 * 결과는 이 컴포넌트가 직접 찍는다 — 서버 쪽에서 함수를 children 으로 넘길 수 없다.
 * 맨 위에 「내 예상 / 실제 → 맞았나」 한 줄을 둔다.
 */
export function DfsReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<DfsResult | null>(null);

  return (
    <>
      <DfsByHand onDone={setRes} />
      <div className="algo-reveal" data-shown={res !== null}>
        {res && (
          <>
            <p className="algo-dfs-verdict">
              <strong>
                내 예상 {res.picked} · 실제 {ACTUAL} → {res.predicted ? "맞았어요" : "달랐어요"}
              </strong>
            </p>
            <p>
              도착까지 <strong>{res.steps}걸음</strong> 걸었고 그중 되돌아가기가 {res.backs}번이었습니다. 도착한 길은{" "}
              {res.pathLen}걸음입니다.
            </p>
          </>
        )}
        {children}
      </div>
    </>
  );
}
