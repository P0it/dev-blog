"use client";

import { useState, type ReactNode } from "react";
import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageCoins } from "./StageCoins";

type Key = "A" | "B";

/**
 * 동전 세트(A / B)를 골라 같은 코드로 돌려 보는 플레이어. 처음에는 ① 에서 마지막으로 한 세트 B 6원이다.
 *
 * 플레이어 아래에 같은 입력을 **모든 경우를 따져** 가장 적게 준 값을 한 줄로 붙인다 — 그리디와 최적이 갈리는 걸
 * 코드 옆에서 바로 본다. 테이프는 서버에서 색을 칠해 넘겨받는다.
 */
export function CoinPlayer({
  tapes,
  labels,
  compare,
  pauses,
}: {
  tapes: Record<Key, Tape>;
  labels: Record<Key, string>;
  /** 세트마다 아래 한 줄. 서버 쪽에서 문장을 만들어 넘긴다 */
  compare: Record<Key, ReactNode>;
  pauses: Partial<Record<Key, PlayerPause>>;
}) {
  const [key, setKey] = useState<Key>("B");

  return (
    <>
      <div className="algo-picker" role="group" aria-label="동전 세트 고르기">
        <div className="algo-seg">
          {(["A", "B"] as Key[]).map((k) => (
            <button key={k} type="button" aria-pressed={k === key} onClick={() => setKey(k)}>
              {labels[k]}
            </button>
          ))}
        </div>
      </div>

      <TapePlayer
        key={key}
        tape={tapes[key]}
        title="큰 동전부터 빼 나가는 모습"
        pause={pauses[key]}
        stage={(s) => <StageCoins state={s} />}
      />

      <p className="algo-coin-compare">{compare[key]}</p>
    </>
  );
}
