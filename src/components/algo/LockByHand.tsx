"use client";

import { useState } from "react";
import { LOCK_SECRET } from "@/lib/algo/brute-force";

/**
 * ① 직접 해 보기 — 세 자리 자물쇠를 한 칸씩 돌려 연다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 다이얼을 한 번 돌릴 때마다 시도 한 번으로 센다.
 * 어떤 순서로 돌릴지는 독자가 정한다 — 빠뜨리지 않는 순서를 스스로 찾는 것이 ②되짚기의 재료다.
 */
export function LockByHand({ onDone }: { onDone?: (tries: number) => void }) {
  const [dials, setDials] = useState([0, 0, 0]);
  const [tries, setTries] = useState(0);
  const [open, setOpen] = useState(false);

  const turn = (i: number, d: 1 | -1) => {
    if (open) return;
    const next = dials.map((v, k) => (k === i ? (v + d + 10) % 10 : v));
    const t = tries + 1;
    setDials(next);
    setTries(t);
    if (next.every((v, k) => v === LOCK_SECRET[k])) {
      setOpen(true);
      onDone?.(t);
    }
  };

  const reset = () => {
    setDials([0, 0, 0]);
    setTries(0);
    setOpen(false);
  };

  return (
    <section className="algo-byhand" aria-label="자물쇠 열어 보기">
      <p className="algo-byhand-ask">
        {open
          ? "열렸습니다"
          : "번호는 세 자리입니다. 한 칸씩 돌려서 열릴 때까지 해 보세요. 빠뜨리지 않는 순서를 직접 정해 보세요"}
      </p>

      <div className="algo-lock" data-open={open}>
        {dials.map((v, i) => (
          <div key={i} className="algo-dial">
            <button type="button" aria-label={`${i + 1}번째 칸 올리기`} onClick={() => turn(i, 1)} disabled={open}>
              ▲
            </button>
            <b aria-live="polite">{v}</b>
            <button type="button" aria-label={`${i + 1}번째 칸 내리기`} onClick={() => turn(i, -1)} disabled={open}>
              ▼
            </button>
          </div>
        ))}
      </div>

      <div className="algo-byhand-foot">
        <span>
          돌린 횟수 <b>{tries}</b>
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
