"use client";

import { useState } from "react";
import { SELECT_CARDS, isSmaller } from "@/lib/algo/selection-sort";
import { josa } from "@/lib/algo/josa";

export type SelectResult = {
  /** 견줘 본 횟수 */
  compares: number;
  /** 실제로 자리를 바꾼 횟수(후보가 제자리면 세지 않는다) */
  swaps: number;
  /** 독자가 처음에 고른 예상. 정렬된 카드로 해 본 경우는 null */
  guess: number | null;
  /** 첫 바퀴가 끝나고 맨 앞에 온 카드 */
  firstPlaced: number;
  /** 이미 정렬된 카드로 시작했는가 */
  sortedStart: boolean;
};

type Phase = "predict" | "scan" | "place" | "done";

/** 예상 선택지 — 정답(1)을 세 번째에 둬서 위치로 찍을 수 없게 한다. */
const GUESSES = [
  { v: 5, label: "5 — 원래 맨 앞에 있던 카드" },
  { v: 2, label: "2 — 맨 앞 카드 바로 옆의 카드" },
  { v: 1, label: "1 — 가장 작은 카드" },
] as const;

const SORTED_CARDS = [...SELECT_CARDS].sort((a, b) => a - b);

/** 숫자 뒤 조사만 돌려준다. 이 탭은 `숫자 조사` 를 띄워 쓰므로(`2 는`) 숫자는 따로 적는다. */
const p = (n: number, withBatchim: string, without: string) => josa(n, withBatchim, without).slice(String(n).length);

/**
 * ① 직접 해 보기 — 카드를 작은 수부터 왼쪽에 늘어놓는다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. **먼저 예상을 고른다**(첫 바퀴가 끝나면 맨 앞에 어떤 카드가 올까).
 * 그다음 아직 안 정한 카드를 앞에서부터 한 장씩 보며 "후보보다 작은가"를 독자가 판정한다.
 * 다 보고 나면 후보를 맨 앞 빈 칸과 맞바꾼다. 아무 두 칸이나 바꾸는 동작은 없다 —
 * 여기서 허용하는 동작이 곧 선택 정렬의 동작이라 ②되짚기가 ①을 반증하지 않는다(버블 정렬 ① 의 실수).
 * 「이미 정렬된 카드로 해 보기」는 ③ 이 끌어낼 사실(정렬돼 있어도 보는 횟수는 같다)을 몸으로 겪게 한다.
 * 처음부터·다시 시작을 누르면 ② 도 다시 숨는다(`onDone(null)`).
 */
