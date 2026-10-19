"use client";

import { useState } from "react";
import {
  COIN_SET_A,
  COIN_SET_B,
  allowedCoin,
  bestCoins,
  coinSum,
  sortedDesc,
  type CoinSet,
} from "@/lib/algo/greedy-coins";

export type CoinGuess = "yes" | "unknown" | "no";

export type CoinResult = {
  /** 세트 B 를 하기 전에 고른 예상 — 큰 동전부터 주면 이번에도 가장 적을까 */
  guess: CoinGuess;
  /** 세트 A 에서 쓴 동전 수 */
  aCount: number;
  /** 세트 B 에서 큰 동전부터 줘서 쓴 동전 수 */
  bCount: number;
  /** 세트 B 를 모든 경우를 따져 가장 적게 준 동전 수 */
  bBest: number;
};

type Phase = "A" | "predict" | "B" | "optimal";

/** 예상 선택지 — 정답(아니다)을 세 번째에 둬서 위치로 찍을 수 없게 한다. */
const GUESSES: { v: CoinGuess; label: string }[] = [
  { v: "yes", label: "그렇다 — 큰 동전부터 주면 늘 가장 적다" },
  { v: "unknown", label: "알 수 없다 — 해 봐야 안다" },
  { v: "no", label: "아니다 — 더 적게 줄 방법이 있다" },
];

const GUESS_LABEL: Record<CoinGuess, string> = { yes: "그렇다", unknown: "알 수 없다", no: "아니다" };

/**
 * ① 직접 해 보기 — 동전을 거슬러 준다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 허용 동작은 그리디의 동작 그대로다: **지금 줄 수 있는 동전 중 가장 큰 것**만
 * 눌린다(더 작은 동전을 누르면 이유를 말한다). 세트 A(500·100·50·10원으로 1260원)를 먼저 하고,
 * 세트 B(1·3·4원으로 6원)를 하기 전에 "이번에도 큰 동전부터 주면 가장 적을까"를 먼저 예상한다.
 * 세트 B 를 끝낸 뒤 「더 적게 줄 수 있을까?」를 눌러 3 + 3 = 2개를 보면 ② 되짚기가 열린다. 「처음부터」는 ② 도 다시 숨긴다.
 */
