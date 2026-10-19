"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageTimeline } from "./StageTimeline";

/**
 * 시간표 무대를 끼운 플레이어.
 *
 * 서버 컴포넌트는 클라이언트 컴포넌트에 함수를 넘기지 못한다. 무대를 고르는 일은 이런 클라이언트 래퍼가 맡는다.
 * 테이프와 예측 관문은 서버에서 만들어 넘겨받는다.
 */
export function MeetPlayer({ tape, pause, title }: { tape: Tape; pause?: PlayerPause; title?: string }) {
  return <TapePlayer tape={tape} title={title} pause={pause} stage={(s) => <StageTimeline state={s} />} />;
}
