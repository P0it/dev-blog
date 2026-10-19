"use client";

import { useState } from "react";
import type { Tape } from "@/lib/algo/types";
import { TapePlayer, type PlayerPause } from "./TapePlayer";
import { StageTrack } from "./StageTrack";

export type SearchTarget = { value: number; label: string };

/**
 * 찾는 값과 코드(정상 / 등호를 뺀 것)를 골라 같은 무대에서 돌려 보는 이분 탐색 플레이어.
 *
 * ⑥ 틀리는 자리가 말로만 끝나지 않게 하는 장치다. 90 을 고르고 「등호를 뺀 코드」를 누르면
 * 배열에 있는 90 이 -1 로 끝나는 걸 화면에서 본다. 테이프는 서버에서 색을 칠해 넘겨받는다.
 */
export function SearchPlayer({
  values,
  targets,
  tapes,
  pauses,
}: {
  values: number[];
  targets: SearchTarget[];
  /** 키는 `ok-42`, `lt-90` 처럼 코드 종류와 찾는 값 */
  tapes: Record<string, Tape>;
  /** 같은 키의 예측 관문. 첫 비교 뒤 left·right 중 어느 쪽이 움직일지 묻는다 */
  pauses: Record<string, PlayerPause | undefined>;
}) {
  const [target, setTarget] = useState(targets[0].value);
  const [variant, setVariant] = useState<"ok" | "lt">("ok");
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
          <button type="button" aria-pressed={variant === "ok"} onClick={() => setVariant("ok")}>
            정상 코드
          </button>
          <button type="button" aria-pressed={variant === "lt"} onClick={() => setVariant("lt")}>
            등호를 뺀 코드
          </button>
        </div>
      </div>

      <TapePlayer
        key={key}
        tape={tapes[key]}
        title="이분 탐색이 한 칸씩 도는 모습"
        pause={pauses[key]}
        stage={(s) => <StageTrack values={values} state={s} />}
      />
    </>
  );
}
