"use client";

import { useState } from "react";
import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageTrack } from "./StageTrack";

export type BoundTarget = { value: number; label: string };

/**
 * 찾는 값과 코드(왼쪽 끝 / 비교 한 줄만 바꾼 오른쪽 끝)를 골라 같은 무대에서 돌려 보는 플레이어.
 *
 * `<` 를 `<=` 로 바꾸면 bisect_right 가 된다는 걸 코드 줄 하나가 아니라 **결과 틈이 달라지는 것**으로 본다.
 * 테이프는 서버에서 색을 칠해 넘겨받는다.
 */
export function BoundPlayer({
  values,
  targets,
  tapes,
  pauses,
}: {
  values: number[];
  targets: BoundTarget[];
  /** 키는 `left-2`, `right-4` 처럼 코드 종류와 찾는 값 */
  tapes: Record<string, Tape>;
  /** 같은 키의 예측 관문. 첫 비교 뒤 lo·hi 중 어느 쪽이 움직일지 묻는다 */
  pauses: Record<string, PlayerPause | undefined>;
}) {
  const [target, setTarget] = useState(targets[0].value);
  const [variant, setVariant] = useState<"left" | "right">("left");
  const key = `${variant}-${target}`;

  return (
    <>
      <div className="algo-picker" role="group" aria-label="찾는 값과 코드 고르기">
        <div className="algo-seg">
          {targets.map((t) => (
            <button key={t.value} type="button" aria-pressed={t.value === target} onClick={() => setTarget(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="algo-seg">
          <button type="button" aria-pressed={variant === "left"} onClick={() => setVariant("left")}>
            bisect_left 코드
          </button>
          <button type="button" aria-pressed={variant === "right"} onClick={() => setVariant("right")}>
            {"`<` 를 `<=` 로 바꾼 코드"}
          </button>
        </div>
      </div>

      <TapePlayer
        key={key}
        tape={tapes[key]}
        title="경계 틈을 찾아 좁혀 가는 모습"
        pause={pauses[key]}
        stage={(s) => <StageTrack values={values} state={s} />}
      />
    </>
  );
}
