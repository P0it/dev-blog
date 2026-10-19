"use client";

import { useState } from "react";
import { VISITS, QUESTIONS, prefixOf, handClicks } from "@/lib/algo/prefix-sum";

export type Guess = "hand" | "prefix" | "same";
export type RangeResult = { guess: Guess; hand: number; prefix: number };

type Phase = "predict" | "hand" | "prefix" | "done";

const PREFIX = prefixOf(VISITS);

const GUESS_LABEL: Record<Guess, string> = {
  hand: "칸을 하나씩 눌러 더하기",
  prefix: "깔아 둔 줄에서 두 칸만 눌러 빼기",
  same: "비슷할 것 같다",
};

/**
 * ① 직접 해 보기 — 같은 질문 셋을 두 방법으로 푼다. 손이 간 횟수를 센다.
 *
 * 먼저 어느 쪽이 덜 누를지 **예상을 건다**. 용어(누적합·prefix)와 타이핑은 없다.
 * 방법 A 는 구간의 칸을 하나씩 눌러 더하고, 방법 B 는 미리 깔린 줄에서 두 칸을 눌러 뺀다.
 * 질문은 화면에 적혀 있다. 세 번째 질문이 0번 칸부터라서 "앞에서 0칸 합 = 0" 이 실제로 쓰인다.
 */
