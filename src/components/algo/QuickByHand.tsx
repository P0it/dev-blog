"use client";

import { useState } from "react";
import { QUICK_CARDS, QUICK_SORTED, isSmallerThanPivot } from "@/lib/algo/quick-sort";
import { josa } from "@/lib/algo/josa";

export type QuickResult = {
  /** 왼쪽(기준보다 작은) 묶음에 모인 카드 수 */
  left: number;
  /** 오른쪽 묶음에 모인 카드 수 */
  right: number;
  /** 독자가 처음에 고른 예상(왼쪽 장수). 정렬된 카드로 해 본 경우는 null */
  guess: number | null;
  /** 기준 카드 */
  pivot: number;
  /** 이미 정렬된 카드로 시작했는가 */
  sortedStart: boolean;
};

type Phase = "predict" | "sort" | "place" | "done";

/** 예상 선택지 — 정답(4장)을 세 번째에 둬서 위치로 찍을 수 없게 한다. */
const GUESSES = [{ v: 2 }, { v: 3 }, { v: 4 }] as const;

/** 숫자 뒤 조사만 돌려준다. 이 탭은 `숫자 조사` 를 띄워 쓰므로(`6 은`) 숫자는 따로 적는다. */
const p = (n: number, withBatchim: string, without: string) => josa(n, withBatchim, without).slice(String(n).length);

/**
 * ① 직접 해 보기 — 기준 카드 하나를 두고 나머지 카드를 왼쪽·오른쪽 묶음으로 가른다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. **먼저 예상을 고른다**(왼쪽에 몇 장이 모일까).
 * 기준은 늘 맨 앞 카드이고, 카드를 한 장씩 보며 "기준보다 작다 → 왼쪽 / 크다 → 오른쪽" 을 독자가 판정한다.
 * 아무 카드나 아무 쪽에 넣는 동작은 없다 — 여기서 허용하는 동작이 곧 분할의 동작이라 ② 되짚기가 ① 을 반증하지 않는다.
 * 「이미 정렬된 카드로 해 보기」는 ③ 이 끌어낼 사실(기준이 가장 작으면 왼쪽이 늘 빈다)을 몸으로 겪게 한다.
 * 처음부터·다시 시작을 누르면 ② 도 다시 숨는다(`onDone(null)`).
 */
