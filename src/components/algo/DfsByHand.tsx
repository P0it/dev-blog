"use client";

import { useMemo, useState } from "react";
import {
  DEMO_GRID,
  DEMO_GOAL,
  DEMO_START,
  backUp,
  cellKey,
  demoBranches,
  here,
  isStuck,
  moveTo,
  startWalk,
  unseenNeighbors,
  walkSteps,
  type Walk,
} from "@/lib/algo/dfs";

const ROWS = DEMO_GRID.length;
const COLS = DEMO_GRID[0].length;
const idx = (r: number, c: number) => r * COLS + c;

export type DfsResult = {
  /** 걸은 걸음 전부(되돌아가기 포함) */
  steps: number;
  backs: number;
  /** 도착한 길의 길이 */
  pathLen: number;
  /** 고른 예상 */
  picked: string;
  predicted: boolean;
};

/** 갈림길 오른쪽 길이 도착하는지는 격자에서 계산한다 — 정답 위치는 늘 같지 않게 두 번째가 아닌 칸에 둔다. */
const BRANCH = demoBranches();
const RIGHT_REACHES = BRANCH.rightSteps >= 0;
const OPTIONS = [
  { label: "막다른 길이다", correct: !RIGHT_REACHES },
  { label: "가 봐야만 알 수 있다", correct: false },
  { label: "도착한다", correct: RIGHT_REACHES },
];

/**
 * ① 직접 해 보기 — 미로를 한 칸씩 걷는다. 용어도 타이핑도 없다.
 *
 * 허용 동작이 DFS 의 동작과 같다: 안 가 본 옆 칸으로 한 칸 가거나, 막다른 길에서만 지나온 길을 한 칸 되돌아간다.
 * 이미 온 칸에는 다시 못 들어간다(같은 길을 맴돌게 되니까). ④ 플레이어와 **같은 격자**다.
 * 걷기 전에 갈림길 오른쪽 길이 어떻게 될지 먼저 고른다. 도착하면 `onDone(결과)`, 처음부터를 누르면 `onDone(null)`.
 */
