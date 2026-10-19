"use client";

import { useMemo, useState } from "react";
import { DEMO_GRID, DEMO_GOAL, DEMO_START, guessOptions, shortestSteps } from "@/lib/algo/bfs-grid";

const ROWS = DEMO_GRID.length;
const COLS = DEMO_GRID[0].length;
const START = DEMO_START[0] * COLS + DEMO_START[1];
const GOAL = DEMO_GOAL[0] * COLS + DEMO_GOAL[1];

const initialWalls = () => {
  const w = new Set<number>();
  DEMO_GRID.forEach((row, r) => row.forEach((v, c) => v === 1 && w.add(r * COLS + c)));
  return w;
};

const gridOf = (walls: Set<number>) =>
  Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (walls.has(r * COLS + c) ? 1 : 0)));

const label = (n: number) => (n < 0 ? "닿을 수 없다" : `${n}걸음`);

/**
 * ① 직접 해 보기 — 도착까지 몇 걸음일지 **먼저 고르고**, 소문을 한 걸음씩 퍼뜨려 맞춰 본다.
 *
 * ④ 플레이어와 같은 격자를 쓴다(`DEMO_GRID`). 칸을 눌러 벽을 놓을 수 있지만 퍼뜨리기 전에만 된다.
 * 알고리즘 이름은 아직 안 나온다. 도착에 처음 닿으면 `onDone(걸음 수)`, 처음부터를 누르면 `onDone(null)`.
 */
export function SpreadByHand({ onDone }: { onDone?: (goalSteps: number | null) => void }) {
  const [walls, setWalls] = useState<Set<number>>(initialWalls);
  const [dist, setDist] = useState<Map<number, number>>(new Map([[START, 0]]));
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const best = useMemo(() => shortestSteps(gridOf(walls), DEMO_START, DEMO_GOAL), [walls]);
  const options = useMemo(() => guessOptions(best), [best]);
  const goalAt = dist.get(GOAL);

  const rc = (i: number) => [Math.floor(i / COLS), i % COLS];

  const spread = () => {
    if (guess === null) {
      setNotice("먼저 도착까지 몇 걸음일지 골라 주세요.");
      return;
    }
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

    if (next.size === dist.size) {
      setNotice(
        goalAt !== undefined
          ? "더 퍼질 칸이 없습니다. 닿을 수 있는 칸은 다 돌았어요."
          : round === 0
            ? "막혔습니다. 시작 칸 둘레가 벽이라 소문이 퍼지지 못해요. 「처음부터」를 누르고 벽을 치워 보세요."
            : "도착 칸에 닿지 못했습니다. 벽이 길을 막고 있어요. 「처음부터」를 누르고 벽을 치워 보세요.",
      );
      return;
    }

    setDist(next);
    setRound(round + 1);
    setNotice("");
    if (next.has(GOAL) && !dist.has(GOAL)) onDone?.(round + 1);
  };

  const toggleWall = (i: number) => {
    if (i === START || i === GOAL) return;
    if (round > 0) {
      setNotice("벽은 처음에만 놓을 수 있어요. 「처음부터」를 누르면 다시 놓을 수 있습니다.");
      return;
    }
    setWalls((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
    setGuess(null); // 벽이 바뀌면 정답도 바뀐다
    setNotice("");
  };

  const reset = () => {
    setDist(new Map([[START, 0]]));
    setRound(0);
    setGuess(null);
    setNotice("");
    onDone?.(null);
  };

  const ask =
    round === 0
      ? guess === null
        ? "왼쪽 위 소문이 오른쪽 아래 도착 칸까지 퍼집니다. 몇 걸음 걸릴까요?"
        : "고르셨어요. 이제 한 걸음씩 퍼뜨려 보세요"
      : goalAt !== undefined
        ? `도착까지 ${goalAt}걸음 — 내 예상 ${label(guess ?? 0)}, ${guess === goalAt ? "맞았습니다" : "달랐습니다"}`
        : `${round}걸음 — ${dist.size}칸에 닿았습니다`;

  return (
    <section className="algo-byhand" aria-label="소문 퍼뜨리기">
      <p className="algo-byhand-ask">{ask}</p>

      {round === 0 && (
        <div className="algo-guess" role="group" aria-label="도착까지 몇 걸음일까요?">
          {options.map((o) => (
            <button key={o} type="button" aria-pressed={guess === o} onClick={() => setGuess(o)}>
              {label(o)}
            </button>
          ))}
        </div>
      )}

      <div className="algo-grid" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 36px))` }}>
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const d = dist.get(i);
          const isWall = walls.has(i);
          const cls = isWall
            ? "algo-cell-dropped"
            : i === GOAL && d !== undefined
              ? "algo-cell-settled"
              : d === round && d !== undefined && i !== START
                ? "algo-cell-current"
                : d !== undefined
                  ? "algo-cell-compare"
                  : "algo-cell-out";
          const mark = i === START ? " algo-start" : i === GOAL && d === undefined ? " algo-goal" : "";
          const text = i === START ? "시작" : i === GOAL && d === undefined ? "도착" : (d ?? "");
          return (
            <button
              key={i}
              type="button"
              className={`algo-gcell ${cls}${mark}`}
              onClick={() => toggleWall(i)}
              aria-label={isWall ? "벽" : i === START ? "시작 칸" : i === GOAL ? "도착 칸" : d !== undefined ? `${d}걸음` : "빈 칸"}
            >
              {text}
            </button>
          );
        })}
      </div>

      <p className="algo-notice" role="status">
        {notice || (round === 0 ? "칸을 눌러 벽을 놓거나 치울 수 있어요(퍼뜨리기 전에만)." : " ")}
      </p>

      <div className="algo-byhand-foot">
        <button type="button" onClick={spread} className="algo-spread-go" disabled={guess === null && round === 0}>
          한 걸음 퍼뜨리기
        </button>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
