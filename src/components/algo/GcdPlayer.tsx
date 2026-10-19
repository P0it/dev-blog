"use client";

import { useState, type ReactNode } from "react";
import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageTiles } from "./StageTiles";

type Key = "a" | "b" | "c";

/**
 * 입력(두 수)을 바꿔 가며 같은 코드를 돌려 보는 플레이어. 처음에는 ① 에서 한 48 과 18 이다.
 *
 * 코드가 짧아서 스텝이 적다 — 서로소(17 과 5)나 작은 수가 앞인 입력(18 과 48)으로 바꿔 다른 모양을 본다.
 * 테이프는 서버에서 색을 칠해 넘겨받는다.
 */
export function GcdPlayer({
  tapes,
  labels,
  notes,
  pauses,
}: {
  tapes: Record<Key, Tape>;
  labels: Record<Key, string>;
  /** 입력마다 아래 한 줄. 서버 쪽에서 문장을 만들어 넘긴다 */
  notes: Record<Key, ReactNode>;
  pauses: Partial<Record<Key, PlayerPause>>;
}) {
  const [key, setKey] = useState<Key>("a");

  return (
    <>
      <div className="algo-picker" role="group" aria-label="두 수 고르기">
        <div className="algo-seg">
          {(["a", "b", "c"] as Key[]).map((k) => (
            <button key={k} type="button" aria-pressed={k === key} onClick={() => setKey(k)}>
              {labels[k]}
            </button>
          ))}
        </div>
      </div>

      <TapePlayer
        key={key}
        tape={tapes[key]}
        title="나머지로 바꿔 가며 바닥을 채우는 모습"
        pause={pauses[key]}
        stage={(s) => <StageTiles state={s} />}
      />

      <p className="algo-gcd-note">{notes[key]}</p>
    </>
  );
}
