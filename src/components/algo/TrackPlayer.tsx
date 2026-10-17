"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer } from "./TapePlayer";
import { StageTrack } from "./StageTrack";

/**
 * 칸 트랙 무대를 끼운 플레이어.
 *
 * 서버 컴포넌트는 클라이언트 컴포넌트에 함수를 넘기지 못한다. 그래서 무대를 고르는 일은
 * 무대 종류마다 이런 클라이언트 래퍼가 맡는다 — 페이지는 데이터만 넘긴다.
 */
export function TrackPlayer({
  tape,
  values,
  title,
}: {
  tape: Tape;
  values: number[];
  title?: string;
}) {
  return (
    <TapePlayer
      tape={tape}
      title={title}
      // 정렬처럼 값이 움직이면 스텝이 들고 있는 값을 쓴다
      stage={(s) => <StageTrack values={s.values ?? values} state={s} />}
    />
  );
}
