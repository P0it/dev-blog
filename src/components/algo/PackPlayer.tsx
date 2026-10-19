"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageTrack } from "./StageTrack";
import { StageTable } from "./StageTable";

/** 물건 칸 트랙 아래에 경우 표를 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function PackPlayer({
  tape,
  weights,
  title,
  pause,
}: {
  tape: Tape;
  weights: number[];
  title?: string;
  pause?: PlayerPause;
}) {
  return (
    <TapePlayer
      tape={tape}
      title={title}
      pause={pause}
      stage={(s) => (
        <div className="algo-pack">
          <p className="algo-pack-cap">물건의 무게 (칸 아래 번호가 물건 번호)</p>
          <StageTrack values={weights} state={s} />
          {s.table && <StageTable table={s.table} />}
        </div>
      )}
    />
  );
}
