"use client";

import { useState } from "react";
import { HASH_NAMES, calcText, codeSum, remText, slotOf, tryPlace } from "@/lib/algo/hash";
import { Lockers } from "./StageHash";

export type HashResult = { presses: number; wrong: number; predicted: boolean };

/** 마지막 이름 zed 의 칸을 먼저 맞힌다. 정답은 3번 칸(bob 과 같은 칸)이고 세 번째에 둔다. */
const PREDICT = [{ label: "4번 칸" }, { label: "1번 칸" }, { label: "3번 칸", correct: true }];

/**
 * ① 직접 해 보기 — 이름표 여섯 개를 사물함 8칸에 넣는다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 규칙은 화면에 적혀 있다 — 이름의 글자 번호를 모두 더해 8 로 나눈 나머지가 칸 번호.
 * 이름마다 「계산하기」를 눌러 계산을 보고, 그 번호의 칸을 직접 누른다. 다른 칸은 들어가지 않는다 —
 * ② 가 말하는 "이름이 칸을 정한다" 와 ① 이 어긋나지 않게 하려는 것이다.
 * 마지막 이름 zed 앞에서 **예측** 한 번을 한다. 이미 bob 이 있는 칸이라 이어 붙는다.
 */
export function HashByHand({ onDone, onReset }: { onDone?: (r: HashResult) => void; onReset?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [calced, setCalced] = useState(false);
  const [buckets, setBuckets] = useState<string[][]>(() => Array.from({ length: 8 }, () => []));
  const [picked, setPicked] = useState<number | null>(null);
  const [presses, setPresses] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const last = HASH_NAMES.length - 1;
  const finished = idx >= HASH_NAMES.length;
  const name = HASH_NAMES[idx];
  const needsPredict = idx === last && picked === null;

  const calc = () => {
    setCalced(true);
    setPresses(presses + 1);
  };

  const pick = (i: number) => {
    if (finished || !calced) return;
    const res = tryPlace(buckets, name, i);
    setPresses(presses + 1);
    setMsg({ ok: res.ok, text: res.text });
    if (!res.ok) {
      setWrong(wrong + 1);
      return;
    }
    setBuckets(res.buckets);
    setCalced(false);
    const next = idx + 1;
    setIdx(next);
    if (next >= HASH_NAMES.length) {
      onDone?.({ presses: presses + 1, wrong, predicted: picked !== null && PREDICT[picked].correct === true });
    }
  };

  const reset = () => {
    setIdx(0);
    setCalced(false);
    setBuckets(Array.from({ length: 8 }, () => []));
    setPicked(null);
    setPresses(0);
    setWrong(0);
    setMsg(null);
    onReset?.();
  };

  return (
    <section className="algo-byhand algo-hash-hand" aria-label="사물함에 이름표 넣어 보기">
      <p className="algo-byhand-ask">
        {finished ? "이름표 여섯 개를 모두 넣었습니다" : "이름표 여섯 개를 사물함 8칸에 하나씩 넣습니다"}
      </p>
      <p className="algo-hash-rule">
        <b>규칙</b> 이름의 글자마다 번호가 있습니다 (<code>a=97</code>, <code>b=98</code> …). 글자 번호를 모두 더하고{" "}
        <b>8로 나눈 나머지</b>가 그 이름표가 들어갈 칸 번호입니다.
      </p>

      <Lockers buckets={buckets} onPick={calced && !finished ? pick : undefined} label="사물함 8칸 — 칸을 눌러 넣기" />

      {!finished && needsPredict && (
        <div className="algo-qd-predict">
          <p className="algo-quiz-q">
            <strong>
              마지막 이름표 <code>zed</code> 의 글자 번호는 <code>z=122</code>, <code>e=101</code>, <code>d=100</code> 입니다. 먼저 맞혀
              보세요. 몇 번 칸으로 갈까요?
            </strong>
          </p>
          {PREDICT.map((o, i) => (
            <button key={i} type="button" className="algo-opt" onClick={() => setPicked(i)}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {!finished && !needsPredict && (
        <>
          {idx === last && picked !== null && (
            <p className="algo-qd-guess">
              내 예상 <b>{PREDICT[picked].label}</b>
            </p>
          )}
          <p className="algo-qd-event" aria-live="polite">
            <span>
              이름표 {idx + 1} / {HASH_NAMES.length}
            </span>
            <b>{name}</b>
          </p>

          {calced ? (
            <div className="algo-hash-calc" role="status">
              <p>
                <span>글자 번호의 합</span> <code>{calcText(name)}</code>
              </p>
              <p>
                <span>8로 나누기</span> <code>{remText(name)}</code>
              </p>
              <p className="algo-hash-go">
                나머지는 <b>{slotOf(name)}</b>. 위에서 <b>{slotOf(name)}번 칸</b>을 누르세요
              </p>
            </div>
          ) : (
            <div className="algo-pairs-btns">
              <button type="button" onClick={calc}>
                글자 번호 더하고 8로 나누기
              </button>
            </div>
          )}
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
          누른 횟수 <b>{presses}</b>
          {wrong > 0 && (
            <>
              {" "}
              · 잘못 누른 횟수 <b>{wrong}</b>
            </>
          )}
          {finished && (
            <>
              {" "}
              · 마지막 합 <b>{codeSum(HASH_NAMES[last])}</b>
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
