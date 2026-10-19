"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer } from "./TapePlayer";
import { StageTower } from "./StageTower";

/** 호출 탑 무대를 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function TowerPlayer({ tape, title }: { tape: Tape; title?: string }) {
  const slots = Math.max(1, ...tape.steps.map((s) => s.stage.frames?.length ?? 0));
  return (
    <TapePlayer tape={tape} title={title} stage={(s) => <StageTower state={s} slots={slots} />} />
  );
}
