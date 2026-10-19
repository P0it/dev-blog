"use client";

import { useState } from "react";
import { INSERT_CARDS, initHand, stepHand, handStage, type HandAction, type HandState } from "@/lib/algo/insertion-sort";
import { josa } from "@/lib/algo/josa";
import { StageInsert } from "./StageInsert";

export type InsertResult = {
  /** 카드끼리 견준 횟수 */
  compares: number;
  /** 카드를 민 횟수 */
  shifts: number;
  /** 네 번째 카드를 받았을 때 독자가 고른 예상(몇 번 밀까) */
  guess: number;
  /** 네 번째 카드가 실제로 민 횟수 */
  actual: number;
};

/** 예상을 거는 카드 — 네 번째로 받는 카드(칸 3). 손패 2 5 9 가 모두 1 보다 커서 세 번 민다. */
const PREDICT_AT = 3;

/** 예상 선택지 — 정답(3번)을 세 번째에 둬서 위치로 찍을 수 없게 한다. */
const GUESSES = [
  { v: 1, label: "1번" },
  { v: 2, label: "2번" },
  { v: 3, label: "3번" },
] as const;

/**
 * ① 직접 해 보기 — 카드를 한 장씩 받아 왼쪽 손패에 끼워 넣는다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 독자의 동작이 곧 삽입 정렬의 동작이다 —
 * 손에 든 카드를 빈자리 왼쪽 카드와 견줘서 **더 크면 한 칸 오른쪽으로 밀고**, 크지 않으면(또는 맨 앞이면) 그 자리에 놓는다.
 * 아무 자리에나 놓는 동작은 없다. 그래서 ② 되짚기가 ① 을 반증하지 않는다(버블 정렬 ① 의 실수).
 * 예상은 네 번째 카드 1 을 받는 순간에 건다 — 그때 손패 2 5 9 가 눈앞에 있어 근거를 보고 고를 수 있다.
 * 「처음부터」를 누르면 ② 도 다시 숨는다(`onDone(null)`).
 */
export function InsertByHand({ onDone }: { onDone?: (r: InsertResult | null) => void }) {
  const [hand, setHand] = useState<HandState>(() => initHand(INSERT_CARDS));
  const [guess, setGuess] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const predicting = !hand.done && hand.i === PREDICT_AT && guess === null;
  const key = hand.key;
  const left = hand.hole > 0 ? hand.slots[hand.hole - 1] : null;

  const act = (action: HandAction) => {
    const r = stepHand(hand, action);
    setMsg({ ok: r.ok, text: r.text });
    if (!r.ok) return;
    setHand(r.state);
    if (r.state.done) {
      onDone?.({
        compares: r.state.compares,
        shifts: r.state.shifts,
        guess: guess ?? 0,
        actual: r.state.perCard[PREDICT_AT - 1] ?? 0,
      });
    }
  };

  const reset = () => {
    setHand(initHand(INSERT_CARDS));
    setGuess(null);
    setMsg(null);
    onDone?.(null);
  };

  return (
    <section className="algo-byhand" aria-label="카드를 한 장씩 받아 손패에 끼워 넣기">
      <p className="algo-byhand-ask">
        {hand.done
          ? "왼쪽부터 작은 순서로 섰습니다"
          : "카드 여섯 장을 작은 수부터 왼쪽에 늘어놓습니다. 숫자는 키입니다. 한 장씩 받아 왼쪽 손패에 끼워 넣을 자리를 찾습니다"}
      </p>

      <StageInsert values={handStage(hand).values ?? []} state={handStage(hand)} />

      {predicting && (
        <div className="algo-insert-predict" role="group" aria-label="예상 고르기">
          <p className="algo-insert-ask">
            <strong>
              먼저 맞혀 보세요. 손에 든 카드는 {key}입니다. 맨 앞 빈자리에 들어가려면 손패의 카드를 몇 번 밀어야 할까요?
            </strong>
          </p>
          {GUESSES.map((g) => (
            <button key={g.v} type="button" className="algo-opt" onClick={() => setGuess(g.v)}>
              {g.label}
            </button>
          ))}
        </div>
      )}

      {!hand.done && !predicting && key !== null && (
        <>
          {guess !== null && hand.i === PREDICT_AT && (
            <p className="algo-insert-guess">
              내 예상 <b>{guess}번</b>
            </p>
          )}
          {left !== null && left !== undefined ? (
            <>
              <p className="algo-insert-ask">
                빈자리 왼쪽의 <b>{left}</b>{josa(left, "은", "는").slice(String(left).length)} 손에 든 <b>{key}</b>보다 큰가요?
              </p>
              <div className="algo-pairs-btns">
                <button type="button" onClick={() => act("bigger")}>
                  더 커요 — 한 칸 밀기
                </button>
                <button type="button" onClick={() => act("notBigger")}>
                  크지 않아요 — 여기에 놓기
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="algo-insert-ask">맨 앞까지 왔습니다. 더 견줄 카드가 없습니다.</p>
              <div className="algo-pairs-btns">
                <button type="button" className="algo-insert-go" onClick={() => act("front")}>
                  {josa(key, "을", "를")} 맨 앞에 놓기
                </button>
              </div>
            </>
          )}
        </>
      )}

      {msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          견줘 본 횟수 <b>{hand.compares}</b> · 민 횟수 <b>{hand.shifts}</b>
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
