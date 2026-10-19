"use client";

import { useState } from "react";
import {
  GRAPH,
  NAMES,
  START,
  TARGET,
  initialState,
  pickCheck,
  confirmNode,
  stageFromHand,
  type HandState,
} from "@/lib/algo/dijkstra";
import { StageGraph } from "./StageGraph";

export type DijkResult = {
  /** 독자가 처음에 고른 예상(GUESSES 의 번호) */
  guess: number;
  /** 예상이 맞았는지 */
  predicted: boolean;
  /** 도착지까지 확정된 가장 빠른 시간(분) */
  time: number;
  /** 확정한 곳 수 */
  confirmed: number;
};

/** 예상 선택지 — 정답(다를 수 있다)이 첫 번째·두 번째가 아니라 위치로 찍을 수 없다. */
export const GUESSES = [
  { short: "알 수 없다", label: "알 수 없다 — 지도를 다 봐야 안다" },
  { short: "같다", label: "같다 — 걸음이 가장 적은 길이 곧 가장 빠른 길" },
  { short: "다를 수 있다", label: "다를 수 있다 — 걸음은 적어도 오래 걸리는 길이 있다", correct: true },
] as const;

const minutes = (d: number | null) => (d === null ? "∞" : `${d}분`);

/**
 * ① 직접 해 보기 — 가장 가까운 곳부터 눌러 확정하며 S 에서 E 까지 가장 빠른 시간을 찾는다.
 *
 * 알고리즘 용어가 없고 타이핑도 없다. **먼저 예상을 고른다**(걸음이 가장 적은 길이 가장 빠른 길일까).
 * 허용하는 동작은 다익스트라의 동작 그대로다 — 길을 아는 곳 중 **가장 가까운 곳 하나만** 확정할 수 있고, 확정하면 이어진 길로
 * 이웃의 시간을 **더 짧을 때만** 고쳐 적는다. 더 먼 곳을 누르면 이유를 말한다. 그래서 ② 되짚기가 ① 을 반증하지 않는다.
 * 처음부터를 누르면 ② 도 다시 숨는다(`onReset`).
 */
export function DijkByHand({ onDone, onReset }: { onDone?: (r: DijkResult) => void; onReset?: () => void }) {
  const [guess, setGuess] = useState<number | null>(null);
  const [hand, setHand] = useState<HandState>(() => initialState());
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const confirmedCount = hand.confirmed.filter(Boolean).length;
  const targetIdx = NAMES.indexOf(TARGET);

  const pick = (i: number) => {
    if (guess === null || done) return;
    const check = pickCheck(hand, i);
    if (!check.ok) {
      if (check.reason === "done") {
        setMsg({ ok: false, text: "이미 확정한 곳이에요. 아직 확정하지 않은 곳을 눌러 보세요" });
      } else if (check.reason === "unknown") {
        setMsg({
          ok: false,
          text: "아직 가는 길을 모르는 곳이에요. 확정한 곳에서 이어진 길이 닿아야 시간을 알 수 있어요",
        });
      } else {
        setMsg({
          ok: false,
          text: `가장 가까운 곳은 ${NAMES[check.closest.idx]} (${check.closest.d}분)입니다. 더 가까운 곳을 먼저 확정해야, 그곳을 거쳐 더 짧게 오는 길이 있는지 볼 수 있어요`,
        });
      }
      return;
    }

    const r = confirmNode(hand, i);
    setHand(r.state);
    const time = r.state.dist[i] as number;
    const fixed = r.changes.length
      ? `이웃의 시간을 고쳤어요 — ${r.changes.map((c) => `${NAMES[c.to]} ${minutes(c.from)} → ${minutes(c.time)}`).join(", ")}`
      : "고칠 이웃이 없어요";
    if (i === targetIdx) {
      setDone(true);
      setMsg({ ok: true, text: `${NAMES[i]} 확정: ${time}분. ${START}에서 ${TARGET}까지 가장 빠른 시간은 ${time}분입니다` });
      const g = GUESSES[guess];
      onDone?.({
        guess,
        predicted: "correct" in g && g.correct === true,
        time,
        confirmed: r.state.confirmed.filter(Boolean).length,
      });
    } else {
      setMsg({ ok: true, text: `${NAMES[i]} 확정: ${time}분. ${fixed}` });
    }
  };

  const reset = () => {
    setGuess(null);
    setHand(initialState());
    setDone(false);
    setMsg(null);
    onReset?.();
  };

  return (
    <section className="algo-byhand" aria-label="지도에서 가장 빠른 시간 찾아 보기">
      <p className="algo-byhand-ask">
        출발지 <b>{START}</b> 에서 가게 <b>{TARGET}</b> 까지 가장 빠르게 가는 시간을 찾습니다.
        <br />
        지도의 숫자는 길마다 걸리는 시간(분)이고, 곳 옆의 숫자는 지금까지 알려진 가장 빠른 시간입니다.
      </p>

      <StageGraph state={stageFromHand(hand, GRAPH)} onPick={guess !== null && !done ? pick : undefined} />

      {guess === null ? (
        <div className="algo-dijk-predict" role="group" aria-label="예상 고르기">
          <p className="algo-byhand-ask">
            <b>거치는 길이 가장 적은 길이 가장 빠른 길일까요?</b> 먼저 골라 보세요.
          </p>
          <div className="algo-pairs-btns">
            {GUESSES.map((g, k) => (
              <button key={k} type="button" onClick={() => setGuess(k)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="algo-dijk-guess">
          내 예상 <b>{GUESSES[guess].short}</b>
          {!done && (
            <>
              {" "}
              · 아직 확정하지 않은 곳 중 <b>가장 가까운 곳</b>을 눌러 확정하세요
            </>
          )}
        </p>
      )}

      {msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          확정한 곳 <b>{confirmedCount}</b>곳
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
