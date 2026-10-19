"use client";

import { useState } from "react";
import { BOUND_ARR, explainGap, gapAnswer, type BoundVariant } from "@/lib/algo/bisect-bounds";
import { josa } from "@/lib/algo/josa";

export type BoundResult = {
  /** 틈을 누른 횟수(틀린 것 포함) */
  presses: number;
  /** 틀리게 누른 횟수 */
  wrong: number;
  /** 4 의 두 틈이 같을지 다를지 고른 예상. 맞췄으면 true */
  predicted: boolean;
  /** 고른 예상의 글 */
  guessLabel: string;
};

/** 풀 문제 네 개. 2 는 셋 붙어 있어 시작 틈과 끝 틈이 다르고, 4 는 줄에 없어 두 틈이 한 자리다. */
const TASKS: { x: number; kind: BoundVariant }[] = [
  { x: 2, kind: "left" },
  { x: 2, kind: "right" },
  { x: 4, kind: "left" },
  { x: 4, kind: "right" },
];

/** 4 의 두 틈이 같을지 묻는 예상. 정답(같다)을 세 번째에 둬서 위치로 찍을 수 없게 한다. */
const GUESS = [
  { label: "다르다 — 4 가 있으면 앞뒤로 두 틈이 생기니까" },
  { label: "알 수 없다 — 줄에 4 가 없으니 틈도 없다" },
  { label: "같다 — 4 가 들어갈 자리는 한 곳뿐이다", correct: true },
];

/** 숫자 뒤 조사만 돌려준다. 이 탭은 `숫자 조사` 를 띄워 쓰므로(`2 는`) 숫자는 따로 적는다. */
const p = (n: number, withBatchim: string, without: string) => josa(n, withBatchim, without).slice(String(n).length);

/**
 * ① 직접 해 보기 — 줄 선 카드에서 **칸 사이의 틈**을 눌러 같은 값 덩어리의 시작과 끝을 찾는다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 카드가 아니라 틈(0~6번)을 누른다 — 같은 값이 여러 개여도
 * "틈 두 개"로 경계가 정해지기 때문이다. 틈 하나를 고를 때마다 맞는지 판정하고, 틀리면 그 틈 바로 옆
 * 카드 값으로 이유를 말한다. 여기서 허용하는 동작(경계 틈을 고르는 것)이 곧 ④ 의 lo·hi 가 찾는 것이라
 * ② 되짚기가 ① 을 반증하지 않는다. 처음부터를 누르면 ② 도 다시 숨는다(`onDone(null)`).
 *
 * 순서: 2 의 시작 틈 → 2 의 끝 틈 → (예상 한 번) → 줄에 없는 4 의 시작 틈 → 4 의 끝 틈.
 */
