"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageIsland } from "./StageIsland";

/**
 * 섬 지도 무대를 끼운 플레이어.
 *
 * 서버 컴포넌트는 클라이언트 컴포넌트에 함수를 넘기지 못한다. 그래서 무대를 고르는 일은 이런 클라이언트 래퍼가 맡는다.
 */
export function IslandPlayer({ tape, title, pause }: { tape: Tape; title?: string; pause?: PlayerPause }) {
  return <TapePlayer tape={tape} title={title} pause={pause} stage={(s) => <StageIsland state={s} />} />;
}
