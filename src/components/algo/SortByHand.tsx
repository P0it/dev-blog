"use client";

import { useState } from "react";
import { HAND_VALUES } from "@/lib/algo/bubble-sort";

/**
 * ① 직접 해 보기 — 키 순서로 서 보기. **바로 옆 칸끼리만** 자리를 바꿀 수 있다.
 *
 * 컴퓨터(버블 정렬)가 하는 일과 같은 규칙이라야 ② 가 거짓말이 안 된다. 아무 두 칸이나 바꾸게 하면
 * 2번에 끝나서 "컴퓨터는 옆칸만"이라는 ② 의 말과 어긋난다. 두 번 탭으로 바꾼다(드래그 ✗).
 * 다 맞추면 `onDone(바꾼 횟수)`, 처음부터를 누르면 `onDone(null)`.
 */
export function SortByHand({ onDone }: { onDone?: (swaps: number | null) => void }) {
  const [values, setValues] = useState(HAND_VALUES);
  const [picked, setPicked] = useState<number | null>(null);
  const [swaps, setSwaps] = useState(0);
  const [notice, setNotice] = useState("");

  const sorted = values.every((v, i) => i === 0 || values[i - 1] <= v);

  const tap = (i: number) => {
    if (sorted) return;
    if (picked === null) {
      setPicked(i);
      setNotice("");
      return;
    }
    if (picked === i) {
      setPicked(null);
      return;
    }
    if (Math.abs(picked - i) !== 1) {
      // 떨어진 칸은 못 바꾼다 — 새로 고른 칸으로 옮겨 주고 이유를 알린다
      setPicked(i);
      setNotice("옆 칸끼리만 바꿀 수 있어요. 바꿀 짝은 바로 옆 칸입니다.");
      return;
    }

    const next = [...values];
    [next[picked], next[i]] = [next[i], next[picked]];
    const n = swaps + 1;
    setValues(next);
    setSwaps(n);
    setPicked(null);
    setNotice("");
    if (next.every((v, k) => k === 0 || next[k - 1] <= v)) onDone?.(n);
  };

  const reset = () => {
    setValues(HAND_VALUES);
    setPicked(null);
    setSwaps(0);
    setNotice("");
    onDone?.(null);
  };

  return (
    <section className="algo-byhand" aria-label="키 순서로 서 보기">
      <p className="algo-byhand-ask">
        {sorted
          ? "왼쪽부터 작은 순서로 섰습니다"
          : "숫자는 키입니다. 왼쪽이 가장 작게 세워 보세요. 옆 칸끼리만 바꿀 수 있어요"}
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
          </button>
        ))}
      </div>

      <p className="algo-notice" role="status">
        {notice || " "}
      </p>

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
