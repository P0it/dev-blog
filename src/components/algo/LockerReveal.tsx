"use client";

import { useState, type ReactNode } from "react";
import { LockerByHand, type LockerResult } from "./LockerByHand";
import { SEARCH_ARR, SEARCH_TARGET, SEARCH_MISSING, linearSearch } from "@/lib/algo/linear-search";
import { josa } from "@/lib/algo/josa";

/**
 * 사물함 열어 보기 → 되짚기. 찾기 전에는 뒤 설명이 숨어 있다.
 *
 * 내 예상과 실제는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 「처음부터」를 누르면 ② 가 다시 숨고 결과도 비운다.
 */
export function LockerReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<LockerResult | null>(null);
  const [missing, setMissing] = useState<number | null>(null);

  const actual = linearSearch(SEARCH_ARR, SEARCH_TARGET);

  return (
    <>
      <LockerByHand
        onDone={setRes}
        onMissing={setMissing}
        onReset={() => {
          setRes(null);
          setMissing(null);
        }}
      />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-lsearch-verdict">
          내 예상 <b>{res?.guess ?? ""}</b> · 실제 <b>{actual}번 칸</b> → {res?.predicted ? "맞았어요" : "달랐어요"}
        </p>
        <p>
          칸을 <strong>{res?.opens ?? 0}번</strong> 열어 {actual}번 칸에서 번호표 {josa(SEARCH_TARGET, "을", "를")} 찾았습니다.
          번호표가 섞여 있어서 열어 보기 전에는 어느 칸인지 알 수 없었습니다.
          {missing !== null ? ` 없는 번호 ${josa(SEARCH_MISSING, "은", "는")} 칸을 ${missing}번 다 열고서야 없다고 말할 수 있었습니다.` : ""}
        </p>
        {children}
      </div>
    </>
  );
}
