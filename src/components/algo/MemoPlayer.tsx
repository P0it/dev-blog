"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageMemo } from "./StageMemo";

/** 호출 탑과 수첩을 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function MemoPlayer({
  tape,
  n,
  title,
  pause,
}: {
  tape: Tape;
  n: number;
  title?: string;
  pause?: PlayerPause;
}) {
  const slots = Math.max(1, ...tape.steps.map((s) => s.stage.frames?.length ?? 0));
  return (
    <TapePlayer
      tape={tape}
      title={title}
      pause={pause}
      stage={(s) => <StageMemo state={s} slots={slots} size={n + 1} />}
    />
  );
}
