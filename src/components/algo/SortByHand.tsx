"use client";

import { useState } from "react";

const START = [5, 2, 9, 1, 7, 4];

/**
 * ① 직접 해 보기 — 칸 두 개를 눌러 자리를 바꿔 가며 손으로 정렬한다.
 *
 * 다 맞추고 나면 몇 번 바꿨는지 센 숫자가 뜬다. 그 숫자가 ②되짚기의 재료다.
 * 출퇴근길 한 손 조작이라 드래그가 아니라 **두 번 탭**으로 바꾼다.
 */
export function SortByHand({ onDone }: { onDone?: (swaps: number) => void }) {
  const [values, setValues] = useState(START);
  const [picked, setPicked] = useState<number | null>(null);
  const [swaps, setSwaps] = useState(0);

  const sorted = values.every((v, i) => i === 0 || values[i - 1] <= v);

  const tap = (i: number) => {
    if (sorted) return;
    if (picked === null) return setPicked(i);
    if (picked === i) return setPicked(null);

    const next = [...values];
    [next[picked], next[i]] = [next[i], next[picked]];
    const n = swaps + 1;
    setValues(next);
    setSwaps(n);
    setPicked(null);
    if (next.every((v, k) => k === 0 || next[k - 1] <= v)) onDone?.(n);
  };

  const reset = () => {
    setValues(START);
    setPicked(null);
    setSwaps(0);
  };

  return (
    <section className="algo-byhand" aria-label="손으로 정렬해 보기">
      <p className="algo-byhand-ask">
        {sorted ? "작은 수부터 늘어놓았습니다" : "두 칸을 눌러 자리를 바꿉니다"}
      </p>

      <div className="algo-track-cells">
        {values.map((v, i) => (
          <button
            key={i}
            type="button"
            onClick={() => tap(i)}
            className={`algo-cell ${sorted ? "algo-cell-settled" : picked === i ? "algo-cell-current" : "algo-cell-out"}`}
            aria-pressed={picked === i}
            disabled={sorted}
          >
            <span>{v}</span>
            <span className="algo-cell-index">{i}</span>
          </button>
        ))}
      </div>

      <div className="algo-byhand-foot">
        <span>
          바꾼 횟수 <b>{swaps}</b>
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
