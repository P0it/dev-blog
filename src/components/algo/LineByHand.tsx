"use client";

import { useState } from "react";
import { LINE_PEOPLE, NEW_PERSON, PREDICT_OPTIONS, initLine, press, place } from "@/lib/algo/array-list";

export type LineResult = { moved: number; predictedRight: boolean; predicted: string };

/**
 * ① 직접 해 보기 — 줄 선 7명 맨 앞에 새 사람을 세운다.
 *
 * 알고리즘 용어가 없다. 먼저 **예상**을 고르게 한다(맨 앞이 덜 미나, 맨 뒤가 덜 미나).
 * 그다음 독자가 **빈자리 바로 앞 사람부터** 한 명씩 눌러 한 칸 뒤로 보낸다 — 코드가 하는 순서와 같다.
 * 앞쪽 사람을 눌러 보면 "뒤 사람 자리를 덮어쓴다"고 막는다. 허용하는 동작이 곧 알고리즘의 동작이라
 * ② 되짚기가 ① 을 반증하지 않는다.
 */
export function LineByHand({ onDone, onReset }: { onDone?: (r: LineResult) => void; onReset?: () => void }) {
  const [line, setLine] = useState(() => initLine(LINE_PEOPLE));
  const [pick, setPick] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const locked = pick === null;

  const tapPerson = (i: number) => {
    if (locked || line.placed) return;
    const r = press(line, i);
    setLine(r.line);
    setMsg(r.text ? { ok: r.ok, text: r.text } : null);
  };

  const tapPlace = () => {
    if (locked) return;
    const r = place(line, NEW_PERSON);
    setLine(r.line);
    setMsg(r.text ? { ok: r.ok, text: r.text } : null);
    if (r.ok && pick !== null) {
      onDone?.({
        moved: r.line.moved,
        predictedRight: PREDICT_OPTIONS[pick].correct === true,
        predicted: PREDICT_OPTIONS[pick].label,
      });
    }
  };

  const reset = () => {
    setLine(initLine(LINE_PEOPLE));
    setPick(null);
    setMsg(null);
    onReset?.();
  };

  return (
    <section className="algo-byhand algo-line" aria-label="새 사람을 맨 앞에 세우기">
      <p className="algo-byhand-ask">
        번호표를 든 {LINE_PEOPLE.length}명이 줄을 서 있습니다. 새로 온 {NEW_PERSON}번 사람을 <b>맨 앞</b>에 세우려고 합니다.
      </p>

      {locked ? (
        <div className="algo-line-predict" role="group" aria-label="먼저 예상하기">
          <p className="algo-line-q">
            먼저 예상해 보세요. 맨 앞에 끼우기와 맨 뒤에 붙이기 중 줄 선 사람을 <b>덜 미는</b> 쪽은 어디일까요?
          </p>
          <div className="algo-guess">
            {PREDICT_OPTIONS.map((o, i) => (
              <button key={i} type="button" onClick={() => setPick(i)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="algo-line-guess">
          내 예상 — <b>{PREDICT_OPTIONS[pick].label}</b>
        </p>
      )}

      <div className="algo-line-stage" data-locked={locked}>
        <div className="algo-gap-wait" data-gone={line.placed}>
          <span>새로 온 사람</span>
          <div className="algo-cell algo-cell-waiting">
            <span className="algo-cell-value">{NEW_PERSON}</span>
          </div>
        </div>

        <div className="algo-track-cells">
          {line.slots.map((v, i) =>
            v === null ? (
              <div key={i} className="algo-cell algo-gap-slot" aria-label="빈자리">
                <span className="algo-cell-value" aria-hidden="true" />
              </div>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => tapPerson(i)}
                className={`algo-cell ${line.placed && i === 0 ? "algo-cell-settled" : "algo-cell-out"}`}
                disabled={locked || line.placed}
                aria-label={`${v}번 사람`}
              >
                <span className="algo-cell-value">{v}</span>
              </button>
            ),
          )}
        </div>
        <div className="algo-track-flags">
          {line.slots.map((v, i) => (
            <span key={i} className="algo-flag">
              {v === null ? "빈자리" : ""}
            </span>
          ))}
        </div>

        {!locked && !line.placed && (
          <p className="algo-line-how">
            빈자리 <b>바로 앞 사람</b>을 눌러 한 칸씩 뒤로 보내세요. 앞쪽 사람부터 밀면 뒤 사람 자리를 덮어씁니다.
          </p>
        )}

        <div className="algo-line-go">
          <button type="button" className="algo-go" onClick={tapPlace} disabled={locked || line.placed || line.gap !== 0}>
            {line.placed ? "맨 앞에 섰습니다" : `${NEW_PERSON}번 사람을 맨 앞에 세우기`}
          </button>
          {!line.placed && !locked && line.gap !== 0 && <span>맨 앞이 비면 누를 수 있어요</span>}
        </div>
      </div>

      {msg && (
        <p className="algo-line-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          밀어낸 횟수 <b>{line.moved}</b>
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