export function BoundByHand({ onDone }: { onDone?: (r: BoundResult | null) => void }) {
  const [step, setStep] = useState(0);
  const [marks, setMarks] = useState<{ L: number | null; R: number | null }>({ L: null, R: null });
  const [guess, setGuess] = useState<number | null>(null);
  const [presses, setPresses] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const needGuess = step === 2 && guess === null;
  const done = step >= TASKS.length;
  const task = TASKS[Math.min(step, TASKS.length - 1)];
  const n = BOUND_ARR.length;

  const pick = (g: number) => {
    if (needGuess || done) return;
    const res = explainGap(BOUND_ARR, task.x, task.kind, g);
    setMsg(res);
    setPresses(presses + 1);
    if (!res.ok) {
      setWrong(wrong + 1);
      return;
    }
    setMarks((m) => (task.kind === "left" ? { ...m, L: g } : { ...m, R: g }));
    const next = step + 1;
    setStep(next);
    if (next >= TASKS.length) {
      const g2 = GUESS[guess ?? 0];
      onDone?.({ presses: presses + 1, wrong, predicted: g2.correct === true, guessLabel: g2.label.split(" — ")[0] });
    }
  };

  const choose = (i: number) => {
    setGuess(i);
    setMarks({ L: null, R: null });
    setMsg(null);
  };

  const reset = () => {
    setStep(0);
    setMarks({ L: null, R: null });
    setGuess(null);
    setPresses(0);
    setWrong(0);
    setMsg(null);
    onDone?.(null);
  };

  const ask = done
    ? "두 값의 틈을 모두 찾았습니다"
    : needGuess
      ? "먼저 맞혀 보세요. 이번에는 줄에 없는 값 4 를 찾습니다. 4 의 시작 틈과 끝 틈은 같은 자리일까요?"
      : step < 2
        ? `칸 사이에 틈 번호가 붙어 있습니다. 목표: ${task.x} ${p(task.x, "이", "가")} 몇 장인지 세지 말고 틈 두 개로 알아내기. ${task.x} 묶음이 ${task.kind === "left" ? "시작되는" : "끝나는"} 틈을 누르세요`
        : `이번에는 줄에 없는 ${task.x} ${p(task.x, "을", "를")} 찾습니다. ${task.x} ${p(task.x, "이", "가")} ${task.kind === "left" ? "들어갈 수 있는 가장 앞" : "들어갈 수 있는 가장 뒤"} 틈을 누르세요`;

  // 지금 풀고 있는 값의 카드를 켠다. 줄에 없으면 아무 카드도 안 켜진다(없다는 걸 눈으로 확인)
  const lit = (v: number) => !done && !needGuess && v === task.x;

  const L2 = step >= 2 ? gapAnswer(BOUND_ARR, 2, "left") : null;
  const R2 = step >= 2 ? gapAnswer(BOUND_ARR, 2, "right") : null;

  return (
    <section className="algo-byhand" aria-label="같은 값 덩어리의 시작과 끝 틈 찾기">
      <p className="algo-byhand-ask">{ask}</p>

      <div className="algo-bound-row" role="group" aria-label="카드와 틈">
        {Array.from({ length: n + 1 }, (_, g) => (
          <span key={g} className="algo-bound-pair">
            <button
              type="button"
              className="algo-bound-gap"
              aria-label={`${g}번 틈`}
              data-k={marks.L === g ? "L" : marks.R === g ? "R" : undefined}
              disabled={needGuess || done}
              onClick={() => pick(g)}
            >
              <i className="mk" data-k={marks.L === g ? "L" : marks.R === g ? "R" : undefined}>
                {marks.L === g && marks.R === g ? "LR" : marks.L === g ? "L" : marks.R === g ? "R" : ""}
              </i>
              <span className="bar" />
              <b>{g}</b>
            </button>
            {g < n && (
              <span className={`algo-cell ${lit(BOUND_ARR[g]) ? "algo-cell-settled" : "algo-cell-out"}`}>
                <span className="algo-cell-value">{BOUND_ARR[g]}</span>
              </span>
            )}
          </span>
        ))}
      </div>

      {!needGuess && !done && (
        <p className="algo-bound-want">
          지금 찾는 값 <b>{task.x}</b> · {task.kind === "left" ? "시작 틈(L)" : "끝 틈(R)"}
        </p>
      )}

      {needGuess && (
        <div className="algo-bound-predict" role="group" aria-label="예상 고르기">
          {GUESS.map((g, i) => (
            <button key={i} type="button" className="algo-opt" onClick={() => choose(i)}>
              {g.label}
            </button>
          ))}
        </div>
      )}

      {step >= 2 && L2 !== null && R2 !== null && (
        <p className="algo-bound-eq">
          2 를 세지 않고 얻은 개수: 끝 틈 <b>{R2}</b> − 시작 틈 <b>{L2}</b> = <b>{R2 - L2}장</b>
        </p>
      )}

      {msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          틈을 누른 횟수 <b>{presses}</b>
          {wrong > 0 && (
            <>
              {" "}
              · 틀린 횟수 <b>{wrong}</b>
            </>
          )}
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
