"use client";

import { useState } from "react";
import { HAND, PREDICT_OPTIONS, handRows, layout } from "@/lib/algo/gcd";
import { StageTiles } from "./StageTiles";

export type GcdResult = {
  /** 시작 전에 고른 예상 — 마지막에 남는 정사각형의 한 변 */
  guess: number;
  /** 실제로 마지막에 깐 정사각형의 한 변 */
  last: number;
};

type Msg = { ok: boolean; text: string };

/**
 * ① 직접 해 보기 — 48×18 바닥에 정사각형 타일만 빈틈없이 깐다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 허용 동작은 유클리드의 동작 그대로다: **지금 남은 바닥을 채울 수 있는 가장 큰
 * 정사각형**을 한 줄씩 고른다. 너무 많이 놓거나 바닥보다 큰 정사각형을 고르면 이유를 말한다. 시작 전에
 * "마지막에 남는 정사각형의 한 변"을 먼저 예상한다. 다 깔면 ② 되짚기가 열리고 「처음부터」는 ② 도 다시 숨긴다.
 */
export function GcdByHand({ onDone }: { onDone?: (r: GcdResult | null) => void }) {
  const rows = handRows();
  const L = layout(HAND.a, HAND.b);
  const [guess, setGuess] = useState<number | null>(null);
  const [row, setRow] = useState(0);
  const [msg, setMsg] = useState<Msg | null>(null);

  const finished = row >= rows.length;
  const placed = L.rounds.slice(0, row);
  const tiles = {
    w: L.w,
    h: L.h,
    squares: placed.flatMap((r) => r.squares),
    region: row === 0 ? { x: 0, y: 0, w: L.w, h: L.h } : (placed[row - 1].region ?? null),
    now: row,
  };

  const reset = () => {
    setGuess(null);
    setRow(0);
    setMsg(null);
    onDone?.(null);
  };

  const pick = (idx: number) => {
    const r = rows[row];
    const o = r.options[idx];
    if (!o.correct) {
      setMsg({ ok: false, text: o.reason });
      return;
    }
    const next = row + 1;
    setRow(next);
    if (next >= rows.length) {
      setMsg({ ok: true, text: `빈틈없이 다 깔았습니다. 마지막 정사각형은 한 변이 ${rows[rows.length - 1].s} 입니다` });
      onDone?.({ guess: guess ?? 0, last: rows[rows.length - 1].s });
    } else {
      setMsg({ ok: true, text: o.reason });
    }
  };

  return (
    <section className="algo-byhand" aria-label="바닥에 타일 깔아 보기">
      <p className="algo-byhand-ask">
        {guess === null
          ? `${HAND.a}×${HAND.b} 바닥에 정사각형 타일만 빈틈없이 깝니다. 먼저 맞혀 보세요. 마지막에 남는 정사각형은 한 변이 얼마일까요?`
          : finished
            ? "바닥을 모두 깔았습니다"
            : "지금 남은 바닥을 채울 수 있는 가장 큰 정사각형으로 한 줄씩 깝니다. 어떻게 깔지 고르세요."}
      </p>

      {guess === null ? (
        <div className="algo-gcd-predict" role="group" aria-label="예상 고르기">
          {PREDICT_OPTIONS.map((o) => (
            <button key={o.value} type="button" className="algo-opt" onClick={() => setGuess(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="algo-gcd-stage">
            <StageTiles state={{ cells: [], flags: {}, tiles }} />
          </div>

          {!finished && (
            <div className="algo-gcd-ask" role="group" aria-label="정사각형 고르기">
              <p>
                남은 바닥은 <b>{rows[row].region.w}×{rows[row].region.h}</b> 입니다. 어떻게 깔까요?
              </p>
              {rows[row].options.map((o, i) => (
                <button key={o.label} type="button" className="algo-opt" onClick={() => pick(i)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          {guess === null ? (
            "먼저 한 변을 예상합니다"
          ) : (
            <>
              깐 줄 <b>{row}</b> / {rows.length} · 내 예상 한 변 <b>{guess}</b>
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
