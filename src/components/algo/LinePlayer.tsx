"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageLine } from "./StageLine";

/** 줄 무대를 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function LinePlayer({ tape, title, pause }: { tape: Tape; title?: string; pause?: PlayerPause }) {
  return <TapePlayer tape={tape} title={title} pause={pause} stage={(s) => <StageLine state={s} />} />;
}
