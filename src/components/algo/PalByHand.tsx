"use client";

import { useState } from "react";
import {
  PAL_WORDS,
  PAL_PREDICT_WORD,
  palStart,
  palJudge,
  isPalindrome,
  type PalGuess,
  type PalState,
} from "@/lib/algo/string-basics";

export type PalResult = {
  /** 독자가 처음에 고른 예상. '알 수 없다' 는 unknown */
  guess: "same" | "differ" | "unknown";
  /** 예상했던 단어의 실제 결과(회문인가) */
  actual: boolean;
  /** 끝까지 판정한 단어와 그때 견준 쌍의 수 */
  done: { word: string; palindrome: boolean; checks: number }[];
};

type Guess = PalResult["guess"];

/** 예상 선택지 — 정답(다르다)을 첫 번째에 둔다. 이 페이지의 다른 질문과 정답 위치가 겹치지 않게 했다. */
const GUESSES: { v: Guess; label: string }[] = [
  { v: "differ", label: "다르다 — 뒤집으면 지버아" },
  { v: "same", label: "같다 — 뒤집어도 아버지" },
  { v: "unknown", label: "글자 수가 달라서 알 수 없다" },
];

/**
 * ① 직접 해 보기 — 글자 카드를 **맨 바깥 한 쌍부터 안쪽으로** 견주며 뒤집어도 같은 말인지 알아낸다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. **먼저 예상을 고른다**(아버지를 뒤집어 읽으면 같을까).
 * 독자는 지금 바깥 쌍이 '같다 / 다르다' 만 판정한다 — 다르면 거기서 끝이고, 같으면 안쪽 한 쌍으로 간다.
 * 아무 글자나 짚는 동작은 없다. 여기서 허용하는 동작이 곧 회문 판별의 동작이라 ② 되짚기가 ① 을 반증하지 않는다.
 * 아버지를 끝내야 다른 단어가 열리고, 아버지와 회문 하나를 끝내면 ② 가 열린다. 「처음부터」를 누르면 ② 도 다시 숨는다.
 */
export function PalByHand({ onDone }: { onDone?: (r: PalResult | null) => void }) {
  const [guess, setGuess] = useState<Guess | null>(null);
  const [word, setWord] = useState(PAL_PREDICT_WORD);
  const [st, setSt] = useState<PalState>(() => palStart(PAL_PREDICT_WORD));
  const [finished, setFinished] = useState<PalResult["done"]>([]);
  const [wrong, setWrong] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const cs = Array.from(word);
  const predictDone = finished.some((f) => f.word === PAL_PREDICT_WORD);

  const pick = (w: string) => {
    setWord(w);
    setSt(palStart(w));
    setMsg(null);
    setWrong(0);
  };

  const judge = (g: PalGuess) => {
    if (st.done || guess === null) return;
    const res = palJudge(word, st, g);
    setMsg({ ok: res.ok, text: res.text });
    if (!res.ok) {
      setWrong(wrong + 1);
      return;
    }
    setSt(res.next);
    if (res.next.done) {
      const rec = { word, palindrome: res.next.palindrome === true, checks: res.next.checks };
      const next = [...finished.filter((f) => f.word !== word), rec];
      setFinished(next);
      const hasPredict = next.some((f) => f.word === PAL_PREDICT_WORD);
      const hasPal = next.some((f) => f.palindrome);
      if (hasPredict && hasPal && guess) {
        onDone?.({ guess, actual: isPalindrome(PAL_PREDICT_WORD), done: next });
      }
    }
  };

  const reset = () => {
    setGuess(null);
    setWord(PAL_PREDICT_WORD);
    setSt(palStart(PAL_PREDICT_WORD));
    setFinished([]);
    setWrong(0);
    setMsg(null);
    onDone?.(null);
  };

  const cellState = (i: number) => {
    if (st.done && st.palindrome) return "algo-cell-settled";
    if (i < st.left || i > st.right) return "algo-cell-settled";
    if (st.done && !st.palindrome && (i === st.left || i === st.right)) return "algo-cell-dropped";
    if (i === st.left) return "algo-cell-current";
    if (i === st.right) return "algo-cell-compare";
    return "algo-cell-out";
  };

  const judging = guess !== null && !st.done;
  const a = cs[st.left];
  const b = cs[st.right];

  return (
    <section className="algo-byhand" aria-label="글자 카드를 바깥 쌍부터 견주기">
      <p className="algo-byhand-ask">
        {guess === null
          ? "먼저 맞혀 보세요. 앞에서 읽으나 뒤에서 읽으나 같은 말인지 알아내려고 합니다"
          : st.done
            ? st.palindrome
              ? "뒤집어도 같은 말입니다"
              : "뒤집으면 달라지는 말입니다"
            : "앞 글자와 뒤 글자가 같은지, 바깥 한 쌍씩 안쪽으로 견주세요"}
      </p>

      {guess === null ? (
        <div className="algo-pal-predict" role="group" aria-label="예상 고르기">
          <p className="algo-pal-ask">
            <strong>「{PAL_PREDICT_WORD}」 를 뒤집어 읽으면 어떨까요?</strong>
          </p>
          {GUESSES.map((g) => (
            <button key={g.v} type="button" className="algo-opt" onClick={() => setGuess(g.v)}>
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className="algo-pal-goal">
            목표 <b>앞에서 읽으나 뒤에서 읽으나 같은 말인지 알아내기</b>
          </p>

          <div className="algo-seg algo-pal-words" role="group" aria-label="단어 고르기">
            {PAL_WORDS.map((w) => {
              const locked = !predictDone && w !== PAL_PREDICT_WORD;
              return (
                <button
                  key={w}
                  type="button"
                  aria-pressed={w === word}
                  disabled={locked}
                  title={locked ? "먼저 「아버지」 를 끝내 보세요" : undefined}
                  onClick={() => pick(w)}
                >
                  {w}
                  {finished.some((f) => f.word === w) ? " ✔" : ""}
                </button>
              );
            })}
          </div>

          <div className="algo-track-cells algo-pal-cells" aria-label={`단어 ${word}`}>
            {cs.map((c, i) => (
              <div key={i} className={`algo-cell ${cellState(i)}`}>
                <span className="algo-cell-value">{c}</span>
                <span className="algo-cell-index">{i}</span>
              </div>
            ))}
          </div>
          <div className="algo-track-flags">
            {cs.map((_, i) => (
              <span key={i} className="algo-flag">
                {judging && i === st.left && i !== st.right ? "앞" : judging && i === st.right && i !== st.left ? "뒤" : ""}
              </span>
            ))}
          </div>

          {judging && (
            <>
              <p className="algo-pal-ask">
                앞 글자 <b>「{a}」</b> 와 뒤 글자 <b>「{b}」</b> 는 같은가요?
              </p>
              <div className="algo-pairs-btns">
                <button type="button" onClick={() => judge("same")}>
                  같다
                </button>
                <button type="button" onClick={() => judge("differ")}>
                  다르다
                </button>
              </div>
            </>
          )}

          {msg && (
            <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
              {msg.ok ? "✔ " : "✘ "}
              {msg.text}
            </p>
          )}

          {st.done && predictDone && !finished.some((f) => f.palindrome) && (
            <p className="algo-pal-hint">이번에는 뒤집어도 같은 말을 하나 해 보세요. 위 단어 중에서 고릅니다.</p>
          )}
        </>
      )}

      <div className="algo-byhand-foot">
        <span>
          견준 쌍 <b>{st.checks}</b>
          {wrong > 0 && (
            <>
              {" "}
              · 잘못 고른 횟수 <b>{wrong}</b>
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