export function RangeByHand({ onDone }: { onDone?: (r: RangeResult) => void }) {
  const [phase, setPhase] = useState<Phase>("predict");
  const [guess, setGuess] = useState<Guess | null>(null);
  const [q, setQ] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [handTotal, setHandTotal] = useState(0);
  const [preTotal, setPreTotal] = useState(0);
  const [msg, setMsg] = useState("");

  const [left, right] = QUESTIONS[q];
  const need = phase === "hand" ? handClicks(left, right) : 2;
  const qDone = (phase === "hand" || phase === "prefix") && picked.length === need;

  const clickCell = (i: number) => {
    if (phase !== "hand" || qDone || picked.includes(i)) return;
    if (i < left || i > right) {
      setMsg(`${i}번 칸은 이번 질문 밖입니다`);
      return;
    }
    setMsg("");
    setPicked([...picked, i]);
    setHandTotal(handTotal + 1);
  };

  // 깔아 둔 줄에서 필요한 두 칸: 끝 칸까지의 합(right+1)과, 시작 칸 앞까지의 합(left)
  const clickPrefix = (k: number) => {
    if (phase !== "prefix" || qDone || picked.includes(k)) return;
    if (k !== right + 1 && k !== left) {
      setMsg(`앞에서 ${k}칸 합은 이번 질문에 필요 없습니다`);
      return;
    }
    setMsg("");
    setPicked([...picked, k]);
    setPreTotal(preTotal + 1);
  };

  const next = () => {
    setPicked([]);
    setMsg("");
    if (q < QUESTIONS.length - 1) {
      setQ(q + 1);
    } else if (phase === "hand") {
      setPhase("prefix");
      setQ(0);
    } else {
      setPhase("done");
      onDone?.({ guess: guess ?? "same", hand: handTotal, prefix: preTotal });
    }
  };

  const reset = () => {
    setPhase("predict");
    setGuess(null);
    setQ(0);
    setPicked([]);
    setHandTotal(0);
    setPreTotal(0);
    setMsg("");
  };

  const handSum = picked.reduce((a, i) => a + VISITS[i], 0);
  const inRange = (i: number) => i >= left && i <= right;
  const showRange = phase === "hand" || phase === "prefix";
  const hint = phase === "prefix" ? (q === 0 ? "full" : q === 1 ? "half" : "none") : "none";

  return (
    <section className="algo-byhand algo-range" aria-label="같은 질문을 두 방법으로 풀어 보기">
      {phase === "predict" ? (
        <>
          <p className="algo-byhand-ask">
            하루하루 방문자 수가 10칸(0~9번)에 적혀 있습니다. 이런 질문 세 개를 풀 겁니다.
          </p>
          <ul className="algo-range-qs">
            {QUESTIONS.map(([l, r], k) => (
              <li key={k}>
                {l}번 칸부터 {r}번 칸까지의 합은?
              </li>
            ))}
          </ul>
          <p className="algo-byhand-ask">
            두 방법이 있습니다. 풀기 전에 골라 보세요. <b>어느 쪽이 덜 눌러도 될까요?</b>
          </p>
        </>
      ) : phase === "done" ? (
        <p className="algo-byhand-ask">세 질문을 두 방법으로 모두 풀었습니다</p>
      ) : (
        <>
          <p className="algo-byhand-ask">
            방법 {phase === "hand" ? "A — 칸을 하나씩 눌러 더하기" : "B — 깔아 둔 줄에서 두 칸만 눌러 빼기"} · 질문 {q + 1}/3
          </p>
          <p className="algo-range-q">
            {left}번 칸부터 {right}번 칸까지의 합은?
          </p>
        </>
      )}

      <p className="algo-row-cap">방문자 수</p>
      <div className="algo-track-cells">
        {VISITS.map((v, i) => {
          const on = showRange && inRange(i);
          const got = phase === "hand" && picked.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`algo-cell ${got ? "algo-cell-settled" : on ? "algo-cell-compare" : "algo-cell-out"}`}
              onClick={() => clickCell(i)}
              disabled={phase !== "hand" || qDone}
              aria-label={`${i}번 칸 ${v}`}
            >
              <span>{v}</span>
              <span className="algo-cell-index">{i}</span>
            </button>
          );
        })}
      </div>

      {phase !== "hand" && (
        <>
          <p className="algo-row-cap">미리 깔아 둔 줄 — 앞에서 k칸을 더한 값 (작은 숫자가 k)</p>
          <div className="algo-track-cells">
            {PREFIX.map((v, k) => {
              const got = phase === "prefix" && picked.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  className={`algo-cell ${got ? "algo-cell-settled" : "algo-cell-out"}`}
                  onClick={() => clickPrefix(k)}
                  disabled={phase !== "prefix" || qDone}
                  aria-label={`앞에서 ${k}칸 합 ${v}`}
                >
                  <span>{v}</span>
                  <span className="algo-cell-index">{k}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {phase === "predict" && (
        <>
          <p className="algo-range-note">
            깔아 둔 줄의 예: 앞에서 3칸 합 = 3 + 1 + 4 = 8. 두 칸을 빼면 그 사이 칸의 합이 나옵니다.
          </p>
          <div className="algo-guess" role="group" aria-label="어느 쪽이 덜 누를까">
            {(Object.keys(GUESS_LABEL) as Guess[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setGuess(g);
                  setPhase("hand");
                }}
              >
                {GUESS_LABEL[g]}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "hand" && (
        <p className="algo-range-note">
          {qDone
            ? `합은 ${handSum}. ${handClicks(left, right)}번 눌렀습니다.`
            : `구간 안의 칸을 눌러 더하세요. 지금까지 더한 값 ${handSum}`}
        </p>
      )}

      {phase === "prefix" && (
        <p className="algo-range-note">
          {qDone
            ? `${PREFIX[right + 1]} − ${PREFIX[left]} = ${PREFIX[right + 1] - PREFIX[left]}. 두 칸으로 끝났습니다.`
            : hint === "full"
              ? `합 = (앞에서 ${right + 1}칸 합) − (앞에서 ${left}칸 합). 이 두 칸을 누르세요.`
              : hint === "half"
                ? "앞에서 몇 칸 합 두 개를 뺄까요? 두 칸을 누르세요."
                : "두 칸을 눌러 보세요."}
        </p>
      )}

      {msg && <p className="algo-range-msg">{msg}</p>}

      <div className="algo-byhand-foot">
        <span>
          손이 간 횟수 <b>A {handTotal}</b> · <b>B {preTotal}</b>
        </span>
        <span className="algo-range-foot-btns">
          {qDone && (
            <button type="button" className="algo-pick-go" onClick={next}>
              {q < QUESTIONS.length - 1 ? "다음 질문" : phase === "hand" ? "방법 B 로" : "끝내기"}
            </button>
          )}
          <button type="button" onClick={reset}>
            처음부터
          </button>
        </span>
      </div>
    </section>
  );
}
