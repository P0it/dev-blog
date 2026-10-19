"use client";

import { useState } from "react";
import { SEARCH_ARR, SEARCH_TARGET, SEARCH_MISSING, canOpen, linearSearch } from "@/lib/algo/linear-search";
import { josa } from "@/lib/algo/josa";

export type LockerResult = { opens: number; predicted: boolean; guess: string };

/** 찾는 번호 4 가 어느 칸에 있을까. 번호표가 섞여 있어서 열어 보기 전에는 알 수 없다 — 정답은 세 번째. */
const PREDICT = [
  { label: "2번 칸" },
  { label: "11번 칸" },
  { label: "열어 보기 전에는 알 수 없다", correct: true },
];

/**
 * ① 직접 해 보기 — 닫힌 사물함 12칸에서 번호표를 찾는다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 열 수 있는 칸은 **다음 칸 하나뿐**이다 — 번호표가 섞여 있어서
 * 건너뛰어 열면 찾는 번호를 놓칠 수 있기 때문이다. 여기서 허용하는 동작이 곧 선형 탐색의 동작이라
 * ② 되짚기가 ① 을 반증하지 않는다. 시작 전에 **예측** 한 번을 한다 — 섞여 있다는 걸 겪게 하려는 문제다.
 * 찾은 뒤에는 없는 번호도 찾아 본다. 다 열어야 없다고 말할 수 있다는 걸 겪는다.
 */
export function LockerByHand({
  onDone,
  onMissing,
  onReset,
}: {
  onDone?: (r: LockerResult) => void;
  onMissing?: (opens: number) => void;
  onReset?: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [target, setTarget] = useState(SEARCH_TARGET);
  const [opened, setOpened] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [foundFirst, setFoundFirst] = useState(false);

  const n = SEARCH_ARR.length;
  const at = linearSearch(SEARCH_ARR, target);
  const finished = at === -1 ? opened >= n : opened > at;
  const missing = target === SEARCH_MISSING;

  const open = (i: number) => {
    if (finished || i < opened) return;
    if (!canOpen(opened, i)) {
      setMsg({
        ok: false,
        text: `번호표가 섞여 있어서 건너뛰어 열면 ${josa(target, "을", "를")} 놓칠 수 있어요. 앞 칸부터 차례로 열어야 해요.`,
      });
      return;
    }
    const next = opened + 1;
    setOpened(next);
    setMsg(null);
    if (!missing && i === at) {
      setFoundFirst(true);
      onDone?.({
        opens: next,
        predicted: picked !== null && PREDICT[picked].correct === true,
        guess: picked !== null ? PREDICT[picked].label : "",
      });
    }
    if (missing && next >= n) {
      setMsg({ ok: true, text: `${n}칸을 다 열고 나서야 ${josa(target, "은", "는")} 없다고 말할 수 있어요.` });
      onMissing?.(next);
    }
  };

  const startMissing = () => {
    setTarget(SEARCH_MISSING);
    setOpened(0);
    setMsg(null);
  };

  const reset = () => {
    setPicked(null);
    setTarget(SEARCH_TARGET);
    setOpened(0);
    setMsg(null);
    setFoundFirst(false);
    onReset?.();
  };

  return (
    <section className="algo-byhand" aria-label="사물함에서 번호표 찾기">
      <p className="algo-byhand-ask">
        {finished
          ? missing
            ? "없는 번호도 끝까지 열어 봤습니다"
            : "찾았습니다"
          : "사물함 12칸에 번호표가 하나씩 들어 있습니다. 칸 번호는 0번부터입니다. 열 수 있는 칸은 다음 칸 하나뿐입니다"}
      </p>

      <p className="algo-lsearch-target">
        찾는 번호 <b>{target}</b>
      </p>

      {picked === null ? (
        <div className="algo-quiz">
          <p className="algo-quiz-q">
            <strong>먼저 맞혀 보세요. 번호표 {josa(target, "은", "는")} 몇 번 칸에 들어 있을까요?</strong>
          </p>
          {PREDICT.map((o, i) => (
            <button key={i} type="button" className="algo-opt" onClick={() => setPicked(i)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className="algo-lsearch-guess">
            내 예상 <b>{PREDICT[picked].label}</b>
          </p>
          <div className="algo-track-cells" role="group" aria-label="사물함 12칸">
            {SEARCH_ARR.map((v, i) => {
              const isOpen = i < opened;
              const hit = isOpen && !missing && i === at;
              const state = hit
                ? "algo-cell-settled"
                : isOpen
                  ? "algo-cell-out algo-lsearch-open"
                  : i === opened && !finished
                    ? "algo-cell-current"
                    : "algo-cell-out";
              return (
                <button
                  key={i}
                  type="button"
                  className={`algo-cell ${state}`}
                  onClick={() => open(i)}
                  aria-label={isOpen ? `${i}번 칸, 번호표 ${v}` : `${i}번 칸, 닫혀 있음`}
                >
                  <span className="algo-cell-value">{isOpen ? v : "?"}</span>
                  <span className="algo-cell-index">{i}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {msg && (
        <p className="algo-lsearch-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          연 칸 <b>{opened}</b>
        </span>
        <span className="algo-lsearch-foot-btns">
          {finished && foundFirst && !missing && (
            <button type="button" onClick={startMissing}>
              없는 번호 {SEARCH_MISSING} 도 찾아 보기
            </button>
          )}
          <button type="button" onClick={reset}>
            처음부터
          </button>
        </span>
      </div>
    </section>
  );
}
