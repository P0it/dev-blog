"use client";

import { useState } from "react";
import {
  ACTION_LABEL,
  HAND_EVENTS,
  LINE_START,
  TEACHER,
  evText,
  stepHand,
  type Action,
} from "@/lib/algo/queue-deque";

export type QueueResult = { presses: number; wrong: number; predicted: boolean; order: number[] };

const PREDICT = [
  { label: "4번째" },
  { label: "9번째" },
  { label: "5번째", correct: true },
];

const BASE: Action[] = ["pushBack", "popFront"];
const EXTRA: Action[] = ["pushFront", "popBack"];

/**
 * ① 직접 해 보기 — 급식 줄을 처리한다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 줄에는 처음에 두 버튼뿐이다 — 「줄 맨 뒤에 서기」와 「맨 앞에서 받기」.
 * 여기서 허용하는 동작이 곧 큐의 동작이라 ② 되짚기가 ① 을 반증하지 않는다.
 * 중간에 선생님이 오면 두 버튼으로는 할 수 없어 막힌다. 그때 줄 규칙을 풀면 양쪽 끝 버튼이 열린다.
 * 먼저 **예측** 한 번을 한다 — 5번 손님은 몇 번째로 받을까.
 */
export function QueueByHand({ onDone, onReset }: { onDone?: (r: QueueResult) => void; onReset?: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [line, setLine] = useState<number[]>(LINE_START);
  const [served, setServed] = useState<number[]>([]);
  const [deque, setDeque] = useState(false);
  const [presses, setPresses] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const ev = HAND_EVENTS[idx];
  const finished = idx >= HAND_EVENTS.length;
  const stuck = !!ev && !deque && (ev.kind === "teacher" || ev.kind === "leave");

  const press = (act: Action) => {
    if (finished || picked === null) return;
    const res = stepHand(line, ev, act, deque);
    setPresses(presses + 1);
    setMsg({ ok: res.ok, text: res.text });
    if (!res.ok) {
      setWrong(wrong + 1);
      return;
    }
    setLine(res.line);
    const nextServed = ev.kind === "serve" && res.out !== undefined ? [...served, res.out] : served;
    setServed(nextServed);
    const next = idx + 1;
    setIdx(next);
    if (next >= HAND_EVENTS.length) {
      onDone?.({ presses: presses + 1, wrong, predicted: PREDICT[picked].correct === true, order: nextServed });
    }
  };

  const reset = () => {
    setPicked(null);
    setIdx(0);
    setLine(LINE_START);
    setServed([]);
    setDeque(false);
    setPresses(0);
    setWrong(0);
    setMsg(null);
    onReset?.();
  };

  const buttons = deque ? [...BASE, ...EXTRA] : BASE;

  return (
    <section className="algo-byhand" aria-label="급식 줄 처리해 보기">
      <p className="algo-byhand-ask">
        {finished
          ? "급식 줄을 모두 처리했습니다"
          : "급식 줄에 8명이 서 있습니다. 오는 일을 하나씩 처리하세요. 새 손님은 줄 맨 뒤에 섭니다"}
      </p>

      {picked === null ? (
        <div className="algo-qd-predict">
          <p className="algo-quiz-q">
            <strong>먼저 맞혀 보세요. 선생님이 오지 않는다면 이 줄에서 5번 손님은 몇 번째로 받을까요?</strong>
          </p>
          {PREDICT.map((o, i) => (
            <button key={i} type="button" className="algo-opt" onClick={() => setPicked(i)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="algo-qd-guess">
          내 예상 <b>{PREDICT[picked].label}</b>
        </p>
      )}

      <div className="algo-lane algo-qd-hand" role="img" aria-label={`줄에 ${line.length}명이 서 있습니다`}>
        <span className="algo-lane-label">줄</span>
        <span className="algo-lane-out">← 앞 (받는 곳)</span>
        <ol className="algo-lane-items">
          {line.map((n, i) => (
            <li key={`${n}-${i}`} data-teacher={n === TEACHER ? "" : undefined}>
              {n === TEACHER ? "선생님" : n}
            </li>
          ))}
          {line.length === 0 && <li data-empty>비어 있음</li>}
        </ol>
        <span className="algo-lane-in">뒤 (서는 곳) →</span>
      </div>

      <p className="algo-qd-served">
        <span className="algo-qd-served-label">받은 순서</span>
        {served.length === 0 && <span className="algo-qd-none">아직 없음</span>}
        {served.map((n, i) => (
          <span key={i} className="algo-qd-chip">
            {n === TEACHER ? "선생님" : n}
          </span>
        ))}
      </p>

      {!finished && picked !== null && (
        <>
          <p className="algo-qd-event" aria-live="polite">
            <span>
              일 {idx + 1} / {HAND_EVENTS.length}
            </span>
            <b>{evText(ev)}</b>
          </p>

          <div className="algo-pairs-btns">
            {buttons.map((a) => (
              <button key={a} type="button" data-new={EXTRA.includes(a) ? "" : undefined} onClick={() => press(a)}>
                {ACTION_LABEL[a]}
              </button>
            ))}
            {stuck && (
              <button type="button" className="algo-qd-unlock" onClick={() => setDeque(true)}>
                줄 규칙 풀기
              </button>
            )}
          </div>
        </>
      )}

      {picked !== null && msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          누른 횟수 <b>{presses}</b>
          {wrong > 0 && (
            <>
              {" "}
              · 잘못 누른 횟수 <b>{wrong}</b>
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
