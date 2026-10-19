"use client";

import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { KnapTable } from "./StageKnap";

/**
 * 배낭 표 무대를 끼운 플레이어.
 *
 * 서버 컴포넌트는 클라이언트 컴포넌트에 함수를 넘기지 못한다. 무대를 고르는 일은 이런 클라이언트 래퍼가 맡는다.
 * 테이프와 예측 관문은 서버에서 만들어 넘겨받는다.
 */
export function KnapPlayer({ tape, pause, title }: { tape: Tape; pause?: PlayerPause; title?: string }) {
  return (
    <TapePlayer
      tape={tape}
      title={title}
      pause={pause}
      stage={(s) =>
        s.knap ? (
          <div className="algo-knap-stage">
            <KnapTable knap={s.knap} />
            <p className="algo-knap-legend">
              <i data-s="cur" /> 지금 채우는 칸 · <i data-s="from" /> 이 칸이 읽는 칸 (바로 위 칸 = 안 담기, 무게만큼 왼쪽 위 칸 = 담기) · 흐린 숫자는 아직 안 채운 칸
            </p>
          </div>
        ) : null
      }
    />
  );
}
