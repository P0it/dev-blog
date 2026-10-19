"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageGrid } from "./StageGrid";

/** 격자 무대를 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function GridPlayer({
  tape,
  cols,
  labels,
  title,
  lane,
  pause,
}: {
  tape: Tape;
  cols: number;
  labels?: Record<number, string>;
  title?: string;
  /** 아래 레인 — 큐(기본) 또는 스택 */
  lane?: "queue" | "stack";
  pause?: PlayerPause;
}) {
  return (
    <TapePlayer
      tape={tape}
      title={title}
      pause={pause}
      stage={(s) => <StageGrid cols={cols} state={s} labels={labels} lane={lane} />}
    />
  );
}
