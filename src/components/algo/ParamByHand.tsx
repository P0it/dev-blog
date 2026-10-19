"use client";

import { useState } from "react";
import {
  PILES,
  LIMIT_HOURS,
  canFinish,
  hoursFor,
  speedStatus,
  boundaryFound,
  trialMessage,
  trialHint,
  skipMessage,
  type Tried,
} from "@/lib/algo/parametric-search";

export type ParamResult = {
  /** 직접 해 본 속도의 수(첫 시도 포함) */
  tries: number;
  /** 속도 5 가 어떻게 될지 고른 예상. 맞췄으면 true */
  predicted: boolean;
  /** 고른 예상의 짧은 글 */
  guessLabel: string;
  /** 찾아낸 가장 느린 속도 */
  answer: number;
};

const MAX = Math.max(...PILES);
const SPEEDS = Array.from({ length: MAX }, (_, i) => i + 1);
/** 예상을 고르면 이 속도를 바로 해 본다. 첫 시도가 곧 예상의 답이다. */
const FIRST_TRY = 5;

/** 속도 5 가 어떻게 될지. 정답(딱 맞는다)을 세 번째에 둬서 위치로 찍을 수 없게 한다. */
const GUESS = [
  { label: `안 된다 — ${LIMIT_HOURS}시간이 넘는다`, short: "안 된다" },
  { label: "된다 — 시간이 남는다", short: "된다 · 시간이 남는다" },
  { label: `된다 — ${LIMIT_HOURS}시간에 딱 맞는다`, short: "된다 · 딱 맞는다", correct: true },
];

type Msg = { ok: boolean | "skip"; text: string };

/**
 * ① 직접 해 보기 — 속도를 골라 **되는지 안 되는지만** 확인하면서 가장 느린 속도를 찾는다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 눌러서 알 수 있는 건 "8시간 안에 되나"뿐이라, 여기서 허용하는 동작이
 * ④ 의 can_finish 가 하는 일과 같다. 한 번 해 보면 해 보지 않아도 아는 속도가 칠해진다(되는 속도보다 빠른 쪽,
 * 안 되는 속도보다 느린 쪽) — 독자가 ③ 의 "한 번만 바뀐다"를 겪는다. 그 칸을 눌러도 이유가 나온다.
 * 처음부터를 누르면 ② 도 다시 숨는다(`onDone(null)`).
 */
export function ParamByHand({ onDone }: { onDone?: (r: ParamResult | null) => void }) {
  const [guess, setGuess] = useState<number | null>(null);
  const [tried, setTried] = useState<Tried>({});
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState<Msg | null>(null);

  const found = boundaryFound(tried);
  const finished = found !== null;

  const choose = (i: number) => {
    const t: Tried = { [FIRST_TRY]: canFinish(PILES, FIRST_TRY, LIMIT_HOURS) };
    setGuess(i);
    setTried(t);
    setTries(1);
    setMsg({ ok: t[FIRST_TRY], text: `${trialMessage(PILES, FIRST_TRY, LIMIT_HOURS)}. ${trialHint(t, FIRST_TRY, MAX)}` });
  };

  const pick = (speed: number) => {
    if (guess === null || finished) return;
    const st = speedStatus(tried, speed);
    if (st && !st.direct) {
      setMsg({ ok: "skip", text: skipMessage(tried, speed) });
      return;
    }
    if (st) {
      setMsg({ ok: "skip", text: "이미 해 본 속도입니다" });
      return;
    }
    const ok = canFinish(PILES, speed, LIMIT_HOURS);
    const t: Tried = { ...tried, [speed]: ok };
    const n = tries + 1;
    setTried(t);
    setTries(n);
    const b = boundaryFound(t);
    setMsg({
      ok,
      text: `${trialMessage(PILES, speed, LIMIT_HOURS)}. ${b === null ? trialHint(t, speed, MAX) : `가장 느린 속도는 ${b}입니다.`}`,
    });
    if (b !== null) {
      const g = GUESS[guess];
      onDone?.({ tries: n, predicted: g.correct === true, guessLabel: g.short, answer: b });
    }
  };

  const reset = () => {
    setGuess(null);
    setTried({});
    setTries(0);
    setMsg(null);
    onDone?.(null);
  };

  const ask = finished
    ? "가장 느린 속도를 찾았습니다"
    : guess === null
      ? `한 시간에 한 더미만 먹고, 남아도 그 시간은 끝납니다. 먼저 맞혀 보세요. 한 시간에 ${FIRST_TRY}개씩 먹으면 ${LIMIT_HOURS}시간 안에 다 먹을 수 있을까요?`
      : `목표: ${LIMIT_HOURS}시간 안에 다 먹을 수 있는 가장 느린 속도를 되도록 적게 시험해서 찾기. 속도를 눌러 보세요`;

  return (
    <section className="algo-byhand" aria-label="바나나를 먹는 속도 고르기">
      <p className="algo-byhand-ask">{ask}</p>

      <div className="algo-param-piles" role="img" aria-label={`바나나 더미 ${PILES.join(", ")}개`}>
        <span className="algo-param-label">바나나 더미</span>
        {PILES.map((p, i) => (
          <span key={i} className="algo-cell algo-cell-out">
            <span className="algo-cell-value">{p}</span>
          </span>
        ))}
        <span className="algo-param-label">개 · 제한 {LIMIT_HOURS}시간</span>
      </div>

      {guess === null ? (
        <div className="algo-param-predict" role="group" aria-label="예상 고르기">
          {GUESS.map((g, i) => (
            <button key={i} type="button" className="algo-opt" onClick={() => choose(i)}>
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className="algo-param-guess">
            내 예상 <b>{GUESS[guess].short}</b>
          </p>
          <div className="algo-param-speeds" role="group" aria-label="한 시간에 먹는 개수(속도)">
            {SPEEDS.map((s) => {
              const st = speedStatus(tried, s);
              const state = st ? (st.ok ? (st.direct ? "ok" : "ok-soft") : st.direct ? "no" : "no-soft") : "unk";
              return (
                <button
                  key={s}
                  type="button"
                  className="algo-param-speed"
                  data-st={state}
                  disabled={finished}
                  aria-label={`속도 ${s}`}
                  onClick={() => pick(s)}
                >
                  <b>{s}</b>
                  <i>
                    {state === "unk"
                      ? "?"
                      : st!.direct
                        ? `${st!.ok ? "✔" : "✘"} ${hoursFor(PILES, s)}시간`
                        : st!.ok
                          ? "✔"
                          : "✘"}
                  </i>
                </button>
              );
            })}
          </div>
          <p className="algo-param-note">칸 아래 글자가 흐리면 해 보지 않아도 아는 속도입니다</p>
        </>
      )}

      {msg && (
        <p className="algo-pairs-msg" data-ok={String(msg.ok)} role="status">
          {msg.ok === true ? "✔ " : msg.ok === false ? "✘ " : ""}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          시험해 본 횟수 <b>{tries}</b>
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