export function SelectByHand({ onDone }: { onDone?: (r: SelectResult | null) => void }) {
  const [cards, setCards] = useState<number[]>(SELECT_CARDS);
  const [phase, setPhase] = useState<Phase>("predict");
  const [settled, setSettled] = useState(0);
  const [j, setJ] = useState(1);
  const [best, setBest] = useState(0);
  const [compares, setCompares] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [firstPlaced, setFirstPlaced] = useState<number | null>(null);
  const [sortedStart, setSortedStart] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const n = cards.length;

  const start = (sorted: boolean) => {
    setCards(sorted ? SORTED_CARDS : SELECT_CARDS);
    setPhase(sorted ? "scan" : "predict");
    setSettled(0);
    setJ(1);
    setBest(0);
    setCompares(0);
    setSwaps(0);
    setGuess(null);
    setFirstPlaced(null);
    setSortedStart(sorted);
    setMsg(null);
    onDone?.(null);
  };

  const choose = (v: number) => {
    setGuess(v);
    setPhase("scan");
    setJ(settled + 1);
    setBest(settled);
  };

  /** 보는 카드가 후보보다 작은지 독자가 판정한다. 틀리면 이유를 말하고 그대로 둔다. */
  const judge = (said: boolean) => {
    const truth = isSmaller(cards, j, best);
    const a = cards[j];
    const b = cards[best];
    if (said !== truth) {
      setMsg({
        ok: false,
        text: truth
          ? `${a} ${p(a, "은", "는")} 후보 ${b} 보다 작아요. 더 작은 카드를 만나면 후보가 그 카드로 바뀝니다`
          : `${a} ${p(a, "은", "는")} 후보 ${b} 보다 작지 않아요. 후보는 그대로 둡니다`,
      });
      return;
    }
    setMsg({
      ok: true,
      text: truth ? `후보가 바뀝니다 → ${a}` : `후보는 그대로 ${b} 입니다`,
    });
    setCompares(compares + 1);
    if (truth) setBest(j);
    if (j + 1 >= n) setPhase("place");
    else setJ(j + 1);
  };

  /** 후보를 맨 앞 빈 칸(settled)과 맞바꾼다. 후보가 이미 제자리면 바꾸지 않고 확정만 한다. */
  const place = () => {
    const next = [...cards];
    const moved = best !== settled;
    if (moved) [next[settled], next[best]] = [next[best], next[settled]];
    const s = swaps + (moved ? 1 : 0);
    const placed = next[settled];
    if (settled === 0) setFirstPlaced(placed);
    setCards(next);
    setSwaps(s);

    if (settled === 0 && !sortedStart && guess !== null) {
      const hit = guess === placed;
      setMsg({
        ok: hit,
        text: `첫 바퀴가 끝났습니다. 맨 앞에는 ${placed} ${p(placed, "이", "가")} 왔어요. 내 예상은 ${guess}${hit ? " — 맞았어요" : " — 달랐어요"}`,
      });
    } else {
      setMsg({
        ok: true,
        text: moved
          ? `${placed} ${p(placed, "을", "를")} ${settled}번 칸으로 보냈습니다`
          : `${placed} ${p(placed, "은", "는")} 이미 제자리라 바꾸지 않았습니다`,
      });
    }

    const nextSettled = settled + 1;
    setSettled(nextSettled);
    if (nextSettled >= n - 1) {
      // 마지막 한 장은 남은 자리가 하나뿐이라 저절로 정해진다
      setPhase("done");
      onDone?.({
        compares,
        swaps: s,
        guess: sortedStart ? null : guess,
        firstPlaced: settled === 0 ? placed : (firstPlaced ?? placed),
        sortedStart,
      });
    } else {
      setPhase("scan");
      setJ(nextSettled + 1);
      setBest(nextSettled);
    }
  };

  const done = phase === "done";
  const scanning = phase === "scan";
  const placing = phase === "place";

  const stateOf = (k: number) => {
    if (done || k < settled) return "algo-cell-settled";
    if (scanning && k === j) return "algo-cell-compare";
    if ((scanning || placing) && k === best) return "algo-cell-current";
    return "algo-cell-out";
  };
  const flagOf = (k: number) => {
    if (done || k < settled) return "";
    if (scanning && k === j) return "보는 중";
    if ((scanning || placing) && k === best) return "후보";
    return "";
  };

  return (
    <section className="algo-byhand" aria-label="카드를 작은 수부터 왼쪽에 늘어놓기">
      <p className="algo-byhand-ask">
        {done
          ? "왼쪽부터 작은 순서로 섰습니다"
          : phase === "predict"
            ? "카드 여섯 장을 작은 수부터 왼쪽에 늘어놓습니다. 먼저 맞혀 보세요. 첫 바퀴를 끝내면 맨 앞에 어떤 카드가 올까요?"
            : "숫자가 작을수록 왼쪽에 서야 합니다. 안 정한 카드를 앞에서부터 한 장씩 보며 가장 작은 카드를 찾아 왼쪽 끝으로 보냅니다"}
      </p>

      <div className="algo-track-cells">
        {cards.map((v, k) => (
          <div key={k} className={`algo-cell ${stateOf(k)}`}>
            <span className="algo-cell-value">{v}</span>
          </div>
        ))}
      </div>
      <div className="algo-track-flags">
        {cards.map((_, k) => (
          <span key={k} className="algo-flag">
            {flagOf(k)}
          </span>
        ))}
      </div>

      {phase === "predict" && (
        <div className="algo-select-predict" role="group" aria-label="예상 고르기">
          {GUESSES.map((g) => (
            <button key={g.v} type="button" className="algo-opt" onClick={() => choose(g.v)}>
              {g.label}
            </button>
          ))}
        </div>
      )}

      {scanning && (
        <>
          <p className="algo-select-eq" aria-live="polite">
            보는 카드 <b>{cards[j]}</b> · 후보 <b>{cards[best]}</b>
          </p>
          <p className="algo-select-ask">
            {cards[j]} {p(cards[j], "은", "는")} 후보 {cards[best]} 보다 작은가요?
          </p>
          <div className="algo-pairs-btns">
            <button type="button" onClick={() => judge(true)}>
              더 작아요
            </button>
            <button type="button" onClick={() => judge(false)}>
              더 작지 않아요
            </button>
          </div>
        </>
      )}

      {placing && (
        <>
          <p className="algo-select-ask">
            다 봤습니다. 가장 작은 카드는 <b>{cards[best]}</b> 입니다.
          </p>
          <div className="algo-pairs-btns">
            <button type="button" className="algo-select-go" onClick={place}>
              {best === settled
                ? `${cards[best]} ${p(cards[best], "은", "는")} 이미 ${settled}번 칸 — 확정하기`
                : `${cards[best]} ${p(cards[best], "을", "를")} ${settled}번 칸의 ${cards[settled]} ${p(cards[settled], "과", "와")} 맞바꾸기`}
            </button>
          </div>
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
          견줘 본 횟수 <b>{compares}</b> · 바꾼 횟수 <b>{swaps}</b>
        </span>
        <span className="algo-select-foot-btns">
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
