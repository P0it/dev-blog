"use client";

import { useState } from "react";
import {
  ISLAND_GRID,
  ISLAND_COLS,
  countIslands,
  diagonalLeft,
  neighbors,
  spreadOnce,
} from "@/lib/algo/connected-components";

export type IslandResult = { count: number; guess: number; predicted: boolean };

const ROWS = ISLAND_GRID.length;
const LAND = ISLAND_GRID.flat().map((v) => v === 1);
const TOTAL_LAND = LAND.filter(Boolean).length;
const ACTUAL = countIslands(ISLAND_GRID);

/** 섬이 모두 몇 개일까. 정답은 세 번째 — 대각선으로 닿은 땅이 있어서 눈으로는 둘로도 읽힌다. */
const PREDICT = [1, 2, 3];

const emptyOwner = (): (number | null)[] => LAND.map(() => null);

/** 지금 칠한 칸들 중 `k` 번 섬 칸 번호들 */
const cellsOf = (owner: (number | null)[], k: number) => owner.flatMap((o, i) => (o === k ? [i] : []));

/**
 * ① 직접 해 보기 — 땅 한 칸을 눌러 번지기를 시작하고, 이어진 땅이 다 칠해지면 섬 하나를 센다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 번지기는 **위·아래·왼쪽·오른쪽 한 칸씩**뿐이다 — 여기서 허용하는 동작이
 * 곧 연결 요소 탐색의 동작이라 ② 되짚기가 ① 을 반증하지 않는다. 대각선으로만 닿은 땅은 번지지 않는다는 걸 겪는다.
 * 먼저 **예측** 한 번을 한다 — 섬이 몇 개일까. ④ 플레이어와 같은 지도를 쓴다(`ISLAND_GRID`).
 * 모두 칠하면 `onDone`, 처음부터를 누르면 `onReset`.
 */
