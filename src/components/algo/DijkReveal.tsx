"use client";

import { useState, type ReactNode } from "react";
import { DijkByHand, GUESSES, type DijkResult } from "./DijkByHand";
import { GRAPH, START, TARGET, fewestHops, fastestPath } from "@/lib/algo/dijkstra";

const FEWEST = fewestHops(GRAPH, START, TARGET);
const FASTEST = fastestPath(GRAPH, START, TARGET);
const FEWEST_TIMES = FEWEST.paths.map((p) => p.time);
const FEWEST_BEST = Math.min(...FEWEST_TIMES);

/**
 * 지도 해 보기 → 되짚기. 도착지를 확정하기 전에는 뒤 설명이 숨어 있다.
 *
 * 내 예상과 실제는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 * 처음부터를 누르면 결과를 비워 되짚기도 다시 숨는다.
 */
export function DijkReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<DijkResult | null>(null);

  return (
    <>
      <DijkByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-pairs-verdict" data-ok={res?.predicted ?? false}>
          내 예상 <b>{res ? GUESSES[res.guess].short : ""}</b> · 실제{" "}
          <b>
            다르다 ({FEWEST_BEST}분 대 {FASTEST.time}분)
          </b>{" "}
          → {res?.predicted ? "맞았어요" : "달랐어요"}
        </p>
        <p className="algo-chain">
          {FASTEST.names.join(" → ")}
          <span>
            가장 빠른 길은 {FASTEST.hops}구간으로 {FASTEST.time}분입니다. 걸음이 가장 적은 길은 {FEWEST.hops}구간이고{" "}
            {FEWEST.paths.map((p) => `${p.names.join("→")} ${p.time}분`).join(", ")}이었습니다.
          </span>
        </p>
        {children}
      </div>
    </>
  );
}
