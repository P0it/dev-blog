"use client";

import { useState } from "react";
import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageStack } from "./StageStack";

type Which = "ok" | "bad";

/**
 * 짝이 맞는 괄호 / 안쪽이 어긋난 괄호를 골라 같은 무대에서 돌려 보는 플레이어.
 *
 * 두 입력은 길이가 같다. 고르면 플레이어가 처음으로 돌아간다(`key`) — 예측 관문도 새로 열린다.
 * 테이프와 관문은 서버에서 만들어 넘겨받는다.
 */
export function BracketPlayer({
  tapes,
  pauses,
}: {
  tapes: Record<Which, Tape>;
  pauses: Record<Which, PlayerPause>;
}) {
  const [which, setWhich] = useState<Which>("ok");

  return (
    <>
      <div className="algo-picker" role="group" aria-label="돌려 볼 문자열 고르기">
        <div className="algo-seg">
          <button type="button" aria-pressed={which === "ok"} onClick={() => setWhich("ok")}>
            짝이 맞는 문자열
          </button>
          <button type="button" aria-pressed={which === "bad"} onClick={() => setWhich("bad")}>
            안쪽이 어긋난 문자열
          </button>
        </div>
      </div>

      <TapePlayer
        key={which}
        tape={tapes[which]}
        title="괄호가 스택에 쌓이고 걷히는 모습"
        pause={pauses[which]}
        stage={(s) => <StageStack state={s} />}
      />
    </>
  );
}