export function IslandByHand({ onDone, onReset }: { onDone?: (r: IslandResult) => void; onReset?: () => void }) {
  const [guess, setGuess] = useState<number | null>(null);
  const [owner, setOwner] = useState<(number | null)[]>(emptyOwner);
  const [frontier, setFrontier] = useState<number[] | null>(null); // 지금 번지는 섬의 맨 끝 칸들 — 없으면 번지는 중이 아니다
  const [count, setCount] = useState(0); // 다 칠한 섬 수
  const [notice, setNotice] = useState("");

  const started = count + (frontier ? 1 : 0); // 번지기를 시작한 횟수 = 지금 섬 번호(1부터)
  const painted = owner.filter((o) => o !== null).length;
  const finished = painted === TOTAL_LAND;
  const spreading = frontier !== null;

  /** 섬 하나가 다 칠해졌을 때 — 센 섬을 올리고 안내를 정한다. */
  const finishIsland = (nextOwner: (number | null)[], k: number, extra = "") => {
    const nextCount = k + 1;
    setCount(nextCount);
    setFrontier(null);
    const left = nextOwner.filter((o, i) => LAND[i] && o === null).length;
    if (left === 0) {
      setNotice(`${extra}땅을 모두 칠했어요. 섬은 ${nextCount}개입니다.`);
      onDone?.({ count: nextCount, guess: guess ?? 0, predicted: guess === ACTUAL });
      return;
    }
    const diag = diagonalLeft(LAND, ISLAND_COLS, nextOwner, cellsOf(nextOwner, k));
    setNotice(
      diag
        ? `${extra}${nextCount}번째 섬 완성. 그런데 방금 칠한 섬과 대각선으로만 닿은 땅이 안 칠해졌어요. 번지기는 위·아래·왼쪽·오른쪽으로만 가요. 노란 칸을 또 눌러 보세요.`
        : `${extra}${nextCount}번째 섬 완성. 아직 안 칠한 땅(노란 칸)이 있어요. 하나를 눌러 보세요.`,
    );
  };

  const clickCell = (i: number) => {
    if (guess === null) return setNotice("먼저 섬이 몇 개일지 골라 주세요.");
    if (finished) return;
    if (!LAND[i]) return setNotice("바다예요. 땅(노란 칸)을 눌러 주세요.");
    if (owner[i] !== null) return setNotice("이미 칠한 땅이에요. 아직 안 칠한 땅(노란 칸)을 골라 주세요.");
    if (spreading) return setNotice("지금 섬을 끝까지 번지게 해 주세요. 「한 걸음 번지기」를 누르면 돼요.");

    const k = count;
    const next = [...owner];
    next[i] = k;
    setOwner(next);
    // 이웃에 안 칠한 땅이 없으면 한 칸짜리 섬이다
    const open = neighbors(ROWS, ISLAND_COLS, i).some((n) => LAND[n] && next[n] === null);
    if (open) {
      setFrontier([i]);
      setNotice("");
    } else {
      finishIsland(next, k, "이웃에 땅이 없어서 이 섬은 한 칸이었어요. ");
    }
  };

  const spread = () => {
    if (!frontier) return setNotice("먼저 땅 칸 하나를 눌러 번지기를 시작해 주세요.");
    const k = count;
    const step = spreadOnce(LAND, ISLAND_COLS, owner, frontier, k);
    setOwner(step.owner);
    const more = spreadOnce(LAND, ISLAND_COLS, step.owner, step.frontier, k).frontier.length > 0;
    if (more) {
      setFrontier(step.frontier);
      setNotice("");
    } else {
      finishIsland(step.owner, k);
    }
  };

  const reset = () => {
    setGuess(null);
    setOwner(emptyOwner());
    setFrontier(null);
    setCount(0);
    setNotice("");
    onReset?.();
  };

  const ask =
    guess === null
      ? "노란 칸은 땅이고 빈 칸은 바다예요. 땅이 이어진 덩어리가 섬입니다. 섬이 모두 몇 개일까요?"
      : finished
        ? `내 예상 ${guess}개, 센 결과 ${count}개 — ${guess === ACTUAL ? "맞았습니다" : "달랐습니다"}`
        : spreading
          ? `${started}번째 섬을 칠하는 중이에요. 한 걸음씩 번지게 해 보세요`
          : "목표: 섬이 모두 몇 개인지 세기. 땅(노란 칸)을 눌러 그 섬을 칠하고, 칠한 섬을 하나씩 셉니다";

  return (
    <section className="algo-byhand" aria-label="섬 세어 보기">
      <p className="algo-byhand-ask">{ask}</p>

      {guess === null && (
        <div className="algo-guess" role="group" aria-label="섬이 모두 몇 개일까요?">
          {PREDICT.map((n) => (
            <button key={n} type="button" aria-pressed={guess === n} onClick={() => setGuess(n)}>
              {n}개
            </button>
          ))}
        </div>
      )}

      <div className="algo-grid" style={{ gridTemplateColumns: `repeat(${ISLAND_COLS}, minmax(0, 36px))` }}>
        {LAND.map((isLand, i) => {
          const o = owner[i];
          return (
            <button
              key={i}
              type="button"
              className="algo-gcell algo-island-cell"
              data-kind={isLand ? "land" : "sea"}
              data-owner={o ?? undefined}
              data-front={frontier?.includes(i) ? "" : undefined}
              onClick={() => clickCell(i)}
              aria-label={
                !isLand ? "바다" : o !== null ? `${o + 1}번째 섬으로 칠한 땅` : "아직 안 센 땅"
              }
            >
              {o !== null ? o + 1 : isLand ? "땅" : ""}
            </button>
          );
        })}
      </div>

      <p className="algo-notice" role="status">
        {notice || " "}
      </p>

      <div className="algo-byhand-foot">
        <span>
          센 섬 <b>{count}</b>개
        </span>
        <span className="algo-island-foot-btns">
          <button type="button" onClick={spread} className="algo-spread-go" disabled={!spreading}>
            한 걸음 번지기
          </button>
          <button type="button" onClick={reset}>
            처음부터
          </button>
        </span>
      </div>
    </section>
  );
}
