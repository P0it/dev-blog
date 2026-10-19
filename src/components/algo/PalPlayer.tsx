"use client";

import { useState } from "react";
import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageTrack } from "./StageTrack";

/**
 * 단어를 골라 같은 코드를 돌려 보는 회문 플레이어.
 *
 * ① 해 보기에서 쓴 단어 그대로다. 단어를 바꾸면 처음부터 다시 돈다(`key`).
 * 칸에는 숫자 대신 글자가 적힌다 — 값은 칸 번호이고 표시만 글자로 바꾼다(`StageTrack` 의 `labels`).
 * 테이프는 서버에서 색을 칠해 넘겨받고, 예측 관문은 단어마다 따로 받는다.
 */
export function PalPlayer({
  words,
  tapes,
  pauses,
}: {
  words: string[];
  tapes: Record<string, Tape>;
  pauses: Record<string, PlayerPause | undefined>;
}) {
  const [word, setWord] = useState(words[0]);
  const cs = Array.from(word);

  return (
    <>
      <div className="algo-picker" role="group" aria-label="단어 고르기">
        <div className="algo-seg">
          {words.map((w) => (
            <button key={w} type="button" aria-pressed={w === word} onClick={() => setWord(w)}>
              {w}
            </button>
          ))}
        </div>
      </div>

      <TapePlayer
        key={word}
        tape={tapes[word]}
        title={`뒤집어도 같은지 「${word}」의 양끝에서 견주는 모습`}
        pause={pauses[word]}
        stage={(s) => (
          <div className="algo-pal-stage">
            <StageTrack values={cs.map((_, i) => i)} labels={cs} state={s} />
          </div>
        )}
      />
    </>
  );
}
