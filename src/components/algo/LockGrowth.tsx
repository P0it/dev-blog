"use client";

import { useState } from "react";
import { lockCombos, lockLog10 } from "@/lib/algo/brute-force";
import { timeLabel, opsLabel } from "@/lib/algo/big-o";

const DIGITS = [3, 4, 6, 10];

/**
 * ② 되짚기 — 자릿수를 바꿔 가며 경우의 수와 걸리는 시간을 본다.
 *
 * 사람은 1초에 한 번, 컴퓨터는 1초에 1억 번. 같은 일이 자릿수 하나에 열 배씩 불어난다.
 */
export function LockGrowth() {
  const [d, setD] = useState(3);
  const l = lockLog10(d);

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
        <span className="algo-growth-n">{lockCombos(d).toLocaleString("ko-KR")}가지</span>
        <span className="algo-growth-time" />
      </div>
      <div className="algo-growth-row" data-ok="false">
        <span className="algo-growth-name">
          <b>사람</b>
          <em>1초에 한 번</em>
        </span>
        <span className="algo-growth-n">{opsLabel(l)}번</span>
        <span className="algo-growth-time">{timeLabel(l + 8)}</span>
      </div>
      <div className="algo-growth-row" data-ok={d <= 8}>
        <span className="algo-growth-name">
          <b>컴퓨터</b>
          <em>1초에 1억 번</em>
        </span>
        <span className="algo-growth-n">{opsLabel(l)}번</span>
        <span className="algo-growth-time">{d <= 8 ? `✔ ${timeLabel(l)}` : `✘ ${timeLabel(l)}`}</span>
      </div>
    </section>
  );
}
