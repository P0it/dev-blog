"use client";

import { useState } from "react";
import { lockCombos, PY_OPS_PER_SEC, secondsLabel } from "@/lib/algo/brute-force";

const DIGITS = [3, 4, 6, 10];

/**
 * ② 되짚기 — 자릿수를 바꿔 가며 경우의 수와 걸리는 시간을 본다.
 *
 * 사람은 1초에 한 번, 컴퓨터(파이썬)는 1초에 1천만 번으로 잡는다. 같은 일이 자릿수 하나에 열 배씩 불어난다.
 */
export function LockGrowth() {
  const [d, setD] = useState(3);
  const combos = lockCombos(d);
  const fmt = (n: number) => `${n.toLocaleString("ko-KR")}번`;
  const pcSec = combos / PY_OPS_PER_SEC;

  return (
    <section className="algo-growth" aria-label="자릿수에 따라 늘어나는 경우의 수">
      <div className="algo-growth-sizes" role="group" aria-label="자릿수 고르기">
        {DIGITS.map((n) => (
          <button key={n} type="button" aria-pressed={n === d} onClick={() => setD(n)}>
            {n}자리
          </button>
        ))}
      </div>

      <div className="algo-growth-row" data-ok="true">
        <span className="algo-growth-name">
          <b>경우의 수</b>
          <em>10 × 10 × …</em>
        </span>
        <span className="algo-growth-n">{combos.toLocaleString("ko-KR")}가지</span>
        <span className="algo-growth-time" />
      </div>
      <div className="algo-growth-row" data-ok="false">
        <span className="algo-growth-name">
          <b>사람</b>
          <em>1초에 한 번</em>
        </span>
        <span className="algo-growth-n">{fmt(combos)}</span>
        <span className="algo-growth-time">{secondsLabel(combos)}</span>
      </div>
      <div className="algo-growth-row" data-ok={pcSec <= 1}>
        <span className="algo-growth-name">
          <b>컴퓨터</b>
          <em>1초에 1천만 번</em>
        </span>
        <span className="algo-growth-n">{fmt(combos)}</span>
        <span className="algo-growth-time">{pcSec <= 1 ? `✔ ${secondsLabel(pcSec)}` : `✘ ${secondsLabel(pcSec)}`}</span>
      </div>
    </section>
  );
}