export function CoinByHand({ onDone }: { onDone?: (r: CoinResult | null) => void }) {
  const [phase, setPhase] = useState<Phase>("A");
  const [given, setGiven] = useState<number[]>([]);
  const [aCount, setACount] = useState(0);
  const [guess, setGuess] = useState<CoinGuess | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set: CoinSet = phase === "A" ? COIN_SET_A : COIN_SET_B;
  const coins = sortedDesc(set.coins);
  const remaining = set.amount - given.reduce((a, b) => a + b, 0);
  const finished = remaining === 0 && given.length > 0;
  const playing = (phase === "A" || phase === "B") && !finished;

  const reset = () => {
    setPhase("A");
    setGiven([]);
    setACount(0);
    setGuess(null);
    setMsg(null);
    onDone?.(null);
  };

  const give = (coin: number) => {
    if (!playing) return;
    const biggest = allowedCoin(set.coins, remaining);
    if (coin > remaining) {
      setMsg({ ok: false, text: `남은 돈이 ${remaining}원이라 ${coin}원은 줄 수 없어요` });
      return;
    }
    if (biggest !== null && coin < biggest) {
      setMsg({ ok: false, text: `${biggest}원을 아직 줄 수 있어요. 지금은 줄 수 있는 가장 큰 동전부터 줍니다` });
      return;
    }
    const next = [...given, coin];
    const left = remaining - coin;
    setGiven(next);
    if (left > 0) {
      setMsg({ ok: true, text: `${coin}원을 줬습니다. 남은 돈 ${left}원` });
      return;
    }
    if (phase === "A") setACount(next.length);
    setMsg({ ok: true, text: `${set.amount}원을 ${next.length}개로 거슬러 줬습니다: ${coinSum(next)}` });
  };

  const toPredict = () => {
    setPhase("predict");
    setGiven([]);
    setMsg(null);
  };

  const choose = (v: CoinGuess) => {
    setGuess(v);
    setPhase("B");
    setGiven([]);
    setMsg(null);
  };

  const showOptimal = () => {
    const best = bestCoins(COIN_SET_B.coins, COIN_SET_B.amount) ?? [];
    setPhase("optimal");
    setMsg({ ok: true, text: `이렇게 주면 ${best.length}개입니다: ${coinSum(best)}. 큰 동전 4원을 먼저 줬다가 3 + 3 을 놓쳤어요` });
    onDone?.({
      guess: guess ?? "unknown",
      aCount,
      bCount: given.length,
      bBest: best.length,
    });
  };

  const best = bestCoins(COIN_SET_B.coins, COIN_SET_B.amount) ?? [];

  return (
    <section className="algo-byhand" aria-label="동전으로 거슬러 주기">
      <p className="algo-byhand-ask">
        {phase === "predict"
          ? "첫 번째 동전 세트는 큰 동전부터 줬을 때 맞았습니다. 먼저 맞혀 보세요. 이번 세트(1원·3원·4원으로 6원)도 큰 동전부터 주면 가장 적은 개수일까요?"
          : phase === "optimal"
            ? "다른 방법으로 거슬러 줬습니다"
            : `${set.amount}원을 거슬러 줍니다. 가장 적은 개수로 주는 것이 목표예요. 줄 수 있는 동전 중 가장 큰 동전부터 눌러 한 개씩 줍니다.`}
      </p>

      {phase === "predict" ? (
        <div className="algo-coin-predict" role="group" aria-label="예상 고르기">
          {GUESSES.map((g) => (
            <button key={g.v} type="button" className="algo-opt" onClick={() => choose(g.v)}>
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className="algo-coin-left">
            {phase === "optimal" ? "거슬러 줄 돈" : "남은 돈"} <b>{phase === "optimal" ? COIN_SET_B.amount : remaining}</b>원
            {phase !== "optimal" && finished && <span> — 다 줬습니다</span>}
          </p>

          <div className="algo-coin-btns" role="group" aria-label="줄 수 있는 동전">
            {coins.map((c) => (
              <button
                key={c}
                type="button"
                className="algo-coin-btn"
                onClick={() => give(c)}
                disabled={!playing}
                data-big={c === allowedCoin(set.coins, remaining) && playing ? "" : undefined}
              >
                {c}원
              </button>
            ))}
          </div>

          <p className="algo-coin-given-label">
            {phase === "optimal" ? "큰 동전부터 줬을 때" : "준 동전"} <b>{given.length}</b>개
          </p>
          <ol className="algo-coin-given" aria-label="준 동전">
            {given.length === 0 ? (
              <li className="algo-coin-none">아직 없음</li>
            ) : (
              given.map((c, i) => (
                <li key={i} className="algo-coin-chip">
                  {c}
                </li>
              ))
            )}
          </ol>

          {phase === "optimal" && (
            <>
              <p className="algo-coin-given-label">
                다른 방법 <b>{best.length}</b>개
              </p>
              <ol className="algo-coin-given" aria-label="더 적게 준 동전">
                {best.map((c, i) => (
                  <li key={i} className="algo-coin-chip" data-good="">
                    {c}
                  </li>
                ))}
              </ol>
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

      {phase === "A" && finished && (
        <div className="algo-pairs-btns">
          <button type="button" className="algo-select-go" onClick={toPredict}>
            다른 동전 세트로 해 보기
          </button>
        </div>
      )}
      {phase === "B" && finished && (
        <div className="algo-pairs-btns">
          <button type="button" className="algo-select-go" onClick={showOptimal}>
            더 적게 줄 수 있을까?
          </button>
        </div>
      )}

      <div className="algo-byhand-foot">
        <span>
          {phase === "predict" ? (
            <>세트 A에서 쓴 동전 <b>{aCount}</b>개</>
          ) : (
            <>
              지금까지 쓴 동전 <b>{given.length}</b>개
            </>
          )}
          {guess !== null && phase !== "predict" && <> · 내 예상 <b>{GUESS_LABEL[guess]}</b></>}
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}

/** 이 컴포넌트가 쓰는 라벨 — Reveal 이 되짚기에 같은 말로 쓴다. */
export { GUESS_LABEL };
