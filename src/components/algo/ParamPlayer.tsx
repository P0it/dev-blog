"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageTrack } from "./StageTrack";

/**
 * 속도 칸 트랙을 끼운 플레이어. 칸 하나가 속도 하나(1~11)다.
 *
 * 칸의 값이 곧 속도라 아래 칸 번호는 숨긴다. 빨강 = 안 되는 것으로 확정, 초록 = 되는 것으로 확정.
 * 테이프는 서버에서 색을 칠해 넘겨받는다. `pause` 는 중간에 끼우는 예측 한 번이다.
 */
export function ParamPlayer({ tape, values, pause }: { tape: Tape; values: number[]; pause?: PlayerPause }) {
  return (
    <TapePlayer
      tape={tape}
      title="되는 속도와 안 되는 속도의 경계를 좁혀 가는 모습"
      pause={pause}
      stage={(s) => <StageTrack values={values} state={s} hideIndex />}
    />
  );
}