export function QuickByHand({ onDone }: { onDone?: (r: QuickResult | null) => void }) {
  const [cards, setCards] = useState<number[]>(QUICK_CARDS);
  const [phase, setPhase] = useState<Phase>("predict");
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState<number[]>([]);
  const [right, setRight] = useState<number[]>([]);
  const [guess, setGuess] = useState<number | null>(null);
  const [sortedStart, setSortedStart] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const pivot = cards[0];
  const rest = cards.slice(1);
  const card = rest[idx];

  const start = (sorted: boolean) => {
    setCards(sorted ? QUICK_SORTED : QUICK_CARDS);
    setPhase(sorted ? "sort" : "predict");
    setIdx(0);
    setLeft([]);
    setRight([]);
    setGuess(null);
    setSortedStart(sorted);
    setMsg(null);
    onDone?.(null);
  };

  const choose = (v: number) => {
    setGuess(v);
    setPhase("sort");
  };

  /** 보는 카드를 어느 쪽에 넣을지 독자가 판정한다. 틀리면 이유를 말하고 그대로 둔다. */
  const judge = (side: "left" | "right") => {
    const truth = isSmallerThanPivot(card, pivot) ? "left" : "right";
    if (side !== truth) {
      setMsg({
        ok: false,
        text:
          truth === "left"
            ? `${card}${p(card, "은", "는")} 기준 ${pivot}보다 작아요. 작은 카드는 왼쪽 묶음으로 갑니다`
            : `${card}${p(card, "은", "는")} 기준 ${pivot}보다 작지 않아요. 큰 카드는 오른쪽 묶음으로 갑니다`,
      });
      return;
    }
    setMsg({
      ok: true,
      text: `${card}${p(card, "을", "를")} ${side === "left" ? "왼쪽" : "오른쪽"} 묶음에 넣었습니다`,
    });
    if (side === "left") setLeft([...left, card]);
    else setRight([...right, card]);
    const next = idx + 1;
    setIdx(next);
    if (next >= rest.length) setPhase("place");
  };

  /** 기준 카드를 두 묶음 사이에 놓는다 — 이 칸이 기준 카드의 제자리다. */
  const place = () => {
    setPhase("done");
    setMsg({
      ok: true,
      text: `기준 ${pivot}${p(pivot, "은", "는")} ${left.length}번 칸에 자리가 정해졌습니다`,
    });
    onDone?.({ left: left.length, right: right.length, guess: sortedStart ? null : guess, pivot, sortedStart });
  };

  const sorting = phase === "sort";
  const placing = phase === "place";
  const done = phase === "done";

  return (
    <section className="algo-byhand" aria-label="기준 카드로 좌우를 가르기">
      <p className="algo-byhand-ask">
        {done
          ? "기준 카드가 두 묶음 사이에 놓였습니다"
          : phase === "predict"
            ? `맨 앞 카드 ${pivot}${p(pivot, "을", "를")} 기준으로 잡습니다. 먼저 맞혀 보세요. 기준보다 작은 카드는 왼쪽 묶음에 몇 장 모일까요?`
            : `기준 카드 ${pivot}. 나머지 카드를 한 장씩 보며 기준보다 작은 카드는 왼쪽, 큰 카드는 오른쪽 묶음에 넣습니다`}
      </p>

      {phase === "predict" ? (
        <>
          <div className="algo-track-cells" aria-label="카드">
            {cards.map((v, k) => (
              <div key={k} className={`algo-cell ${k === 0 ? "algo-cell-current" : "algo-cell-out"}`}>
                <span className="algo-cell-value">{v}</span>
              </div>
            ))}
          </div>
          <div className="algo-track-flags">
            {cards.map((_, k) => (
              <span key={k} className="algo-flag">
                {k === 0 ? "기준" : ""}
              </span>
            ))}
          </div>
          <div className="algo-quick-predict" role="group" aria-label="예상 고르기">
            {GUESSES.map((g) => (
              <button key={g.v} type="button" className="algo-opt" onClick={() => choose(g.v)}>
                왼쪽에 {g.v}장
              </button>
            ))}
          </div>
        </>
      ) : done ? (
        <>
          <div className="algo-track-cells" aria-label="가른 결과">
            {[...left, pivot, ...right].map((v, k) => (
              <div
                key={k}
                className={`algo-cell ${k === left.length ? "algo-cell-settled" : k < left.length ? "algo-cell-waiting" : "algo-cell-out"}`}
              >
                <span className="algo-cell-value">{v}</span>
              </div>
            ))}
          </div>
          <div className="algo-track-flags">
            {[...left, pivot, ...right].map((_, k) => (
              <span key={k} className="algo-flag">
                {k === left.length ? "기준" : ""}
              </span>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="algo-quick-hand">
            <div className="algo-quick-pivot">
              <span className="algo-quick-label">기준</span>
              <div className="algo-cell algo-cell-current">
                <span className="algo-cell-value">{pivot}</span>
              </div>
            </div>
            <div className="algo-quick-rest">
              <span className="algo-quick-label">아직 안 본 카드</span>
              <div className="algo-quick-chips">
                {rest.slice(idx).map((v, k) => (
                  <div key={k} className={`algo-cell ${k === 0 && sorting ? "algo-cell-compare" : "algo-cell-out"}`}>
                    <span className="algo-cell-value">{v}</span>
                  </div>
                ))}
                {rest.slice(idx).length === 0 && <span className="algo-quick-none">없음</span>}
              </div>
            </div>
          </div>

          <div className="algo-quick-groups">
            <div className="algo-quick-group" data-side="left">
              <span className="algo-quick-label">왼쪽 묶음 · 기준보다 작은 카드</span>
              <div className="algo-quick-chips">
                {left.map((v, k) => (
                  <div key={k} className="algo-cell algo-cell-waiting">
                    <span className="algo-cell-value">{v}</span>
                  </div>
                ))}
                {left.length === 0 && <span className="algo-quick-none">비어 있음</span>}
              </div>
            </div>
            <div className="algo-quick-group" data-side="right">
              <span className="algo-quick-label">오른쪽 묶음 · 기준보다 큰 카드</span>
              <div className="algo-quick-chips">
                {right.map((v, k) => (
                  <div key={k} className="algo-cell algo-cell-out">
                    <span className="algo-cell-value">{v}</span>
                  </div>
                ))}
                {right.length === 0 && <span className="algo-quick-none">비어 있음</span>}
              </div>
            </div>
          </div>
        </>
      )}

      {sorting && (
        <>
          <p className="algo-quick-ask">
            보는 카드 <b>{card}</b> — 기준 <b>{pivot}</b> 보다 작은가요?
          </p>
          <div className="algo-pairs-btns">
            <button type="button" onClick={() => judge("left")}>
              작아요 → 왼쪽 묶음
            </button>
            <button type="button" onClick={() => judge("right")}>
              커요 → 오른쪽 묶음
            </button>
          </div>
        </>
      )}

      {placing && (
        <div className="algo-pairs-btns">
          <button type="button" className="algo-quick-go" onClick={place}>
            기준 {pivot}
            {p(pivot, "을", "를")} 두 묶음 사이에 놓기
          </button>
        </div>
      )}

      {msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          왼쪽 <b>{left.length}</b>장 · 오른쪽 <b>{right.length}</b>장
        </span>
        <span className="algo-quick-foot-btns">
          <button type="button" onClick={() => start(false)}>
            처음부터
          </button>
          <button type="button" onClick={() => start(true)}>
            이미 정렬된 카드로 해 보기
          </button>
        </span>
      </div>
    </section>
  );
}
