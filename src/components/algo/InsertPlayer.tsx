"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageInsert } from "./StageInsert";

/** 빈자리와 손에 든 카드가 있는 줄 무대를 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function InsertPlayer({
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
      stage={(s) => <StageInsert values={s.values ?? values} state={s} />}
    />
  );
}
