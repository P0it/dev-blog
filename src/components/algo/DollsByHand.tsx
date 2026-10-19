"use client";

import type { ReactNode } from "react";
import { useState } from "react";

const N = 4;

type Guess = "box" | "marble" | "empty";

const GUESSES: { id: Guess; label: string }[] = [
  { id: "box", label: "또 다른 상자" },
  { id: "marble", label: "구슬만 있고 더 열 상자는 없다" },
  { id: "empty", label: "아무것도 없다" },
];

/**
 * ① 직접 해 보기 — 상자 안의 상자를 안쪽 끝까지 열고, 안쪽부터 하나씩 닫으며 구슬을 센다.
 *
 * 상자마다 구슬이 하나씩 들어 있다. 「이 상자 안의 구슬 모두 = 1 + 안쪽 상자의 구슬 모두」라
 * **닫을 때마다 안쪽 답이 먼저 정해져야 바깥 답을 알 수 있다.** 이 "돌아오며 계산이 이어진다"가
 * ④ 호출 탑에서 `n * factorial(n - 1)` 이 층을 걷으며 값을 곱하는 것과 같은 일이다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 처음에 맨 안쪽에 뭐가 있을지 예상을 고르고,
 * 버튼 하나가 열기에서 닫기로 바뀐다. 예상을 고르기 전에는 열기 버튼이 없고 이유를 적어 둔다.
 */
export function DollsByHand({ onDone }: { onDone?: (guessRight: boolean | null) => void }) {
  const [guess, setGuess] = useState<Guess | null>(null);
  const [depth, setDepth] = useState(0);
  const [closing, setClosing] = useState(false);
  const [totals, setTotals] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);

  const press = () => {
    if (done || guess === null) return;
    if (!closing) {
      const d = depth + 1;
      setDepth(d);
      if (d === N) setClosing(true);
      return;
    }
    // 가장 안쪽에 열려 있는 상자(깊이 depth)를 닫는다 — 안쪽 답이 있어야 바깥 답이 정해진다
    const level = depth;
    const total = 1 + (level === N ? 0 : (totals[level + 1] ?? 0));
    setTotals({ ...totals, [level]: total });
    setDepth(level - 1);
    if (level === 1) {
      setDone(true);
      onDone?.(guess === "marble");
    }
  };

  const reset = () => {
    setGuess(null);
    setDepth(0);
    setClosing(false);
    setTotals({});
    setDone(false);
    onDone?.(null);
  };

  const render = (lvl: number): ReactNode => {
    if (lvl > depth) {
      const t = totals[lvl];
      return (
        <div className="algo-box closed">
          상자 {lvl} · {t === undefined ? "닫혀 있음" : <b>닫음 · 구슬 모두 {t}개</b>}
        </div>
      );
    }
    // 안쪽 상자 답이 정해졌는지 — 정해져야 이 상자의 답을 더해서 구할 수 있다
    const innerTxt = lvl === N ? "0" : totals[lvl + 1] === undefined ? "?" : String(totals[lvl + 1]);
    const ready = innerTxt !== "?";
    return (
      <div className={`algo-box d${lvl % 4}`}>
        <span className="algo-box-label">상자 {lvl}</span>
        <div className="algo-box-own">
          <span className="algo-marble" role="img" aria-label="구슬 하나" />
          <span>이 상자의 구슬 1개</span>
        </div>
        {lvl === N ? <p className="algo-box-end">더 열 상자가 없습니다</p> : render(lvl + 1)}
        <p className={`algo-box-sum${ready ? " ready" : ""}`}>
          구슬 모두 = 1 + 안쪽 상자의 구슬 모두({innerTxt}) = <b>?</b>
        </p>
      </div>
    );
  };

  const chain = [N, N - 1, N - 2, N - 3].filter((l) => totals[l] !== undefined).map((l) => totals[l]);

  let ask: string;
  let button: string | null = null;
  if (guess === null) ask = "맨 안쪽 상자를 열면 무엇이 나올까요? 먼저 예상을 고르세요";
  else if (done) ask = "전부 닫았습니다. 상자 1 안의 구슬이 모두 몇 개인지 나왔습니다";
  else if (closing) {
    ask = "맨 안쪽에 닿았습니다. 안쪽 상자부터 하나씩 닫으세요. 닫을 때마다 그 상자의 구슬 수가 정해집니다";
    button = "가장 안쪽 상자 닫기";
  } else {
    ask = "상자 안에 상자가 들어 있습니다. 상자마다 구슬이 하나씩 있습니다. 상자 1 안의 구슬이 모두 몇 개인지 알아내세요";
    button = "안쪽 상자 열기";
  }

  return (
    <section className="algo-byhand" aria-label="상자 안의 상자 열고 닫기">
      <p className="algo-byhand-ask">{ask}</p>

      {guess === null && (
        <div className="algo-doll-guess" role="group" aria-label="맨 안쪽에 있을 것">
          {GUESSES.map((g) => (
            <button key={g.id} type="button" className="algo-pick" onClick={() => setGuess(g.id)}>
              <b>{g.label}</b>
            </button>
          ))}
        </div>
      )}

      {guess !== null && <div className="algo-dolls">{render(1)}</div>}

      <div className="algo-byhand-foot">
        <span>
          {chain.length > 0 ? (
            <>
              정해진 답 <b>{chain.join(" → ")}</b>
            </>
          ) : guess === null ? (
            "예상을 고르면 상자가 열립니다"
          ) : (
            "아직 정해진 답이 없습니다"
          )}
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          {!done && button && (
            <button type="button" className="algo-pick-go" onClick={press}>
              {button}
            </button>
          )}
          <button type="button" onClick={reset}>
            처음부터
          </button>
        </span>
      </div>
    </section>
  );
}
