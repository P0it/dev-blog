"use client";

import { useState, type ReactNode } from "react";
import { assertOneCorrect, type QuizOption } from "./quiz-check";

/**
 * 확인 문제. **어느 쪽을 골라도 이유가 열린다** — 맞혔는지 알려 주는 게 아니라
 * 왜 그런지를 보게 하는 게 목적이다.
 *
 * 오답은 아무 말이나 쓰지 않는다. 같은 알고리즘이 **다른 입력에서 실제로 하는 행동**으로
 * 만들어야 독자가 진짜 할 법한 착각과 겹친다.
 */
export function Quiz({
  question,
  options,
  why,
}: {
  question: ReactNode;
  options: QuizOption[];
  why: ReactNode;
}) {
  assertOneCorrect(options);
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <section className="algo-quiz">
      <p className="algo-quiz-q">
        <strong>{question}</strong>
      </p>
      {options.map((o, i) => (
        <button
          key={i}
          type="button"
          className={
            picked === null ? "algo-opt" : `algo-opt ${o.correct ? "right" : picked === i ? "wrong" : ""}`
          }
          onClick={() => setPicked(i)}
          disabled={picked !== null}
        >
          {o.label}
        </button>
      ))}
      {picked !== null && <p className="algo-quiz-why">{why}</p>}
    </section>
  );
}
