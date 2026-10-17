"use client";

import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import type { StageState, Tape } from "@/lib/algo/types";
import { clampStep } from "./clamp-step";

/**
 * 코드 한 줄과 그림이 맞물려 도는 플레이어.
 *
 * - **독자가 눌러야만 넘어간다.** 자동 재생은 없다 — 저절로 넘어가면 그림과 코드를 맞춰 볼
 *   틈 없이 지나간다(2026-10-17 사용자 지시). 다음 버튼, → 키, 진행 막대로만 움직인다
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

  const last = tape.steps.length - 1;
  const step = at < 0 ? tape.steps[0] : tape.steps[at];

  const jump = (d: number) => setAt((prev) => clampStep(prev + d, tape.steps.length));
  const restart = () => setAt(-1);

  // 플레이어에 초점이 있을 때 ← → 로 한 칸씩
  const onKey = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return; // 진행 막대는 제 키를 쓴다
    if (e.key === "ArrowRight") jump(1);
    else if (e.key === "ArrowLeft") jump(-1);
    else return;
    e.preventDefault();
  };

  if (tape.steps.length === 0) return null;

  // 에디터 탭에 띄울 파일 이름 — 첫 def 의 함수 이름을 쓴다
  const file = `${/def (\w+)/.exec(tape.code.join(" "))?.[1] ?? "main"}.py`;

  return (
    <figure
      className="algo-player"
      aria-label={title ?? "코드와 그림이 함께 도는 플레이어"}
      tabIndex={0}
      onKeyDown={onKey}
    >
      <div className="algo-player-pane">
        <div className="algo-player-stage">
          {stage(step.stage)}
          <p className="algo-player-note">{at < 0 ? "다음을 눌러 한 줄씩 넘겨 보세요" : step.note}</p>
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

      {/* 조작 막대 — 처음·뒤로·다음 + 진행 막대. 막대를 끌면 원하는 스텝으로 바로 간다 */}
      <div className="algo-player-ctl">
        <div className="algo-ctl-btns">
          <button type="button" className="algo-ctl" onClick={restart} aria-label="처음으로" title="처음으로">
            <Icon d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
          </button>
          <button
            type="button"
            className="algo-ctl"
            onClick={() => jump(-1)}
            disabled={at < 0}
            aria-label="한 줄 뒤로"
            title="한 줄 뒤로 (←)"
          >
            <Icon d="M15 5l-7 7 7 7" />
          </button>
          <button
            type="button"
            className="algo-ctl algo-next-btn"
            onClick={() => jump(1)}
            disabled={at >= last}
            title="한 줄 앞으로 (→)"
          >
            {at >= last ? "끝" : "다음"}
            <Icon d="M9 5l7 7-7 7" />
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
          onChange={(e) => setAt(Number(e.target.value) - 1)}
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
function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
