"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer } from "./TapePlayer";
import { StageGrid } from "./StageGrid";

/** 격자 무대를 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function GridPlayer({
  tape,
  cols,
  labels,
  title,
}: {
  tape: Tape;
  cols: number;
  labels?: Record<number, string>;
  title?: string;
}) {
  return (
    <TapePlayer
      tape={tape}
      title={title}
      stage={(s) => <StageGrid cols={cols} state={s} labels={labels} />}
    />
  );
}
