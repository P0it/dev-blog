"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageMerge } from "./StageMerge";

/** 두 줄 무대(원래 줄 + 합쳐서 만드는 줄)를 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function MergePlayer({
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
      stage={(s) => <StageMerge values={s.values ?? values} state={s} />}
    />
  );
}
