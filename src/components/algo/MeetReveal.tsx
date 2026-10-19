"use client";

import { useState, type ReactNode } from "react";
import { MeetByHand, GUESSES, type MeetResult } from "./MeetByHand";
import { MEETINGS, NAMES, greedyPick, namesOf } from "@/lib/algo/activity-selection";

const BEST = greedyPick(MEETINGS, "end");

/**
 * 회의 고르기 해 보기 → 되짚기. 세 방법의 결과를 다 보기 전에는 뒤 설명이 숨어 있다.
 *
 * 내 예상과 실제는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 처음부터를 누르면 결과를 비워 되짚기도 다시 숨는다.
 */
export function MeetReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<MeetResult | null>(null);

  return (
    <>
      <MeetByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-pairs-verdict" data-ok={res?.predicted ?? false}>
          내 예상 <b>{res ? GUESSES[res.guess].short : ""}</b> · 실제 <b>끝나는 시간이 빠른 것부터 ({BEST.length}개)</b> →{" "}
          {res?.predicted ? "맞았어요" : "달랐어요"}
        </p>
        <p className="algo-chain">
          {BEST.map((i) => `${NAMES[i]} ${MEETINGS[i][0]}~${MEETINGS[i][1]}시`).join(" → ")}
          <span>
            내가 고른 회의는 {res?.mine ?? 0}개였습니다. 시작이 빠른 순은 {res?.counts.start ?? 0}개, 짧은 순은 {res?.counts.short ?? 0}개, 끝나는
            시간 순은 {res?.counts.end ?? 0}개({namesOf(BEST)})를 잡았습니다.
          </span>
        </p>
        {children}
      </div>
    </>
  );
}
