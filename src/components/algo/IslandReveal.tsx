"use client";

import { useState, type ReactNode } from "react";
import { IslandByHand, type IslandResult } from "./IslandByHand";
import { ISLAND_GRID, countIslands, islandSizes } from "@/lib/algo/connected-components";

const ACTUAL = countIslands(ISLAND_GRID);
const SIZES = islandSizes(ISLAND_GRID);
const LAND_TOTAL = SIZES.reduce((a, b) => a + b, 0);

/**
 * 섬을 다 칠하면 뒤 설명이 열린다. 「처음부터」를 누르면 다시 숨고 결과도 비운다.
 *
 * 내 예상과 실제는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function IslandReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<IslandResult | null>(null);

  return (
    <>
      <IslandByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-island-verdict">
          내 예상 <b>{res?.guess ?? ""}개</b> · 실제 <b>{ACTUAL}개</b> → {res?.predicted ? "맞았어요" : "달랐어요"}
        </p>
        <p className="algo-chain">
          {SIZES.map((s, k) => `섬 ${k + 1}: ${s}칸`).join(" → ")}
          <span>
            땅 {LAND_TOTAL}칸을 칸마다 센 게 아니라, 번지기를 시작한 횟수 {ACTUAL}번을 셌습니다.
          </span>
        </p>
        {children}
      </div>
    </>
  );
}
