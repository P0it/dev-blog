"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { StageState, Tape } from "@/lib/algo/types";
import { clampStep } from "./clamp-step";

const TICK_MS = 900;

/**
 * 코드 한 줄과 그림이 맞물려 도는 플레이어.
 *
 * - **처음에는 멈춰 있다.** 자동 재생하지 않는다. 독자가 설명을 읽기 전에 중반을 지나가면 안 된다
 * - 좁은 화면에서는 `그림 / 코드` 탭 전환. 위아래로 쌓으면 작은 화면을 다 먹는다
 * - 서버에서 그려지는 첫 모습이 **스텝 0** 이라, 스크립트가 꺼져도 코드 전문과 첫 상태가 읽힌다
 */
export function TapePlayer({
  tape,
  stage,
  title,
  layout = "split",
}: {
  tape: Tape;
  stage: (s: StageState) => ReactNode;
  title?: string;
  /** "stack" 은 그림을 위, 코드를 아래로 둔다. 격자처럼 넓은 그림에 쓴다 */
  layout?: "split" | "stack";
}) {
  const [at, setAt] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const last = tape.steps.length - 1;
  const step = at < 0 ? tape.steps[0] : tape.steps[at];

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setAt((prev) => {
        if (prev >= last) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, TICK_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, last]);

  const jump = (d: number) => {
    setPlaying(false);
    setAt((prev) => clampStep(prev + d, tape.steps.length));
  };

  const toggle = () => {
    if (playing) return setPlaying(false);
    if (at >= last) setAt(-1);
    setPlaying(true);
  };

  if (tape.steps.length === 0) return null;

  return (
    <figure className="algo-player" data-layout={layout} aria-label={title ?? "코드와 그림이 함께 도는 플레이어"}>
      <div className="algo-player-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={!showCode}
          className={!showCode ? "on" : ""}
          onClick={() => setShowCode(false)}
        >
          그림
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={showCode}
          className={showCode ? "on" : ""}
          onClick={() => setShowCode(true)}
        >
          코드
        </button>
      </div>

      <div className="algo-player-pane">
        <div className="algo-player-stage" data-hidden-narrow={showCode}>
          {stage(step.stage)}
          <p className="algo-player-note">{at < 0 ? "▶ 를 눌러 한 칸씩 넘겨 보세요" : step.note}</p>
          <p className="algo-player-vars">
            {Object.entries(step.vars)
              .map(([k, v]) => `${k} = ${v}`)
              .join("   ")}
          </p>
        </div>

        <ol className="algo-player-code" data-hidden-narrow={!showCode}>
          {tape.code.map((line, i) => (
            <li key={i} className={at >= 0 && step.line === i + 1 ? "on" : ""}>
              <span className="algo-code-ln">{i + 1}</span>
              {line}
            </li>
          ))}
        </ol>
      </div>

      <div className="algo-player-ctl">
        <button type="button" onClick={() => jump(-1)} aria-label="한 칸 뒤로">
          ◀
        </button>
        <button type="button" onClick={toggle} className="algo-play">
          {playing ? "❚❚ 멈춤" : "▶ 재생"}
        </button>
        <button type="button" onClick={() => jump(1)} aria-label="한 칸 앞으로">
          ▶
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setAt(-1);
          }}
        >
          처음
        </button>
        <span className="algo-player-count">
          {at + 1} / {tape.steps.length}
        </span>
      </div>

      {tape.truncated && (
        <p className="algo-player-truncated">입력이 커서 여기까지만 보여 줍니다</p>
      )}
    </figure>
  );
}
