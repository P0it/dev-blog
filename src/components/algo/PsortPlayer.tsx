"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageTable } from "./StageTable";

/** 카드마다 key 를 만들어 두는 표를 끼운 플레이어. 서버 쪽은 데이터만 넘긴다. */
export function PsortPlayer({ tape, title, pause }: { tape: Tape; title?: string; pause?: PlayerPause }) {
  return (
    <TapePlayer
      tape={tape}
      title={title}
      pause={pause}
      stage={(s) => (
        <div className="algo-psort-stage">
          <p className="algo-pack-cap">카드마다 정렬용 key 를 만들어 두고, key 가 작은 순서로 줄 세웁니다</p>
          {s.table && <StageTable table={s.table} />}
        </div>
      )}
    />
  );
}
