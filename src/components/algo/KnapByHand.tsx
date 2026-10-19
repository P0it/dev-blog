"use client";

import { useState } from "react";
import { ITEMS, CAPACITY, knapTable, cellInfo, predictOptions } from "@/lib/algo/knapsack";
import { josa } from "@/lib/algo/josa";
import { KnapTable } from "./StageKnap";

export type KnapResult = { guess: number; actual: number; wrong: number };

type Phase = "predict" | "fill" | "done";

const TABLE = knapTable();
const PREDICT = predictOptions();
const N = ITEMS.length;

/** 처음 상태 — 0행(물건 0개)과 0열(용량 0)만 채워져 있다. */
const startFilled = () => Array.from({ length: N + 1 }, (_, i) => Array.from({ length: CAPACITY + 1 }, (_, w) => i === 0 || w === 0));

/**
 * ① 직접 해 보기 — 가방 용량 5 에 가장 값지게 담는 표를 채운다.
 *
 * 용어(DP·점화식)와 타이핑은 없다. 칸마다 후보가 둘 켜진다 — 이 물건을 **안 담기**(바로 위 칸 값)와 **담기**(무게만큼 왼쪽 위 칸 값 + 이 물건의 값).
 * 독자는 더 큰 쪽을 고른다. 위 칸과 왼쪽 위 칸이 채워지지 않으면 누를 수 없다. 이 허용 동작이 곧 표 채우기의 동작이라 ② 되짚기가 ① 을 반증하지 않는다.
 * 먼저 **예측** 한 번을 한다 — 용량 5 에 담을 수 있는 최대 가치는 얼마일까.
 */
