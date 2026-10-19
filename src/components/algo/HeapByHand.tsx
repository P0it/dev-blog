"use client";

import { useState } from "react";
import type { CellState, StageState } from "@/lib/algo/types";
import { WARD, NEWCOMER, parentOf, shouldRise, riseStep } from "@/lib/algo/heap";
import { josa } from "@/lib/algo/josa";
import { StageHeap } from "./StageHeap";

export type HeapResult = {
  /** 독자가 처음에 고른 예상(몇 번 올라갈까) */
  guess: number;
  /** 실제로 올라간 횟수 */
  ups: number;
};

/** 예상 선택지 — 정답(2번)이 첫 번째·두 번째가 아니라 위치로 찍을 수 없다. */
const GUESSES = [0, 1, 2] as const;

/** 지금 배열과 올라가는 칸 `i` 로 그림 한 장을 만든다. 새 환자는 current, 견줄 부모는 compare. */
function stageOf(heap: number[], i: number, done: boolean): StageState {
  const cells: CellState[] = heap.map((_, k) => (k === i ? (done ? "settled" : "current") : "out"));
  const flags: Record<string, number> = {};
  if (!done && i > 0) {
    cells[parentOf(i)] = "compare";
    flags.p = parentOf(i);
  }
  return { cells, flags, values: heap };
}

/**
 * ① 직접 해 보기 — 응급실 접수대에서 새 환자를 위로 올려 본다.
 *
 * 알고리즘 용어가 없고 타이핑도 없다. **먼저 예상을 고른다**(몇 번 올라갈까).
 * 허용하는 동작은 부모 자리와 견주는 것뿐이다 — 「위로 올리기」나 연결된 위 자리를 누르면 한 번 견주고,
 * 부모보다 급하면 바꾼다. 다른 자리를 누르면 이유를 말한다. 그래서 ② 되짚기가 ① 을 반증하지 않는다.
 * 처음부터를 누르면 ② 도 다시 숨는다(`onDone(null)`).
 */
export function HeapByHand({ onDone }: { onDone?: (r: HeapResult | null) => void }) {
  const START = [...WARD, NEWCOMER];
  const [guess, setGuess] = useState<number | null>(null);
  const [heap, setHeap] = useState<number[]>(START);
  const [i, setI] = useState(START.length - 1);
  const [ups, setUps] = useState(0);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const rise = () => {
    if (guess === null || done) return;
    const p = parentOf(i);
    if (!shouldRise(heap, i)) {
      // 이 입력은 맨 위에 닿아 끝나지만, 부모가 더 급한 경우의 이유도 같은 자리에서 말해 둔다
      finish(heap, i, ups, `부모 ${josa(heap[p], "이", "가")} 더 급해서(숫자가 더 작아서) 안 바뀝니다. 여기서 멈춥니다`);
      return;
    }
    const r = riseStep(heap, i);
    const text = `새 환자 ${josa(heap[i], "이", "가")} 부모 ${heap[p]}보다 급합니다. 자리를 바꿔 ${r.i}번 자리로 올라갑니다`;
    setHeap(r.heap);
    setI(r.i);
    setUps(ups + 1);
    if (r.i === 0 || !shouldRise(r.heap, r.i)) {
      finish(
        r.heap,
        r.i,
        ups + 1,
        r.i === 0 ? "맨 위에 닿았습니다. 가장 급한 환자가 맨 위에 앉았습니다" : `${text}. 부모가 더 급해서 여기서 멈춥니다`,
      );
    } else {
      setMsg({ ok: true, text });
    }
  };

  const finish = (h: number[], at: number, n: number, text: string) => {
    setDone(true);
    setHeap(h);
    setI(at);
    setMsg({ ok: true, text });
    onDone?.({ guess: guess ?? 0, ups: n });
  };

  const pick = (k: number) => {
    if (guess === null || done) return;
    if (k === parentOf(i) && i > 0) return rise();
    if (k === i) {
      setMsg({ ok: false, text: "지금 올라가는 환자입니다. 선으로 이어진 바로 위 자리와 견줘 보세요" });
      return;
    }
    setMsg({
      ok: false,
      text: "그 자리와는 바꿀 수 없어요. 바로 위로 이어진 부모 자리와만 견주고 바꿉니다",
    });
  };

  const reset = () => {
    setGuess(null);
    setHeap(START);
    setI(START.length - 1);
    setUps(0);
    setDone(false);
    setMsg(null);
    onDone?.(null);
  };

  return (
    <section className="algo-byhand" aria-label="응급실 접수대에서 새 환자를 위로 올려 보기">
      <p className="algo-byhand-ask">
        응급실 접수대입니다. 환자 카드의 숫자가 <b>작을수록 급합니다</b>. 가장 급한 환자가 <b>맨 위 자리</b>에 앉아야 합니다.
        <br />
        숫자 <b>{NEWCOMER}</b> 인 새 환자가 맨 아래 빈자리에 앉았습니다.
      </p>

      {guess === null ? (
        <div className="algo-heap-predict" role="group" aria-label="예상 고르기">
          <p className="algo-byhand-ask">
            <b>새 환자는 몇 번 자리를 바꿔 올라갈까요?</b> 먼저 골라 보세요.
          </p>
          <div className="algo-pairs-btns">
            {GUESSES.map((g) => (
              <button key={g} type="button" onClick={() => setGuess(g)}>
                {g === 0 ? "0번 — 앉은 자리 그대로" : `${g}번`}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="algo-heap-hand">
            <StageHeap state={stageOf(heap, i, done)} onPick={pick} />
          </div>
          <div className="algo-pairs-btns">
            <button type="button" className="algo-heap-go" onClick={rise} disabled={done}>
              위로 올리기
            </button>
          </div>
          <p className="algo-heap-guess">
            내 예상 <b>{guess}번</b>
            {!done && i > 0 && (
              <>
                {" "}
                · 새 환자 <b>{heap[i]}</b> 의 부모는 <b>{heap[parentOf(i)]}</b>
              </>
            )}
          </p>
        </>
      )}

      {msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          올라간 횟수 <b>{ups}</b>
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
