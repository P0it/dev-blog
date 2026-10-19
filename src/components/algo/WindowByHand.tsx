"use client";

import { useState } from "react";
import { TEMPS, WINDOW_K, windowSums, maxWindowSum } from "@/lib/algo/sliding-window";
import { josa } from "@/lib/algo/josa";
import { cellClass } from "./cell-class";

const SUMS = windowSums(TEMPS, WINDOW_K);
const LAST = SUMS.length - 1;
const BEST = maxWindowSum(TEMPS, WINDOW_K);

type Move = { out: number; inn: number; from: number; to: number; correct: boolean; up: boolean };

/**
 * ① 직접 해 보기 — 열흘 기온에서 연속한 3일의 합이 가장 큰 때를 찾는다.
 *
 * 창은 **오른쪽으로 한 칸씩만** 밀린다(알고리즘이 하는 동작 그대로). 미는 버튼은 따로 없고,
 * 합이 오를지 내릴지 **먼저 고르면** 그 선택과 함께 창이 한 칸 간다.
 * 나갈 칸과 들어올 칸의 값이 보여서, 두 값을 견주면 답이 나온다 — 합을 다시 더할 필요가 없다는 걸 겪는다.
 * 알고리즘 용어도 타이핑도 없다.
 */
export function WindowByHand({ onDone }: { onDone?: (hits: number) => void }) {
  const [pos, setPos] = useState(0);
  const [hits, setHits] = useState(0);
  const [move, setMove] = useState<Move | null>(null);

  const done = pos >= LAST;
  const out = done ? null : pos;
  const inn = done ? null : pos + WINDOW_K;
  const bestSoFar = Math.max(...SUMS.slice(0, pos + 1));

  const guess = (up: boolean) => {
    if (done) return;
    const o = TEMPS[pos];
    const n = TEMPS[pos + WINDOW_K];
    const actualUp = n > o;
    const correct = up === actualUp;
    const h = hits + (correct ? 1 : 0);
    setHits(h);
    setMove({ out: o, inn: n, from: SUMS[pos], to: SUMS[pos + 1], correct, up: actualUp });
    setPos(pos + 1);
    if (pos + 1 >= LAST) onDone?.(h);
  };

  const reset = () => {
    setPos(0);
    setHits(0);
    setMove(null);
  };

  const state = (i: number) => {
    if (done) return i >= BEST.start && i < BEST.start + WINDOW_K ? "settled" : "out";
    if (i === inn) return "compare";
    return i >= pos && i < pos + WINDOW_K ? "current" : "out";
  };

  return (
    <section className="algo-byhand" aria-label="기온 열흘에서 가장 더운 연속 3일 찾기">
      <p className="algo-byhand-ask">
        {done ? (
          <>가장 큰 합을 찾았습니다</>
        ) : (
          <>
            열흘 동안의 기온입니다. <b>연속한 3일의 합이 가장 큰 때</b>를 찾습니다.
            <br />
            창을 오른쪽으로 한 칸씩 밉니다. 밀기 전에 합이 오를지 내릴지 고르세요.
          </>
        )}
      </p>

      <div className="algo-track" role="img" aria-label={`기온 열 칸. 3칸 창이 ${pos}번 칸에서 시작`}>
        <div className="algo-track-cells">
          {TEMPS.map((v, i) => (
            <div key={i} className={`algo-cell ${cellClass(state(i))}${i === out ? " algo-win-leave" : ""}`}>
              <span className="algo-cell-value">{v}</span>
              <span className="algo-cell-index">{i}</span>
            </div>
          ))}
        </div>
        <div className="algo-track-flags">
          {TEMPS.map((_, i) => (
            <span key={i} className="algo-flag">
              {i === out ? "나갈 칸" : i === inn ? "들어올 칸" : ""}
            </span>
          ))}
        </div>
      </div>

      <p className="algo-win-eq" aria-live="polite">
        {move ? (
          <>
            {move.from} <span className="algo-win-minus">− {move.out}</span> <span className="algo-win-plus">+ {move.inn}</span> = <b>{move.to}</b>
          </>
        ) : (
          <>
            처음 세 칸의 합 {TEMPS.slice(0, WINDOW_K).join(" + ")} = <b>{SUMS[0]}</b>
          </>
        )}
      </p>

      {move && (
        <p className="algo-win-fb" data-right={move.correct}>
          {move.correct ? "맞았습니다" : "아니었습니다"}. {josa(move.out, "을", "를")} 빼고 {josa(move.inn, "을", "를")} 더하니 합이 {move.up ? "올랐습니다" : "내렸습니다"}.
        </p>
      )}

      {done ? (
        <p className="algo-win-fb" data-right="true">
          가장 큰 합은 {BEST.best} 입니다. {BEST.start}번 칸부터 {WINDOW_K}칸입니다.
        </p>
      ) : (
        <div className="algo-win-choices" role="group" aria-label="합이 어떻게 될지 고르기">
          <button type="button" onClick={() => guess(true)}>
            합이 오른다
          </button>
          <button type="button" onClick={() => guess(false)}>
            합이 내린다
          </button>
        </div>
      )}

      <div className="algo-byhand-foot">
        <span>
          지금까지 가장 큰 합 <b>{bestSoFar}</b>
          <span className="algo-win-sub"> · 맞힌 횟수 {hits}/{pos}</span>
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