export function KnapByHand({ onDone, onReset }: { onDone?: (r: KnapResult) => void; onReset?: () => void }) {
  const [phase, setPhase] = useState<Phase>("predict");
  const [guess, setGuess] = useState<number | null>(null);
  const [filled, setFilled] = useState(startFilled);
  const [open, setOpen] = useState<[number, number] | null>(null);
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState("");

  const info = open ? cellInfo(TABLE, open[0], open[1]) : null;
  const item = open ? ITEMS[open[0] - 1] : null;
  const from: [number, number][] =
    open && info ? [[open[0] - 1, open[1]], ...(info.take !== null ? ([[open[0] - 1, open[1] - item!.w]] as [number, number][]) : [])] : [];
  const left = filled.flat().filter(Boolean).length - (N + 1) - CAPACITY; // 채운 칸 = 전체 채움 − 처음부터 채워진 0행·0열

  const clickCell = (i: number, w: number) => {
    if (phase !== "fill") return;
    if (filled[i][w]) {
      setMsg(`${ITEMS[i - 1].name}까지 용량 ${w} 칸은 이미 채웠습니다`);
      return;
    }
    const wt = ITEMS[i - 1].w;
    const upOk = filled[i - 1][w];
    const leftOk = w < wt || filled[i - 1][w - wt];
    if (!upOk || !leftOk) {
      setMsg(
        w >= wt
          ? `이 칸은 바로 위 칸과 무게 ${wt}만큼 왼쪽 위 칸이 채워져야 합니다. 위쪽 칸부터 채워 보세요`
          : "이 칸은 바로 위 칸이 채워져야 합니다. 위쪽 칸부터 채워 보세요",
      );
      return;
    }
    setMsg("");
    setOpen([i, w]);
  };

  const pick = (value: number) => {
    if (!open || !info) return;
    if (value !== info.answer) {
      setWrong(wrong + 1);
      setMsg(`안 담기 ${info.skip}, 담기 ${info.take}. 둘 중 더 큰 값이 이 칸의 답입니다. 다시 골라 보세요`);
      return;
    }
    const next = filled.map((r) => [...r]);
    next[open[0]][open[1]] = true;
    setFilled(next);
    setMsg(
      info.take === null
        ? `위 칸 ${info.answer} 그대로 적었습니다`
        : `${josa(info.answer, "을", "를")} 적었습니다. ${info.takeWins ? "담는 쪽" : "안 담는 쪽"}이 더 컸습니다`,
    );
    setOpen(null);
    if (next.flat().every(Boolean)) {
      setPhase("done");
      onDone?.({ guess: PREDICT[guess ?? 0].value, actual: TABLE[N][CAPACITY], wrong });
    }
  };

  const reset = () => {
    setPhase("predict");
    setGuess(null);
    setFilled(startFilled());
    setOpen(null);
    setWrong(0);
    setMsg("");
    onReset?.();
  };

  // 두 후보 버튼의 위치는 칸마다 번갈아 둔다 — 한쪽이 늘 정답 자리면 위치로 찍을 수 있다
  const swap = open ? (open[0] + open[1]) % 2 === 1 : false;
  const candidates =
    info && info.take !== null
      ? [
          { key: "skip", value: info.skip, big: `안 담기 → ${info.skip}`, small: "바로 위 칸 값 그대로" },
          { key: "take", value: info.take, big: `담기 → ${info.left} + ${item!.v} = ${info.take}`, small: `무게 ${item!.w}만큼 왼쪽 위 칸 값에 ${item!.name}의 값을 더함` },
        ]
      : [];
  if (swap) candidates.reverse();

  const ask =
    phase === "predict"
      ? `가방은 ${CAPACITY}kg까지 담을 수 있습니다. 물건 A(무게 2 · 값 3), B(무게 3 · 값 4), C(무게 4 · 값 5) 중에서 무게의 합이 ${josa(CAPACITY, "을", "를")} 넘지 않게 담아 값의 합을 가장 크게 만듭니다. 목표는 담을 수 있는 최대 가치입니다.`
      : phase === "done"
        ? `가방 용량 ${CAPACITY}에 담을 수 있는 최대 가치는 ${TABLE[N][CAPACITY]}입니다`
        : "표의 칸 하나는 그 줄의 물건까지 보고, 가방 용량이 그 열의 숫자일 때 담을 수 있는 최대 가치입니다. 칸을 눌러 채워 보세요. 위 칸과 왼쪽 위 칸이 채워져 있어야 누를 수 있습니다";

  return (
    <section className="algo-byhand algo-knap" aria-label="가방에 담는 표 채우기">
      <p className="algo-byhand-ask">{ask}</p>

      {phase === "predict" && (
        <div className="algo-knap-predict">
          <p>
            <strong>먼저 맞혀 보세요. 용량 {CAPACITY}에 담을 수 있는 최대 가치는 얼마일까요?</strong>
          </p>
          {PREDICT.map((o, i) => (
            <button
              key={o.value}
              type="button"
              className="algo-opt"
              onClick={() => {
                setGuess(i);
                setPhase("fill");
              }}
            >
              가치 {o.value}
            </button>
          ))}
        </div>
      )}

      {phase !== "predict" && (
        <p className="algo-knap-guess">
          내 예상 <b>가치 {PREDICT[guess ?? 0].value}</b>
        </p>
      )}

      <KnapTable
        knap={{ items: ITEMS, W: CAPACITY, dp: TABLE, done: filled, cur: open ?? undefined, from }}
        blank="?"
        onCell={clickCell}
        disabled={phase !== "fill"}
      />

      {open && info && item && (
        <div className="algo-knap-pick">
          <p>
            <strong>
              {item.name}(무게 {item.w} · 값 {item.v})까지 보고 용량 {open[1]}일 때입니다.
              {info.take === null
                ? ` 무게 ${item.w}짜리 ${item.name}는 용량 ${open[1]}에 들어가지 않습니다.`
                : " 더 큰 쪽을 고르세요."}
            </strong>
          </p>
          <div className="algo-knap-choices" role="group" aria-label="이 칸에 넣을 값 고르기">
            {info.take === null ? (
              <button type="button" className="algo-opt" onClick={() => pick(info.answer)}>
                <b>안 담기 → {info.skip}</b>
                <span>담을 수 없으니 바로 위 칸 값 그대로 씁니다</span>
              </button>
            ) : (
              candidates.map((c) => (
                <button key={c.key} type="button" className="algo-opt" onClick={() => pick(c.value)}>
                  <b>{c.big}</b>
                  <span>{c.small}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {msg && <p className="algo-knap-msg">{msg}</p>}

      <div className="algo-byhand-foot">
        <span>
          채운 칸 <b>{Math.max(0, left)}</b>/{N * CAPACITY}
          {wrong > 0 && (
            <>
              {" "}
              · 다시 고른 횟수 <b>{wrong}</b>
            </>
          )}
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