export function DfsByHand({ onDone }: { onDone?: (r: DfsResult | null) => void }) {
  const [walk, setWalk] = useState<Walk>(() => startWalk(DEMO_START));
  const [guess, setGuess] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const cur = here(walk);
  const arrived = cur[0] === DEMO_GOAL[0] && cur[1] === DEMO_GOAL[1];
  const stuck = isStuck(DEMO_GRID, walk);
  const next = useMemo(
    () => new Set(unseenNeighbors(DEMO_GRID, walk).map(([r, c]) => cellKey(r, c))),
    [walk],
  );
  const onPath = useMemo(() => new Set(walk.path.map(([r, c]) => cellKey(r, c))), [walk]);
  const seen = useMemo(() => new Set(walk.seen), [walk]);
  const order = useMemo(() => new Map(walk.path.map(([r, c], i) => [cellKey(r, c), i])), [walk]);

  const finish = (w: Walk) => {
    const [r, c] = here(w);
    if (r !== DEMO_GOAL[0] || c !== DEMO_GOAL[1] || guess === null) return;
    onDone?.({
      steps: walkSteps(w),
      backs: w.backs,
      pathLen: w.path.length - 1,
      picked: OPTIONS[guess].label,
      predicted: OPTIONS[guess].correct,
    });
  };

  const press = (r: number, c: number) => {
    if (arrived) return;
    if (guess === null) {
      setNotice("먼저 갈림길 오른쪽 길이 어떻게 될지 골라 주세요.");
      return;
    }
    const res = moveTo(DEMO_GRID, walk, [r, c]);
    if (!res.ok) {
      setNotice(
        res.reason === "wall"
          ? "벽이에요. 돌아서 가야 해요."
          : res.reason === "seen"
            ? "이미 지나온 칸이에요. 다시 들어가면 같은 길을 맴돌게 돼요."
            : "한 칸씩만 이동할 수 있어요. 지금 칸 바로 옆 칸을 눌러 보세요.",
      );
      return;
    }
    setWalk(res.walk);
    const dead = isStuck(DEMO_GRID, res.walk);
    const [nr, nc] = here(res.walk);
    const goal = nr === DEMO_GOAL[0] && nc === DEMO_GOAL[1];
    setNotice(goal ? "" : dead ? "막다른 길이에요. 「되돌아가기」를 눌러 지나온 길로 한 칸 돌아가세요." : "");
    finish(res.walk);
  };

  const back = () => {
    if (arrived) return;
    if (guess === null) {
      setNotice("먼저 갈림길 오른쪽 길이 어떻게 될지 골라 주세요.");
      return;
    }
    const res = backUp(DEMO_GRID, walk);
    if (!res.ok) {
      setNotice(
        res.reason === "free"
          ? "아직 가 볼 길이 남아 있어요. 막다른 길에서만 되돌아갈 수 있어요."
          : "되돌아갈 곳이 없어요. 시작 칸 둘레가 막혔어요. 「처음부터」를 눌러 주세요.",
      );
      return;
    }
    setWalk(res.walk);
    setNotice(
      isStuck(DEMO_GRID, res.walk)
        ? "여기도 더 갈 길이 없어요. 한 칸 더 되돌아가세요."
        : "갈 수 있는 길이 남아 있는 칸으로 돌아왔어요. 다른 길로 가 보세요.",
    );
  };

  const reset = () => {
    setWalk(startWalk(DEMO_START));
    setGuess(null);
    setNotice("");
    onDone?.(null);
  };

  const ask = arrived
    ? `도착! ${walkSteps(walk)}걸음 걸었어요(되돌아가기 ${walk.backs}번 포함)`
    : guess === null
      ? "미로를 걸어 도착 칸에 닿으세요. 먼저 한 가지만 골라 주세요."
      : "고르셨어요. 옆 칸을 눌러 한 칸씩 걸어 보세요. 막다른 길에서는 되돌아가기를 누르세요.";

  return (
    <section className="algo-byhand" aria-label="미로 걸어 보기">
      <p className="algo-byhand-ask">{ask}</p>

      {guess === null && (
        <div className="algo-guess algo-dfs-guess" role="group" aria-label="갈림길 오른쪽 길은 어떻게 될까요?">
          <p className="algo-quiz-q">
            <strong>
              ★ 갈림길에서 <b>오른쪽 길</b>로 끝까지 가면 어떻게 될까요?
            </strong>
          </p>
          {OPTIONS.map((o, i) => (
            <button key={o.label} type="button" onClick={() => setGuess(i)}>
              {o.label}
            </button>
          ))}
        </div>
      )}
      {guess !== null && (
        <p className="algo-dfs-pick">
          내 예상 <b>{OPTIONS[guess].label}</b>
        </p>
      )}

      <div className="algo-grid" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 36px))` }}>
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          const k = cellKey(r, c);
          const isWall = DEMO_GRID[r][c] === 1;
          const isStart = r === DEMO_START[0] && c === DEMO_START[1];
          const isGoal = r === DEMO_GOAL[0] && c === DEMO_GOAL[1];
          const isHere = r === cur[0] && c === cur[1];
          const isJunction = r === BRANCH.junction.cell[0] && c === BRANCH.junction.cell[1];
          const cls = isWall
            ? "algo-cell-dropped"
            : isGoal && arrived
              ? "algo-cell-settled"
              : isHere
                ? "algo-cell-current"
                : onPath.has(k)
                  ? "algo-cell-waiting"
                  : seen.has(k)
                    ? "algo-cell-compare"
                    : "algo-cell-out";
          const mark = (isStart ? " algo-start" : "") + (isGoal && !arrived ? " algo-goal" : "") + (next.has(k) && !arrived ? " algo-dfs-next" : "");
          const text = isWall
            ? ""
            : isHere
              ? isGoal
                ? "도착"
                : "나"
              : isGoal
                ? "도착"
                : isStart
                  ? "시작"
                  : onPath.has(k)
                    ? (order.get(k) ?? "")
                    : seen.has(k)
                      ? "×"
                      : isJunction
                        ? "★"
                        : "";
          const label = isWall
            ? "벽"
            : isHere
              ? "지금 칸"
              : isGoal
                ? "도착 칸"
                : isStart
                  ? "시작 칸"
                  : next.has(k)
                    ? "갈 수 있는 옆 칸"
                    : seen.has(k) && !onPath.has(k)
                      ? "되돌아 나온 칸"
                      : onPath.has(k)
                        ? "지나온 길"
                        : isJunction
                          ? "갈림길"
                          : "빈 칸";
          return (
            <button key={i} type="button" className={`algo-gcell ${cls}${mark}`} onClick={() => press(r, c)} aria-label={label}>
              {text}
            </button>
          );
        })}
      </div>

      <p className="algo-notice" role="status">
        {notice || (arrived ? " " : stuck && guess !== null ? "막다른 길이에요. 「되돌아가기」를 눌러 주세요." : "★ 는 길이 둘로 갈라지는 칸이에요.")}
      </p>

      <div className="algo-byhand-foot">
        <span>
          걸음 <b>{walkSteps(walk)}</b> · 되돌아가기 <b>{walk.backs}</b>번 · 지금 길 <b>{walk.path.length - 1}</b>걸음
        </span>
        <div className="algo-dfs-btns">
          <button type="button" onClick={back} className="algo-dfs-back" disabled={arrived}>
            되돌아가기
          </button>
          <button type="button" onClick={reset}>
            처음부터
          </button>
        </div>
      </div>
    </section>
  );
}
