"use client";

import { useState } from "react";
import { PERM_ITEMS, permutationsOf, letterJosa } from "@/lib/algo/permutations";

export type PermResult = { found: number; guess: number; predicted: boolean; places: number; undos: number };

const ITEMS = PERM_ITEMS;
const N = ITEMS.length;
const TOTAL = permutationsOf(ITEMS).length;

/** 서는 순서가 모두 몇 가지일까. 정답은 세 번째 — 3 × 3 = 9 로 곱하고 싶은 눈속임이 오답으로 놓인다. */
const PREDICT = [3, 9, 6];

/**
 * ① 직접 해 보기 — 세 친구가 한 줄로 서는 모든 순서를 빠짐없이 찾는다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 할 수 있는 동작은 둘뿐이다 — 앞자리부터 친구를 **한 명씩 세우기**,
 * 마지막에 세운 친구를 **한 칸 되돌리기**. 이 동작이 곧 백트래킹의 동작이라 ② 되짚기가 ① 을 반증하지 않는다.
 * 먼저 **예측** 한 번을 한다 — 순서가 몇 가지일까. ④ 플레이어와 같은 친구(`PERM_ITEMS`)를 쓴다.
 * 다 찾으면 `onDone`, 처음부터를 누르면 `onReset`.
 */
export function PermByHand({ onDone, onReset }: { onDone?: (r: PermResult) => void; onReset?: () => void }) {
  const [guess, setGuess] = useState<number | null>(null);
  const [path, setPath] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [places, setPlaces] = useState(0);
  const [undos, setUndos] = useState(0);

  const finished = found.length === TOTAL;
  const full = path.length === N;

  const pick = (k: number) => {
    if (guess === null) return setNotice("먼저 순서가 몇 가지일지 골라 주세요.");
    if (finished) return;
    const at = path.indexOf(k);
    if (at >= 0) {
      return setNotice(`${letterJosa(ITEMS[k], "은", "는")} 이미 ${at + 1}번째 자리에 서 있어요. 한 친구는 한 자리에만 설 수 있어요.`);
    }
    if (full) return setNotice("자리가 다 찼어요. 「한 칸 되돌리기」를 눌러 마지막 친구를 빼 보세요.");

    const next = [...path, k];
    const nextPlaces = places + 1;
    setPath(next);
    setPlaces(nextPlaces);
    if (next.length < N) return setNotice("");

    const word = next.map((i) => ITEMS[i]).join("");
    if (found.includes(word)) {
      return setNotice(`${letterJosa(word, "은", "는")} 이미 찾은 순서예요. 한 칸 되돌려서 다른 친구를 세워 보세요.`);
    }
    const nextFound = [...found, word];
    setFound(nextFound);
    if (nextFound.length === TOTAL) {
      setNotice(`모든 순서를 찾았어요. ${letterJosa(word, "이", "가")} 마지막 한 가지였어요.`);
      onDone?.({ found: nextFound.length, guess, predicted: guess === TOTAL, places: nextPlaces, undos });
    } else {
      setNotice(`${word} 한 가지를 찾았어요(${nextFound.length}가지째). 한 칸 되돌려서 다른 순서를 찾아 보세요.`);
    }
  };

  const undo = () => {
    if (finished) return;
    if (path.length === 0) return setNotice("되돌릴 친구가 없어요. 앞자리부터 친구를 세워 보세요.");
    const last = ITEMS[path[path.length - 1]];
    setPath(path.slice(0, -1));
    setUndos(undos + 1);
    setNotice(`${letterJosa(last, "을", "를")} 뺐어요. 이제 다른 친구를 세울 수 있어요.`);
  };

  const claim = () => {
    if (finished) return;
    setNotice(
      found.length === 0
        ? "아직 하나도 못 찾았어요. 앞자리부터 친구를 세워 보세요."
        : "아직 못 찾은 순서가 있어요. 첫 자리에 서 보지 않은 친구가 있는지 살펴보세요.",
    );
  };

  const reset = () => {
    setGuess(null);
    setPath([]);
    setFound([]);
    setNotice("");
    setPlaces(0);
    setUndos(0);
    onReset?.();
  };

  const ask =
    guess === null
      ? `친구 ${letterJosa(ITEMS.join("·"), "이", "가")} 한 줄로 서요. 서는 순서는 모두 몇 가지일까요?`
      : finished
        ? `내 예상 ${guess}가지, 찾은 순서 ${found.length}가지 — ${guess === TOTAL ? "맞았습니다" : "달랐습니다"}`
        : "목표: 서로 다른 순서를 빠짐없이 찾기. 앞자리부터 친구를 한 명씩 세우고, 자리가 다 차면 한 칸씩 되돌리며 다른 순서를 찾아 보세요";

  return (
    <section className="algo-byhand algo-perm-hand" aria-label="줄 서는 순서 모두 찾기">
      <p className="algo-byhand-ask">{ask}</p>

      {guess === null && (
        <div className="algo-guess" role="group" aria-label="서는 순서는 모두 몇 가지일까요?">
          {PREDICT.map((n) => (
            <button key={n} type="button" aria-pressed={guess === n} onClick={() => setGuess(n)}>
              {n}가지
            </button>
          ))}
        </div>
      )}

      <ol className="algo-perm-slots">
        {ITEMS.map((_, k) => {
          const on = k < path.length;
          return (
            <li key={k} className="algo-perm-slot" data-on={on ? "" : undefined} data-full={on && full ? "" : undefined}>
              <small>{k + 1}번째 자리</small>
              <b>{on ? ITEMS[path[k]] : ""}</b>
            </li>
          );
        })}
      </ol>

      <div className="algo-perm-friend-btns" role="group" aria-label="자리에 세울 친구">
        {ITEMS.map((name, k) => (
          <button
            key={k}
            type="button"
            className="algo-perm-friend-btn"
            data-used={path.includes(k) || full ? "" : undefined}
            aria-label={`친구 ${name}`}
            onClick={() => pick(k)}
          >
            {name}
          </button>
        ))}
      </div>

      <p className="algo-notice" role="status">
        {notice || " "}
      </p>

      <div className="algo-perm-found-box">
        <p className="algo-perm-found-title">
          찾은 순서 <b>{found.length}</b>가지
        </p>
        <ol className="algo-perm-found algo-perm-found-hand">
          {found.length === 0 && <li className="algo-perm-none">아직 없어요</li>}
          {found.map((w) => (
            <li key={w} data-on="">
              {w}
            </li>
          ))}
        </ol>
      </div>

      <div className="algo-byhand-foot">
        <span>
          친구를 세운 횟수 <b>{places}</b>번
        </span>
        <span className="algo-perm-foot-btns">
          <button type="button" onClick={undo} className="algo-perm-undo" aria-disabled={path.length === 0 || finished}>
            한 칸 되돌리기
          </button>
          {!finished && (
            <button type="button" onClick={claim}>
              다 찾았어요
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
