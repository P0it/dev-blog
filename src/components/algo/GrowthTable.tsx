"use client";

import { useState } from "react";
import { log10Ops, timeLabel, fitsInSecond, opsLabel, type Growth } from "@/lib/algo/big-o";

const SIZES = [10, 100, 1_000, 10_000, 100_000, 1_000_000];

const ROWS: { kind: Growth; label: string; note: string }[] = [
  { kind: "linear", label: "N", note: "한 번씩 훑기" },
  { kind: "nlogn", label: "N log N", note: "줄 세우기" },
  { kind: "square", label: "N²", note: "모두와 모두" },
  { kind: "exp", label: "2^N", note: "모든 경우" },
];

/**
 * ③ 조건 짚기 — N 을 바꿔 가며 어느 방법이 1초 안에 드는지 본다.
 *
 * 표가 아니라 직접 눌러 보는 것이다. 칸이 열 배가 될 때 어느 줄이 얼마나 튀는지를 몸으로 안다.
 */
export function GrowthTable() {
  const [n, setN] = useState(1_000);

  return (
    <section className="algo-growth" aria-label="N 에 따라 걸리는 횟수">
      <div className="algo-growth-sizes" role="group" aria-label="N 고르기">
        {SIZES.map((s) => (
          <button key={s} type="button" aria-pressed={s === n} onClick={() => setN(s)}>
            N = {s.toLocaleString("ko-KR")}
          </button>
        ))}
      </div>
      <p className="algo-growth-note">Python 은 1초에 약 1천만 번(보수적 기준)으로 셉니다. 1초를 넘으면 ✘ 와 걸리는 시간이 뜹니다.</p>

      {ROWS.map((r) => {
        const l = log10Ops(r.kind, n);
        const ok = fitsInSecond(l);
        return (
          <div key={r.kind} className="algo-growth-row" data-ok={ok}>
            <span className="algo-growth-name">
              <b>{r.label}</b>
              <em>{r.note}</em>
            </span>
            <span className="algo-growth-n">{opsLabel(l)}번</span>
            <span className="algo-growth-time">{ok ? "✔ 1초 안" : `✘ ${timeLabel(l)}`}</span>
          </div>
        );
      })}
    </section>
  );
}
