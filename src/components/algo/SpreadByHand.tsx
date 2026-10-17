"use client";

import { useState } from "react";

const COLS = 7;
const ROWS = 5;
const START = 0;

/**
 * ① 직접 해 보기 — 칸을 눌러 벽을 놓고, 소문이 퍼지는 걸 한 걸음씩 돌린다.
 *
 * "가까운 칸부터 물든다"를 손으로 느끼게 하는 게 목적이다. 알고리즘 이름은 아직 안 나온다.
 */
export function SpreadByHand({ onDone }: { onDone?: (steps: number) => void }) {
  const [walls, setWalls] = useState<Set<number>>(new Set([9, 16, 23, 25, 18]));
  const [dist, setDist] = useState<Map<number, number>>(new Map([[START, 0]]));
  const [round, setRound] = useState(0);

  const rc = (i: number) => [Math.floor(i / COLS), i % COLS];

  const spread = () => {
    const next = new Map(dist);
    for (const [i, d] of dist) {
      if (d !== round) continue;
      const [r, c] = rc(i);
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) continue;
        const ni = nr * COLS + nc;
        if (walls.has(ni) || next.has(ni)) continue;
        next.set(ni, round + 1);
      }
    }
    setDist(next);
    setRound(round + 1);
    if (next.size === dist.size) onDone?.(round);
  };

  const toggleWall = (i: number) => {
    if (i === START || round > 0) return;
    setWalls((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const reset = () => {
    setDist(new Map([[START, 0]]));
    setRound(0);
  };

  const reached = dist.size;
  const open = ROWS * COLS - walls.size;

  return (
    <section className="algo-byhand" aria-label="소문 퍼뜨리기">
      <p className="algo-byhand-ask">
        {round === 0
          ? "칸을 눌러 벽을 놓고, 한 걸음씩 퍼뜨려 보세요"
          : `${round}걸음 — ${reached} / ${open}칸에 닿았습니다`}
      </p>

      <div
        className="algo-grid"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 36px))` }}
      >
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const d = dist.get(i);
          const cls = walls.has(i)
            ? "algo-cell-dropped"
            : i === START
              ? "algo-cell-settled"
              : d === round && d !== undefined
                ? "algo-cell-current"
                : d !== undefined
                  ? "algo-cell-compare"
                  : "algo-cell-out";
          return (
            <button
              key={i}
              type="button"
              className={`algo-gcell ${cls}`}
              onClick={() => toggleWall(i)}
              aria-label={walls.has(i) ? "벽" : d !== undefined ? `${d}걸음` : "빈 칸"}
            >
              {d ?? ""}
            </button>
          );
        })}
      </div>

      <div className="algo-byhand-foot">
        <button type="button" onClick={spread} className="algo-spread-go">
          한 걸음 퍼뜨리기
        </button>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
