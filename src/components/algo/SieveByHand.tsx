"use client";

import { useState } from "react";
import { josa } from "@/lib/algo/josa";
import {
  SIEVE_N,
  initialErased,
  multiplesOf,
  pressNumber,
  primesUpTo,
  remainingCount,
  smallestOpen,
} from "@/lib/algo/sieve";

export type SieveResult = { remaining: number; guess: number; predicted: boolean; pressed: number[] };

const N = SIEVE_N;
const ACTUAL = primesUpTo(N).length;

/** 2·3·5·7 의 배수를 지우고 나면 몇 개가 남을까. 정답(17)은 첫 번째 — 한 쪽에 몰리지 않게 이 페이지의 다른 질문과 위치를 다르게 둔다. */
const PREDICT = [17, 15, 20];

/** 합성수 m 의 가장 작은 약수(소수) — 왜 지워졌는지 말해 줄 때 쓴다. */
const smallestFactor = (m: number) => {
  for (let d = 2; d * d <= m; d++) if (m % d === 0) return d;
  return m;
};

/**
 * ① 직접 해 보기 — 1~60 수 격자에서 지워지지 않은 가장 작은 수를 눌러 그 배수를 지운다.
 *
 * 알고리즘 용어가 없다('소수'도 ② 에서 처음 나온다). 타이핑도 없다. 누를 수 있는 건 **지워지지 않은 가장 작은 수**뿐이다 —
 * 여기서 허용하는 동작이 곧 체의 동작이라 ② 되짚기가 ① 을 반증하지 않는다. 더 큰 수를 누르면 이유가 나온다.
 * 먼저 **예측** 한 번을 한다. 2·3·5·7 을 누른 뒤 11 을 누르면 지울 게 없어서 끝난다 — 7 까지만 눌러도 됐다는 걸 겪는다.
 * ④ 플레이어와 같은 수 격자(1~60)를 쓴다. 끝나면 `onDone`, 처음부터를 누르면 `onReset`.
 */
export function SieveByHand({ onDone, onReset }: { onDone?: (r: SieveResult) => void; onReset?: () => void }) {
  const [guess, setGuess] = useState<number | null>(null);
  const [erased, setErased] = useState<boolean[]>(() => initialErased(N));
  const [picked, setPicked] = useState<number[]>([]);
  const [fresh, setFresh] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const [finished, setFinished] = useState(false);

  const remaining = remainingCount(erased, N);
  const erasedCount = N - 1 - remaining; // 2~N 중 지운 수

  const click = (m: number) => {
    if (guess === null) return setNotice("먼저 몇 개가 남을지 골라 주세요.");
    if (finished) return;
    if (m === 1) return setNotice("1 은 처음부터 지워져 있어요. 눌러도 달라지는 게 없어요.");
    if (erased[m]) {
      const f = smallestFactor(m);
      return setNotice(`이미 지워진 수예요. ${josa(m, "은", "는")} ${f}의 배수라서 지워졌어요. 지워지지 않은 수를 눌러 주세요.`);
    }
    if (picked.includes(m)) return setNotice("이미 눌러서 배수를 지운 수예요. 아직 안 누른 수를 눌러 주세요.");

    const pickedSet = new Set(picked);
    const next = smallestOpen(erased, pickedSet, N);
    if (next !== null && m !== next) {
      return setNotice(`더 작은 수 ${josa(next, "이", "가")} 아직 남았어요. 작은 수부터 눌러 주세요.`);
    }

    const res = pressNumber(erased, m, N);
    setErased(res.erased);
    const nextPicked = [...picked, m];
    setPicked(nextPicked);
    setFresh(res.fresh);

    if (res.fresh.length === 0) {
      const all = multiplesOf(m, N);
      const left = remainingCount(res.erased, N);
      setFinished(true);
      setNotice(
        `${all.length > 0 ? `${all.slice(0, -1).join(", ")}${all.length > 1 ? ", " : ""}${josa(all[all.length - 1], "은", "는")} 이미 모두 지워져 있어요. ` : `${m}의 배수는 ${N} 안에 없어요. `}더 눌러도 바뀌는 수가 없어서 여기서 끝입니다. 남은 수는 ${left}개예요.`,
      );
      onDone?.({ remaining: left, guess, predicted: guess === left, pressed: nextPicked });
      return;
    }

    const following = smallestOpen(res.erased, new Set(nextPicked), N);
    setNotice(
      `${m}의 배수 ${res.fresh.length}개를 지웠어요(${res.fresh.slice(0, 4).join(", ")}${res.fresh.length > 4 ? " …" : ""}).${
        following !== null ? ` 이제 지워지지 않은 가장 작은 수 ${josa(following, "을", "를")} 눌러 보세요.` : ""
      }`,
    );
  };

  const reset = () => {
    setGuess(null);
    setErased(initialErased(N));
    setPicked([]);
    setFresh([]);
    setNotice("");
    setFinished(false);
    onReset?.();
  };

  const ask =
    guess === null
      ? `1부터 ${N}까지 수가 있어요. 1 은 처음부터 지워져 있습니다. 2·3·5·7 의 배수를 지우고 나면 남는 수는 몇 개일까요?`
      : finished
        ? `내 예상 ${guess}개, 남은 수 ${remaining}개 — ${guess === remaining ? "맞았습니다" : "달랐습니다"}`
        : `목표: 1~${N} 에서 약수가 자기 자신과 1 뿐인 수만 남기기. 지워지지 않은 가장 작은 수를 눌러 그 배수를 지우세요`;

  const freshSet = new Set(fresh);

  return (
    <section className="algo-byhand" aria-label="수를 지워 가며 거르기">
      <p className="algo-byhand-ask">{ask}</p>

      {guess === null && (
        <div className="algo-guess" role="group" aria-label="몇 개가 남을까요?">
          {PREDICT.map((n) => (
            <button key={n} type="button" aria-pressed={guess === n} onClick={() => setGuess(n)}>
              {n}개
            </button>
          ))}
        </div>
      )}

      <div className="algo-sieve-grid">
        {Array.from({ length: N }, (_, k) => k + 1).map((m) => (
          <button
            key={m}
            type="button"
            className="algo-sieve-cell"
            data-state={erased[m] ? "erased" : "open"}
            data-picked={picked.includes(m) ? "" : undefined}
            data-fresh={freshSet.has(m) ? "" : undefined}
            onClick={() => click(m)}
            aria-label={
              erased[m] ? `${m}, 지워진 수` : picked.includes(m) ? `${m}, 눌러서 배수를 지운 수` : `${m}, 지워지지 않은 수`
            }
          >
            {m}
          </button>
        ))}
      </div>

      <p className="algo-notice" role="status">
        {notice || " "}
      </p>

      <div className="algo-byhand-foot">
        <span>
          지운 수 <b>{erasedCount}</b>개 · 남은 수 <b>{remaining}</b>개
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
