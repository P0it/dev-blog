"use client";

import { useState } from "react";
import { countInsertionOps } from "@/lib/algo/insertion-sort";
import { countSelectionOps } from "@/lib/algo/selection-sort";
import { Counter } from "./Counter";

/** 카드 모양 네 가지. 같은 여섯 장이 어떻게 서 있느냐만 다르다. */
const SHAPES: { id: string; label: string; cards: number[] }[] = [
  { id: "sorted", label: "이미 정렬된 카드", cards: [1, 2, 4, 5, 7, 9] },
  { id: "near", label: "거의 정렬된 카드", cards: [1, 2, 4, 7, 5, 9] },
  { id: "hand", label: "방금 해 본 카드", cards: [5, 2, 9, 1, 7, 4] },
  { id: "rev", label: "거꾸로 선 카드", cards: [9, 7, 5, 4, 2, 1] },
];

/**
 * ③ 조건 짚기 — 카드가 어떻게 서 있느냐에 따라 견주는 횟수가 얼마나 달라지는지 눌러서 본다.
 *
 * 삽입 정렬은 제자리에 가까울수록 적게 견주고, 선택 정렬은 어느 쪽이든 같다. 타이핑이 없다 — 버튼만 누른다.
 */
export function InsertInputs() {
  const [id, setId] = useState("sorted");
  const shape = SHAPES.find((s) => s.id === id)!;
  const ins = countInsertionOps(shape.cards);
  const sel = countSelectionOps(shape.cards);

  return (
    <section className="algo-insert-inputs" aria-label="카드 모양에 따른 견주는 횟수">
      <div className="algo-seg" role="group" aria-label="카드 모양 고르기">
        {SHAPES.map((s) => (
          <button key={s.id} type="button" aria-pressed={s.id === id} onClick={() => setId(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="algo-track-cells algo-insert-shape" role="img" aria-label={`카드 ${shape.cards.join(" ")}`}>
        {shape.cards.map((v, k) => (
          <div key={k} className="algo-cell algo-cell-out">
            <span className="algo-cell-value">{v}</span>
          </div>
        ))}
      </div>
      <Counter
        rows={[
          { label: "선택 정렬 · 견준 횟수", n: sel.compares, unit: "번" },
          { label: "삽입 정렬 · 견준 횟수", n: ins.compares, unit: "번" },
        ]}
        caption={`삽입 정렬은 카드를 ${ins.shifts}번 밀었습니다. 선택 정렬은 어느 모양이든 ${sel.compares}번 견줍니다.`}
      />
    </section>
  );
}
