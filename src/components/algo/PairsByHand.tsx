"use client";

import { useState } from "react";
import { PAIR_CARDS, PAIR_TARGET, judge, explain, type Side } from "@/lib/algo/two-pointers";

export type PairsResult = { checks: number; wrong: number };

/**
 * ① 직접 해 보기 — 줄 선 카드에서 합이 목표인 두 장을 찾는다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 독자는 **양끝 두 장**만 볼 수 있고,
 * 합을 보고 어느 쪽 끝 카드를 버릴지 고른다. 아무 카드나 고르는 동작은 없다 —
 * 여기서 허용하는 동작이 곧 알고리즘의 동작이라 ②되짚기가 ①을 반증하지 않는다.
 * 틀린 쪽을 고르면 되돌리고 왜 틀렸는지 말한다.
 */
export function PairsByHand({ onDone }: { onDone?: (r: PairsResult) => void }) {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(PAIR_CARDS.length - 1);
  const [checks, setChecks] = useState(1);
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const verdict = judge(PAIR_CARDS, left, right, PAIR_TARGET);
  const total = PAIR_CARDS[left] + PAIR_CARDS[right];
  const found = verdict === "hit";

  const pick = (side: Side) => {
    if (found) return;
    const res = explain(PAIR_CARDS, left, right, PAIR_TARGET, side);
    setMsg(res);
    if (!res.ok) {
      setWrong(wrong + 1);
      return;
    }
    const l = side === "left" ? left + 1 : left;
    const r = side === "right" ? right - 1 : right;
    setLeft(l);
    setRight(r);
    const c = checks + 1;
    setChecks(c);
    if (judge(PAIR_CARDS, l, r, PAIR_TARGET) === "hit") onDone?.({ checks: c, wrong });
  };

  const reset = () => {
    setLeft(0);
    setRight(PAIR_CARDS.length - 1);
    setChecks(1);
    setWrong(0);
    setMsg(null);
  };

  return (
    <section className="algo-byhand" aria-label="합이 목표인 두 장 찾기">
      <p className="algo-byhand-ask">
        {found
          ? "찾았습니다"
          : `카드는 작은 수부터 줄을 섰습니다. 합이 ${PAIR_TARGET} 인 두 장을 찾으세요. 양끝 두 장의 합만 볼 수 있습니다`}
      </p>

      <p className="algo-pairs-target">
        목표 <b>{PAIR_TARGET}</b>
      </p>

      <div className="algo-track-cells">
        {PAIR_CARDS.map((v, i) => {
          const state =
            i < left || i > right
              ? "algo-cell-dropped"
              : found && (i === left || i === right)
                ? "algo-cell-settled"
                : i === left
                  ? "algo-cell-current"
                  : i === right
                    ? "algo-cell-compare"
                    : "algo-cell-out";
          return (
            <div key={i} className={`algo-cell ${state}`}>
              <span className="algo-cell-value">{v}</span>
            </div>
          );
        })}
      </div>
      <div className="algo-track-flags">
        {PAIR_CARDS.map((_, i) => (
          <span key={i} className="algo-flag">
            {i === left && i === right ? "" : i === left ? "왼쪽 끝" : i === right ? "오른쪽 끝" : ""}
          </span>
        ))}
      </div>

      <p className="algo-pairs-eq" aria-live="polite">
        {PAIR_CARDS[left]} + {PAIR_CARDS[right]} = <b>{total}</b>
        <span data-v={verdict}>
          {verdict === "hit" ? "목표와 같습니다" : verdict === "big" ? `목표 ${PAIR_TARGET} 보다 큽니다` : `목표 ${PAIR_TARGET} 보다 작습니다`}
        </span>
      </p>

      {!found && (
        <div className="algo-pairs-btns">
          <button type="button" onClick={() => pick("left")}>
            왼쪽 끝 카드 <b>{PAIR_CARDS[left]}</b> 버리기
          </button>
          <button type="button" onClick={() => pick("right")}>
            오른쪽 끝 카드 <b>{PAIR_CARDS[right]}</b> 버리기
          </button>
        </div>
      )}

      {msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          합을 본 횟수 <b>{checks}</b>
          {wrong > 0 && (
            <>
              {" "}
              · 잘못 고른 횟수 <b>{wrong}</b>
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
