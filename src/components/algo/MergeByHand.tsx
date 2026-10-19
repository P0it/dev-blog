"use client";

import { useState } from "react";
import { MERGE_LEFT, MERGE_RIGHT, nextSide } from "@/lib/algo/merge-sort";
import { josa } from "@/lib/algo/josa";

export type MergeResult = {
  /** 새 줄에 내려놓은 횟수 */
  placed: number;
  /** 두 묶음의 맨 앞 카드를 견준 횟수(한쪽이 비면 견줄 필요가 없다) */
  compares: number;
  /** 틀린 카드를 누른 횟수 */
  wrong: number;
  /** 독자가 처음에 고른 예상 */
  guess: number;
};

/** 예상 선택지 — 정답(6)을 세 번째에 둬서 위치로 찍을 수 없게 한다. */
const PREDICT = [
  { n: 3, label: "3번 — 묶음마다 맨 앞 한 장씩만" },
  { n: 9, label: "9번 — 두 묶음의 카드를 서로 모두 견줘야 해서" },
  { n: 6, label: "6번 — 카드마다 한 번씩" },
] as const;

const TOTAL = MERGE_LEFT.length + MERGE_RIGHT.length;

/**
 * ① 직접 해 보기 — 이미 작은 수부터 서 있는 두 묶음을 하나의 줄로 합친다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. **먼저 예상을 고른다**(카드를 몇 번 내려놓아야 끝날까).
 * 누를 수 있는 카드는 각 묶음의 **맨 앞 카드**뿐이고, 둘 중 더 작은 쪽을 눌러야 새 줄로 내려간다.
 * 여기서 허용하는 동작이 곧 병합의 동작이라 ② 되짚기가 ① 을 반증하지 않는다. 틀린 쪽을 누르면 내려가지 않고 이유를 말한다.
 * 「처음부터」를 누르면 ② 도 다시 숨는다(`onDone(null)`).
 */
export function MergeByHand({ onDone }: { onDone?: (r: MergeResult | null) => void }) {
  const [guess, setGuess] = useState<number | null>(null);
  const [i, setI] = useState(0);
  const [j, setJ] = useState(0);
  const [out, setOut] = useState<number[]>([]);
  const [compares, setCompares] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const finished = out.length === TOTAL;
  const predicting = guess === null;

  const pick = (side: "left" | "right") => {
    if (predicting || finished) return;
    const want = nextSide(MERGE_LEFT, MERGE_RIGHT, i, j);
    const mine = side === "left" ? MERGE_LEFT[i] : MERGE_RIGHT[j];
    const other = side === "left" ? MERGE_RIGHT[j] : MERGE_LEFT[i];
    if (want !== side) {
      setWrong(wrong + 1);
      setMsg({
        ok: false,
        text: `${josa(mine, "은", "는")} 아직이에요. 맨 앞 두 장 중 더 작은 ${other} 부터 내려놓습니다. 뒤에 있는 카드는 맨 앞 카드보다 작을 수 없어요`,
      });
      return;
    }
    const bothHad = i < MERGE_LEFT.length && j < MERGE_RIGHT.length;
    const c = compares + (bothHad ? 1 : 0);
    const next = [...out, mine];
    setOut(next);
    setCompares(c);
    if (side === "left") setI(i + 1);
    else setJ(j + 1);
    setMsg({
      ok: true,
      text: bothHad
        ? `${josa(mine, "이", "가")} ${other} 보다 작아서 내려놓았습니다`
        : `다른 묶음이 비었습니다. ${josa(mine, "을", "를")} 그대로 내려놓습니다`,
    });
    if (next.length === TOTAL) onDone?.({ placed: next.length, compares: c, wrong, guess: guess! });
  };

  const reset = () => {
    setGuess(null);
    setI(0);
    setJ(0);
    setOut([]);
    setCompares(0);
    setWrong(0);
    setMsg(null);
    onDone?.(null);
  };

  const pile = (title: string, cards: number[], taken: number, side: "left" | "right") => (
    <div className="algo-merge-pile" role="group" aria-label={title}>
      <p className="algo-row-cap">{title}</p>
      <div className="algo-merge-pile-cards">
        {cards.map((v, k) => {
          const gone = k < taken;
          const front = k === taken && !finished;
          const live = front && !predicting;
          return (
            <button
              key={k}
              type="button"
              className={`algo-cell ${gone ? "algo-cell-out algo-cell-blank" : front ? "algo-cell-compare" : "algo-cell-waiting"}`}
              disabled={!live}
              onClick={() => pick(side)}
              aria-label={gone ? "내려놓은 카드" : front ? `맨 앞 카드 ${v}` : `뒤에 있는 카드 ${v}`}
            >
              <span className="algo-cell-value">{gone ? "·" : v}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="algo-byhand" aria-label="두 묶음을 하나의 줄로 합치기">
      <p className="algo-byhand-ask">
        {finished
          ? "새 줄이 왼쪽부터 작은 수 순서가 됐습니다"
          : predicting
            ? "카드 여섯 장이 두 묶음으로 서 있습니다. 두 묶음 모두 이미 작은 수부터 정렬돼 있습니다. 하나의 줄로 합치려면 카드를 몇 번 내려놓아야 할지 먼저 맞혀 보세요"
            : "누를 수 있는 카드는 각 묶음의 맨 앞 카드뿐입니다. 두 장 중 더 작은 카드를 눌러 새 줄에 내려놓으세요. 새 줄이 왼쪽부터 작은 수 순서가 되게 합니다"}
      </p>

      {predicting && (
        <div className="algo-merge-predict" role="group" aria-label="예상 고르기">
          {PREDICT.map((o) => (
            <button key={o.n} type="button" className="algo-opt" onClick={() => setGuess(o.n)}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="algo-merge-piles">
        {pile("왼쪽 묶음", MERGE_LEFT, i, "left")}
        {pile("오른쪽 묶음", MERGE_RIGHT, j, "right")}
      </div>

      <p className="algo-row-cap">새 줄 — 왼쪽이 가장 작게</p>
      <div className="algo-track-cells algo-merge-out">
        {out.length === 0 ? (
          <span className="algo-merge-hint">여기에 한 장씩 내려놓습니다</span>
        ) : (
          out.map((v, k) => (
            <div key={k} className={`algo-cell ${finished ? "algo-cell-settled" : "algo-cell-current"}`}>
              <span className="algo-cell-value">{v}</span>
            </div>
          ))
        )}
      </div>

      {msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          내려놓은 횟수 <b>{out.length}</b> · 틀리게 누른 횟수 <b>{wrong}</b>
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
