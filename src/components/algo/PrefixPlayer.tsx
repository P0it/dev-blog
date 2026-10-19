"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer } from "./TapePlayer";
import { StagePrefix } from "./StagePrefix";

/** 두 줄 트랙(원래 배열 + 깔아 둔 줄)을 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function PrefixPlayer({ tape, values, title }: { tape: Tape; values: number[]; title?: string }) {
  return (
    <TapePlayer tape={tape} title={title} stage={(s) => <StagePrefix values={s.values ?? values} state={s} />} />
  );
}
