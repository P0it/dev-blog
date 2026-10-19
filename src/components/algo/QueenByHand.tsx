"use client";

import { useState } from "react";
import { QUEEN_N, attackedBy, attackReason, nextCol } from "@/lib/algo/n-queens";
import { josa } from "@/lib/algo/josa";
import { QueenBoard, QueenLegend } from "./QueenBoard";

export type QueenResult = { backs: number; places: number; guessLabel: string; predicted: boolean };

/** 첫 줄 맨 왼쪽(칸 0)에 놓으면 끝까지 놓을 수 있을까 — 이 보드에서는 안 된다(정답은 첫 번째). */
const PREDICT = [{ label: "안 된다" }, { label: "된다" }, { label: "놓아 봐야 안다" }];
const CORRECT = 0;

const N = QUEEN_N;

/**
 * ① 직접 해 보기 — 4×4 보드에 퀸 4개를 서로 노리지 않게 놓는다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. **위 줄부터 한 줄에 하나씩** 놓고, 놓을 수 있는 칸 중 **가장 왼쪽 칸부터** 시도한다 —
 * 여기서 허용하는 동작이 곧 백트래킹의 동작이라 ② 되짚기가 ① 을 반증하지 않는다. 다음 줄에 놓을 곳이 없으면
 * 「앞 줄 퀸 거두기」만 누를 수 있고, 거둔 퀸이 있던 칸은 그 줄에서 다음 칸부터 다시 시도한다.
 * 먼저 **예측** 한 번을 한다 — 첫 줄 맨 왼쪽에 놓으면 끝까지 갈 수 있을까. ④ 플레이어와 같은 보드를 쓴다.
 * 모두 놓으면 `onDone`, 처음부터를 누르면 `onReset`.
 */
export function QueenByHand({ onDone, onReset }: { onDone?: (r: QueenResult) => void; onReset?: () => void }) {
  const [guess, setGuess] = useState<number | null>(null);
  const [at, setAt] = useState<number[]>(() => Array(N).fill(-1));
  const [start, setStart] = useState<number[]>(() => Array(N).fill(0)); // 줄마다 여기서부터 시도한다
  const [places, setPlaces] = useState(0);
  const [backs, setBacks] = useState(0);
  const [notice, setNotice] = useState("");

  const row = at.findIndex((c) => c < 0) === -1 ? N : at.findIndex((c) => c < 0); // 지금 놓을 줄
  const finished = row === N;
  const stuck = !finished && nextCol(at, row, start[row], N) === null;

  const click = (r: number, c: number) => {
    if (guess === null) return setNotice("먼저 맞혀 보세요. 위의 세 가지 중에 골라 주세요.");
    if (finished) return;
    if (r !== row) return setNotice(`지금은 줄 ${row} 에 놓을 차례예요. 위 줄부터 한 줄에 하나씩 놓아요.`);
    const by = attackedBy(at, r, c);
    if (by) return setNotice(`칸 ${c} 에는 놓을 수 없어요. ${attackReason(by)}.`);
    if (c < start[row]) return setNotice(`칸 ${josa(c, "은", "는")} 이미 해 봤어요. 그 오른쪽 칸부터 다시 시도해요.`);
    const first = nextCol(at, row, start[row], N);
    if (first !== c) return setNotice(`왼쪽 칸부터 차례로 시도해요. 칸 ${josa(first ?? 0, "이", "가")} 먼저예요.`);

    const next = [...at];
    next[row] = c;
    const nextStart = [...start];
    if (row + 1 < N) nextStart[row + 1] = 0;
    setAt(next);
    setStart(nextStart);
    const p = places + 1;
    setPlaces(p);
    if (row + 1 === N) {
      setNotice(`퀸 ${N}개를 모두 놓았어요. 서로 노리는 퀸이 없어요.`);
      onDone?.({ backs, places: p, guessLabel: PREDICT[guess].label, predicted: guess === CORRECT });
    } else {
      setNotice("");
    }
  };

  const retract = () => {
    if (finished) return;
    if (!stuck) return setNotice("아직 놓을 수 있는 칸이 있어요. 밝은 칸을 눌러 보세요.");
    const prev = row - 1;
    const c0 = at[prev];
    const next = [...at];
    next[prev] = -1;
    const nextStart = [...start];
    nextStart[prev] = c0 + 1;
    setAt(next);
    setStart(nextStart);
    setBacks(backs + 1);
    setNotice(`줄 ${prev}, 칸 ${c0} 의 퀸을 거뒀어요. 줄 ${prev} 에서 그 오른쪽 칸부터 다시 시도해요.`);
  };

  const reset = () => {
    setGuess(null);
    setAt(Array(N).fill(-1));
    setStart(Array(N).fill(0));
    setPlaces(0);
    setBacks(0);
    setNotice("");
    onReset?.();
  };

  const ask =
    guess === null
      ? `${N}×${N} 보드에 퀸 ${N}개를 서로 노리지 않게 놓아요. 퀸은 같은 줄·같은 열·대각선에 있는 칸을 노려요. 첫 줄 맨 왼쪽(칸 0)에 놓으면 끝까지 놓을 수 있을까요?`
      : finished
        ? `내 예상 「${PREDICT[guess].label}」 — ${guess === CORRECT ? "맞았습니다" : "달랐습니다"}`
        : stuck
          ? `줄 ${row} 에는 놓을 수 있는 칸이 없어요. 앞 줄 퀸을 거둬야 해요`
          : `목표: 퀸 ${N}개를 서로 못 보게 놓기. 줄 ${row} 의 밝은 칸 중 가장 왼쪽 칸을 눌러 보세요`;

  return (
    <section className="algo-byhand" aria-label="퀸 놓아 보기">
      <p className="algo-byhand-ask">{ask}</p>

      {guess === null && (
        <div className="algo-queen-guess" role="group" aria-label="끝까지 놓을 수 있을까요?">
          {PREDICT.map((o, i) => (
            <button key={i} type="button" className="algo-opt" onClick={() => setGuess(i)}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      <QueenBoard n={N} at={at} row={row} start={start} onCell={click} />
      <QueenLegend />

      <p className="algo-notice" role="status">
        {notice || " "}
      </p>

      <div className="algo-byhand-foot">
        <span>
          놓은 퀸 <b>{at.filter((c) => c >= 0).length}</b>개 · 거둔 횟수 <b>{backs}</b>번
        </span>
        <span className="algo-queen-foot-btns">
          <button type="button" onClick={retract} className="algo-queen-back" disabled={!stuck || finished}>
            앞 줄 퀸 거두기
          </button>
          <button type="button" onClick={reset}>
            처음부터
          </button>
        </span>
      </div>
    </section>
  );
}
