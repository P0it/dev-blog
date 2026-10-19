"use client";

import { useState } from "react";
import { STAIRS, PREDICT_STAIR, climbTable, fillChoices } from "@/lib/algo/dp-1d";

export type Dp1Result = { guess: number; actual: number; wrong: number };

type Phase = "predict" | "fill" | "done";

/** 예측 보기 — 4번째 계단까지 몇 가지일까. 정답이 세 번째에 오도록 고정한다. */
const PREDICT = [4, 8, 5];

const TABLE = climbTable(STAIRS);

/**
 * ① 직접 해 보기 — 계단 6칸을 한 번에 1칸 또는 2칸씩 올라 꼭대기에 닿는 방법의 수를 표로 채운다.
 *
 * 용어(DP·점화식)와 타이핑은 없다. 0번(시작 자리)과 1번은 처음부터 적혀 있고, 나머지 칸은 **앞 두 칸이 채워져야** 누를 수 있다.
 * 허용 동작이 곧 DP 표 채우기의 동작이라 ② 되짚기가 ① 을 반증하지 않는다.
 * 먼저 **예측** 한 번을 한다 — 4번째 계단까지는 몇 가지일까.
 */
export function Dp1ByHand({ onDone, onReset }: { onDone?: (r: Dp1Result) => void; onReset?: () => void }) {
  const [phase, setPhase] = useState<Phase>("predict");
  const [guess, setGuess] = useState<number | null>(null);
  const [filled, setFilled] = useState(2); // 0번·1번은 처음부터 채워져 있다
  const [open, setOpen] = useState<number | null>(null); // 값을 고르는 중인 칸
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState("");

  const next = filled; // 지금 채울 수 있는 칸은 이것 하나다(앞 두 칸이 채워진 첫 칸)
  const choices = open === null ? [] : fillChoices(TABLE, open);

  const clickCell = (i: number) => {
    if (phase !== "fill") return;
    if (i < filled) {
      setMsg(`${i}번 칸은 이미 채웠습니다`);
      return;
    }
    if (i !== next) {
      setMsg(`${i - 1}번과 ${i - 2}번 칸이 채워져야 ${i}번 칸을 채울 수 있어요. 앞 칸부터 채워 보세요`);
      return;
    }
    setMsg("");
    setOpen(i);
  };

  const pick = (value: number, correct: boolean) => {
    if (open === null) return;
    const a = TABLE[open - 1];
    const b = TABLE[open - 2];
    if (!correct) {
      setWrong(wrong + 1);
      setMsg(
        value === a
          ? `${a}가지는 한 칸 아래(${open - 1}번)에서 온 방법만 센 값입니다. 두 칸 아래(${open - 2}번)에서 한 번에 두 칸 올라오는 방법 ${b}가지가 빠졌어요`
          : `마지막 걸음은 한 칸(${open - 1}번에서)이거나 두 칸(${open - 2}번에서)이라서 ${a} + ${b} 입니다. 하나 더 세면 없는 방법을 만든 겁니다`,
      );
      return;
    }
    const nf = open + 1;
    setFilled(nf);
    setOpen(null);
    setMsg(`${open}번 계단은 ${a} + ${b} = ${TABLE[open]}가지입니다`);
    if (nf > STAIRS) {
      setPhase("done");
      onDone?.({ guess: PREDICT[guess ?? 0], actual: TABLE[PREDICT_STAIR], wrong });
    }
  };

  const reset = () => {
    setPhase("predict");
    setGuess(null);
    setFilled(2);
    setOpen(null);
    setWrong(0);
    setMsg("");
    onReset?.();
  };

  const ask =
    phase === "predict"
      ? "시작 자리(0번)에서 한 번에 1칸 또는 2칸씩 올라 6번째 계단까지 갑니다. 아래 표에는 계단마다 올라가는 방법이 몇 가지인지 적습니다. 0번 계단까지는 1가지, 1번 계단까지도 1가지(한 칸 오르기뿐)라고 적혀 있습니다."
      : phase === "done"
        ? `6번째 계단까지 올라가는 방법은 모두 ${TABLE[STAIRS]}가지입니다`
        : "6번째 계단까지 올라가는 방법은 몇 가지일까요? 칸을 눌러 채워 보세요. 앞의 두 칸이 채워져 있어야 누를 수 있습니다";

  return (
    <section className="algo-byhand algo-dp1" aria-label="계단 오르는 방법 표 채우기">
      <p className="algo-byhand-ask">{ask}</p>

      {phase === "predict" && (
        <div className="algo-dp1-predict">
          <p>
            <strong>먼저 맞혀 보세요. 4번째 계단까지는 몇 가지일까요?</strong>
          </p>
          {PREDICT.map((v, i) => (
            <button
              key={v}
              type="button"
              className="algo-opt"
              onClick={() => {
                setGuess(i);
                setPhase("fill");
              }}
            >
              {v}가지
            </button>
          ))}
        </div>
      )}

      {phase !== "predict" && (
        <p className="algo-dp1-guess">
          내 예상 <b>4번째 계단 {PREDICT[guess ?? 0]}가지</b>
        </p>
      )}

      <p className="algo-row-cap">계단까지 올라가는 방법의 수 (작은 숫자가 계단 번호)</p>
      <div className="algo-track-cells">
        {TABLE.map((v, i) => {
          const have = i < filled;
          const reads = open !== null && (i === open - 1 || i === open - 2);
          const cls = open === i ? "algo-cell-current" : reads ? "algo-cell-compare" : have ? "algo-cell-settled" : "algo-cell-out";
          return (
            <button
              key={i}
              type="button"
              className={`algo-cell ${cls}`}
              onClick={() => clickCell(i)}
              disabled={phase !== "fill"}
              aria-label={have ? `${i}번 계단 ${v}가지` : `${i}번 계단 아직 비어 있음`}
            >
              <span>{have ? v : "?"}</span>
              <span className="algo-cell-index">{i}</span>
            </button>
          );
        })}
      </div>

      {open !== null && (
        <div className="algo-dp1-pick">
          <p>
            <strong>
              {open}번 계단에 닿는 마지막 걸음은 한 칸(
              {open - 1}번 계단에서 {TABLE[open - 1]}가지)이거나 두 칸({open - 2}번 계단에서 {TABLE[open - 2]}가지)입니다. 모두 몇 가지일까요?
            </strong>
          </p>
          <div className="algo-dp1-choices" role="group" aria-label={`${open}번 칸에 넣을 값`}>
            {choices.map((c) => (
              <button key={c.value} type="button" className="algo-opt" onClick={() => pick(c.value, c.correct)}>
                {c.value}가지
              </button>
            ))}
          </div>
        </div>
      )}

      {msg && <p className="algo-dp1-msg">{msg}</p>}

      <div className="algo-byhand-foot">
        <span>
          채운 칸 <b>{Math.max(0, filled - 2)}</b>/{STAIRS - 1}
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
