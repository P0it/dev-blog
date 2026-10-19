"use client";

import { useMemo, useState } from "react";
import { MemoTree } from "./MemoTree";
import { fullTree, replay, memoComputes, memoCalls, plainCalls, fibValue } from "@/lib/algo/memoization";

export const MEMO_N = 6;

export type MemoResult = { computes: number; hits: number; predicted: boolean; guess: string };

/** 수첩을 쓰면 값을 계산하는 일은 몇 번일까 — 정답은 첫 번째. 11번은 호출 횟수라 계산 횟수와 헷갈리기 쉽다. */
const PREDICT = [
  { label: `${memoComputes(MEMO_N)}번`, correct: true },
  { label: `${memoCalls(MEMO_N)}번` },
  { label: `${plainCalls(MEMO_N)}번` },
];

type Msg = { ok: boolean; text: string };

/**
 * ① 직접 해 보기 — fib(6) 의 호출 나무를 위에서부터 한 호출씩 처리한다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 처리할 호출은 **다음 하나뿐**이고 부른 순서를 따른다.
 * 값이 수첩에 없으면 「계산하기」, 있으면 「수첩에서 꺼내 쓰기」 — 여기서 허용하는 동작이 곧 메모이제이션의 동작이다.
 * 꺼내 쓴 호출의 아래 가지는 부르지 않는다. 시작 전에 **예측** 한 번을 한다.
 */
export function MemoByHand({ onDone, onReset }: { onDone?: (r: MemoResult) => void; onReset?: () => void }) {
  const nodes = useMemo(() => fullTree(MEMO_N), []);
  const [picked, setPicked] = useState<number | null>(null);
  const [k, setK] = useState(0);
  const [msg, setMsg] = useState<Msg | null>(null);

  const r = useMemo(() => replay(MEMO_N, k), [k]);
  const next = r.next;
  const nextN = next ? nodes[next.id].n : null;

  const press = (kind: "compute" | "hit") => {
    if (!next || nextN === null) return;
    if (kind !== next.kind) {
      setMsg(
        next.kind === "hit"
          ? { ok: false, text: `fib(${nextN}) 의 값은 이미 수첩에 적혀 있어요. 다시 계산하지 않고 꺼내 씁니다.` }
          : { ok: false, text: `fib(${nextN}) 의 값은 수첩에 아직 없어요. 처음 나오는 값은 계산해서 적어야 해요.` },
      );
      return;
    }
    const after = replay(MEMO_N, k + 1);
    setK(k + 1);
    setMsg(
      kind === "hit"
        ? { ok: true, text: `fib(${nextN}) 의 값이 수첩에 있어서 꺼내 씁니다. 그 아래 가지는 부르지 않습니다.` }
        : { ok: true, text: `fib(${nextN}) 의 값은 수첩에 없어서 계산합니다.` },
    );
    if (after.finished) {
      onDone?.({
        computes: after.computes,
        hits: after.hits,
        predicted: picked !== null && PREDICT[picked].correct === true,
        guess: picked !== null ? PREDICT[picked].label : "",
      });
    }
  };

  const reset = () => {
    setPicked(null);
    setK(0);
    setMsg(null);
    onReset?.();
  };

  const book = new Map(r.notebook.map((e) => [e.n, e.v]));

  return (
    <section className="algo-byhand" aria-label="호출 나무를 위에서부터 처리하기">
      <p className="algo-byhand-ask">
        {r.finished && picked !== null
          ? `fib(${MEMO_N}) = ${fibValue(MEMO_N)} 을 구했습니다`
          : `fib(n) 은 바로 앞 두 값을 더한 수입니다. fib(0) = 0, fib(1) = 1, fib(2) = 1, fib(3) = 2 …`}
      </p>

      <p className="algo-memo-target">
        목표 <b>fib({MEMO_N}) 의 값 구하기</b>
      </p>

      {picked === null ? (
        <div className="algo-quiz">
          <p className="algo-quiz-q">
            <strong>
              먼저 맞혀 보세요. 값을 적어 두는 수첩을 쓰면 값을 <u>계산하는</u> 일은 몇 번일까요? (나무의 호출은 모두{" "}
              {nodes.length}번입니다)
            </strong>
          </p>
          {PREDICT.map((o, i) => (
            <button key={i} type="button" className="algo-opt" onClick={() => setPicked(i)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className="algo-memo-guess">
            내 예상 <b>{PREDICT[picked].label}</b>
          </p>
          <MemoTree
            nodes={nodes}
            states={r.states}
            nextId={next ? next.id : null}
            label={`fib(${MEMO_N}) 호출 나무. 호출 ${nodes.length}번. 지금까지 ${k}번 처리했다`}
          />

          <p className="algo-memo-legend">
            <span>
              <i data-k="next" />
              다음 호출
            </span>
            <span>
              <i data-k="done" />
              계산해서 수첩에 적음
            </span>
            <span>
              <i data-k="hit" />
              수첩에서 꺼내 씀
            </span>
            <span>
              <i data-k="skip" />
              부르지 않음
            </span>
          </p>

          <div className="algo-memo-strip" role="group" aria-label="수첩">
            <span className="algo-memo-strip-title">수첩</span>
            {Array.from({ length: MEMO_N + 1 }, (_, n) => (
              <span key={n} className="algo-memo-slot" data-filled={book.has(n)} data-now={n === nextN}>
                <small>fib({n})</small>
                <b>{book.has(n) ? book.get(n) : "·"}</b>
              </span>
            ))}
          </div>

          {next && (
            <>
              <p className="algo-memo-ask">
                다음 호출 <b>fib({nextN})</b> 은 어떻게 할까요?
              </p>
              <div className="algo-memo-btns">
                <button type="button" className="algo-memo-btn" data-kind="compute" onClick={() => press("compute")}>
                  계산하기
                </button>
                <button type="button" className="algo-memo-btn" data-kind="hit" onClick={() => press("hit")}>
                  수첩에서 꺼내 쓰기
                </button>
              </div>
            </>
          )}
        </>
      )}

      {msg && (
        <p className="algo-memo-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          계산한 횟수 <b>{r.computes}</b> · 꺼내 쓴 횟수 <b>{r.hits}</b>
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
