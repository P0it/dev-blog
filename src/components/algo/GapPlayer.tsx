"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageGap } from "./StageGap";

/** 빈자리가 있는 줄 무대를 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function GapPlayer({
  tape,
  values,
  title,
  pause,
}: {
  tape: Tape;
  values: number[];
  title?: string;
  pause?: PlayerPause;
}) {
  return (
    <TapePlayer
      tape={tape}
      title={title}
      pause={pause}
      stage={(s) => <StageGap values={s.values ?? values} state={s} />}
    />
  );
}
