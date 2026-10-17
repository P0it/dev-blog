"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { StageState, Tape } from "@/lib/algo/types";
import { clampStep } from "./clamp-step";

const TICK_MS = 900;

/**
 * 코드 한 줄과 그림이 맞물려 도는 플레이어.
 *
 * - **처음에는 멈춰 있다.** 자동 재생하지 않는다. 독자가 설명을 읽기 전에 중반을 지나가면 안 된다
 * - **그림은 왼쪽, 코드는 오른쪽.** 넓은 화면 전용이다 — 줄이 켜지는 순간 그림이 바뀌는 걸
 *   눈을 옮기지 않고 같이 본다. 위아래로 쌓거나 탭으로 가르면 그 연결이 끊긴다
 * - 코드는 블로그 글 코드 블록과 같은 에디터 창(One Dark Pro)이다
 * - 서버에서 그려지는 첫 모습이 **스텝 0** 이라, 스크립트가 꺼져도 코드 전문과 첫 상태가 읽힌다
 */
export function TapePlayer({
  tape,
  stage,
  title,
}: {
  tape: Tape;
  stage: (s: StageState) => ReactNode;
  title?: string;
}) {
  const [at, setAt] = useState(-1);
  const [playing, setPlaying] = useState(false);
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

  const restart = () => {
    setPlaying(false);
    setAt(-1);
  };

  const toggle = () => {
    if (playing) return setPlaying(false);
    if (at >= last) setAt(-1);
    setPlaying(true);
  };

  if (tape.steps.length === 0) return null;

  // 에디터 탭에 띄울 파일 이름 — 첫 def 의 함수 이름을 쓴다
  const file = `${/def (\w+)/.exec(tape.code.join(" "))?.[1] ?? "main"}.py`;

  return (
    <figure className="algo-player" aria-label={title ?? "코드와 그림이 함께 도는 플레이어"}>
      <div className="algo-player-pane">
        <div className="algo-player-stage">
          {stage(step.stage)}
          <p className="algo-player-note">{at < 0 ? "▶ 를 눌러 한 칸씩 넘겨 보세요" : step.note}</p>
          <p className="algo-player-vars">
            {Object.entries(step.vars)
              .map(([k, v]) => `${k} = ${v}`)
              .join("   ")}
          </p>
        </div>

        <div className="algo-editor">
          <div className="algo-editor-head">
            <span className="algo-editor-file">{file}</span>
          </div>
          <ol className="algo-player-code">
            {tape.code.map((line, i) => (
              <li key={i} className={at >= 0 && step.line === i + 1 ? "on" : ""}>
                <span className="algo-code-ln">{i + 1}</span>
                {tape.html ? <span dangerouslySetInnerHTML={{ __html: tape.html[i] }} /> : line}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 조작 막대 — 처음·뒤로·재생·앞으로 + 진행 막대. 막대를 끌면 원하는 스텝으로 바로 간다 */}
      <div className="algo-player-ctl">
        <div className="algo-ctl-btns">
          <button type="button" className="algo-ctl" onClick={restart} aria-label="처음으로" title="처음으로">
            <Icon d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
          </button>
          <button type="button" className="algo-ctl" onClick={() => jump(-1)} aria-label="한 칸 뒤로" title="한 칸 뒤로">
            <Icon d="M18 6 9 12l9 6V6zM6 6v12" fill />
          </button>
          <button
            type="button"
            className="algo-ctl algo-play"
            onClick={toggle}
            aria-label={playing ? "멈춤" : "재생"}
            title={playing ? "멈춤" : "재생"}
          >
            {playing ? <Icon d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill /> : <Icon d="M8 5.5v13l10.5-6.5L8 5.5z" fill />}
          </button>
          <button type="button" className="algo-ctl" onClick={() => jump(1)} aria-label="한 칸 앞으로" title="한 칸 앞으로">
            <Icon d="M6 6l9 6-9 6V6zM18 6v12" fill />
          </button>
        </div>

        <input
          type="range"
          className="algo-scrub"
          min={0}
          max={tape.steps.length}
          value={at + 1}
          aria-label="스텝 위치"
          style={{ "--p": `${((at + 1) / tape.steps.length) * 100}%` } as CSSProperties}
          onChange={(e) => {
            setPlaying(false);
            setAt(Number(e.target.value) - 1);
          }}
        />

        <span className="algo-player-count">
          <b>{at + 1}</b> / {tape.steps.length}
        </span>
      </div>

      {tape.truncated && (
        <p className="algo-player-truncated">입력이 커서 여기까지만 보여 줍니다</p>
      )}
    </figure>
  );
}

/** 조작 버튼 아이콘. 글리프(◀ ▶)는 글꼴마다 굵기·기준선이 달라 버튼 안에서 들썩인다 */
function Icon({ d, fill }: { d: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"
      fill={fill ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth={fill ? 1.6 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
