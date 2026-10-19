"use client";

import { useState } from "react";
import {
  MEETINGS,
  NAMES,
  greedyPick,
  bestCount,
  pickCheck,
  stageFromPicks,
  namesOf,
  type Kind,
} from "@/lib/algo/activity-selection";
import { StageTimeline } from "./StageTimeline";

export type MeetResult = {
  /** 독자가 처음에 고른 예상(GUESSES 의 번호) */
  guess: number;
  /** 예상이 맞았는지 */
  predicted: boolean;
  /** 독자가 직접 고른 회의 수 */
  mine: number;
  /** 세 기준이 각각 잡는 회의 수 */
  counts: Record<Kind, number>;
  /** 모든 경우를 따져 본 최선의 회의 수 */
  best: number;
};

/** 예상 선택지 — 정답(끝나는 시간)이 세 번째다. */
export const GUESSES = [
  { short: "시작이 빠른 것부터", label: "시작이 빠른 회의부터 고른다" },
  { short: "짧은 것부터", label: "짧은 회의부터 고른다" },
  { short: "끝나는 시간이 빠른 것부터", label: "끝나는 시간이 빠른 회의부터 고른다", correct: true },
] as const;

const KINDS: { kind: Kind; label: string }[] = [
  { kind: "start", label: "시작이 빠른 순" },
  { kind: "short", label: "짧은 순" },
  { kind: "end", label: "끝나는 시간 순" },
];

const range = (i: number) => `${NAMES[i]} 회의(${MEETINGS[i][0]}~${MEETINGS[i][1]}시)`;

/**
 * ① 직접 해 보기 — 회의실 하나에 회의를 가장 많이 잡는다.
 *
 * 알고리즘 용어가 없고 타이핑도 없다. **먼저 예상을 고른다**(세 방법 가운데 가장 많이 잡는 방법은?).
 * 허용하는 동작은 실제 문제의 규칙 그대로다 — 이미 고른 회의와 시간이 겹치면 못 고르고, 어느 회의와 겹치는지 말한다.
 * 다 골랐으면 세 기준(시작이 빠른 순·짧은 순·끝나는 시간 순)이 자동으로 고른 결과를 하나씩 눌러 본다.
 * 시작 순·짧은 순이 번번이 지는 걸 겪어야 ② 되짚기가 열린다. 처음부터를 누르면 ② 도 다시 숨는다(`onReset`).
 */
export function MeetByHand({ onDone, onReset }: { onDone?: (r: MeetResult) => void; onReset?: () => void }) {
  const [guess, setGuess] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [viewed, setViewed] = useState<Kind[]>([]);
  const [active, setActive] = useState<Kind | null>(null);
  const [flash, setFlash] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const pick = (i: number) => {
    if (guess === null || finished) return;
    const r = pickCheck(MEETINGS, selected, i);
    if (!r.ok) {
      setFlash([i, r.with]);
      setMsg({ ok: false, text: `${range(i)}는 이미 고른 ${range(r.with)}와 시간이 겹쳐요` });
      return;
    }
    setFlash([]);
    if (r.action === "remove") {
      setSelected(selected.filter((k) => k !== i));
      setMsg({ ok: true, text: `${NAMES[i]} 회의를 뺐어요` });
    } else {
      setSelected([...selected, i]);
      setMsg({ ok: true, text: `${NAMES[i]} 회의를 골랐어요` });
    }
  };

  const show = (kind: Kind) => {
    setActive(kind);
    const next = viewed.includes(kind) ? viewed : [...viewed, kind];
    setViewed(next);
    if (next.length === KINDS.length && guess !== null) {
      const counts = {
        start: greedyPick(MEETINGS, "start").length,
        short: greedyPick(MEETINGS, "short").length,
        end: greedyPick(MEETINGS, "end").length,
      };
      const g = GUESSES[guess];
      onDone?.({
        guess,
        predicted: "correct" in g && g.correct === true,
        mine: selected.length,
        counts,
        best: bestCount(MEETINGS),
      });
    }
  };

  const reset = () => {
    setGuess(null);
    setSelected([]);
    setFinished(false);
    setViewed([]);
    setActive(null);
    setFlash([]);
    setMsg(null);
    onReset?.();
  };

  const shown = active ? greedyPick(MEETINGS, active) : selected;
  const state = stageFromPicks(MEETINGS, shown, { dim: active !== null });
  const clickable = guess !== null && !finished;

  return (
    <section className="algo-byhand" aria-label="회의를 가장 많이 잡아 보기">
      <p className="algo-byhand-ask">
        회의실은 하나이고 회의 여섯 개가 신청돼 있습니다. 막대는 그 회의가 차지하는 시간입니다.
        <br />
        <b>겹치지 않게 가장 많은 회의</b>를 잡으세요. 끝나는 시각에 다른 회의가 시작하는 건 겹치지 않습니다.
      </p>

      <StageTimeline state={state} onPick={clickable ? pick : undefined} flash={flash} />

      {guess === null ? (
        <div className="algo-meet-predict" role="group" aria-label="예상 고르기">
          <p className="algo-byhand-ask">
            <b>세 방법 가운데 가장 많이 잡는 방법은 무엇일까요?</b> 먼저 골라 보세요.
          </p>
          <div className="algo-pairs-btns">
            {GUESSES.map((g, k) => (
              <button key={k} type="button" onClick={() => setGuess(k)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="algo-meet-guess">
          내 예상 <b>{GUESSES[guess].short}</b>
          {!finished && (
            <>
              {" "}
              · 회의 막대를 눌러 직접 골라 보세요. 고른 회의 <b>{selected.length}</b>개
            </>
          )}
        </p>
      )}

      {guess !== null && !finished && (
        <div className="algo-pairs-btns">
          <button
            type="button"
            className="algo-meet-go"
            disabled={selected.length === 0}
            onClick={() => {
              setFinished(true);
              setMsg(null);
              setFlash([]);
            }}
          >
            다 골랐어요
          </button>
        </div>
      )}

      {finished && (
        <div className="algo-meet-compare">
          <p className="algo-byhand-ask">
            내가 고른 회의는 <b>{selected.length}개</b>({namesOf(selected)})입니다. 이제 세 방법이 고른 결과를 눌러 보세요.
          </p>
          <div className="algo-pairs-btns">
            {KINDS.map(({ kind, label }) => (
              <button
                key={kind}
                type="button"
                aria-pressed={active === kind}
                data-new={viewed.includes(kind) ? undefined : true}
                onClick={() => show(kind)}
              >
                {label}
              </button>
            ))}
          </div>
          {viewed.length > 0 && (
            <ul className="algo-meet-tally">
              {KINDS.filter((k) => viewed.includes(k.kind)).map(({ kind, label }) => {
                const p = greedyPick(MEETINGS, kind);
                return (
                  <li key={kind}>
                    <b>{label}</b> → {p.length}개 ({namesOf(p)})
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          {finished ? (
            <>
              본 방법 <b>{viewed.length}</b> / {KINDS.length}
            </>
          ) : (
            <>
              고른 회의 <b>{selected.length}</b>개
            </>
          )}
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
