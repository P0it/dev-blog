"use client";

import { useState } from "react";
import { CARDS, TARGET_ORDER, applySort, isTarget, orderNames, tiesAfter, type Card, type SortKind } from "@/lib/algo/python-sort";

export type PsortResult = {
  /** 누른 버튼 순서 */
  presses: SortKind[];
  /** 독자가 처음에 고른 예상 */
  guess: string;
  /** 이름순 다음 점수순을 적용했을 때 80점 카드의 실제 순서 */
  actual: string;
  /** 예상이 맞았는가 */
  hit: boolean;
};

/** 예상 선택지 — 정답(이름순)을 세 번째에 둬서 위치로 찍을 수 없게 한다. */
const GUESSES = [
  { label: "원래 줄 순서 그대로: kim → amy → zed", names: ["kim", "amy", "zed"] },
  { label: "이름 거꾸로: zed → kim → amy", names: ["zed", "kim", "amy"] },
  { label: "이름순: amy → kim → zed", names: ["amy", "kim", "zed"] },
] as const;

const BUTTON: Record<SortKind, string> = { name: "이름순으로 줄 세우기", score: "점수 높은 순으로 줄 세우기" };
const SHORT: Record<SortKind, string> = { name: "이름순", score: "점수순" };

/**
 * ① 직접 해 보기 — 정렬 기준을 하나씩 적용해 목표 순서를 만든다.
 *
 * 용어가 없다. 타이핑도 없다. **먼저 예상을 고른다**(이름순을 먼저 하고 점수순을 나중에 하면 80점끼리는 어떤 순서일까).
 * 버튼은 두 개뿐이고, 누르면 지금 줄을 그 기준으로 다시 줄 세운다. 같은 값끼리는 지금 순서를 지킨다 —
 * 이 동작이 곧 정렬(sorted)의 동작이라 ② 되짚기가 ① 을 반증하지 않는다.
 * 점수순을 먼저 하고 이름순을 나중에 하면 점수 정렬이 지워진다 — 독자가 직접 겪는다.
 * 처음부터를 누르면 ② 도 다시 숨는다(`onDone(null)`).
 */
export function PsortByHand({ onDone }: { onDone?: (r: PsortResult | null) => void }) {
  const [cards, setCards] = useState<Card[]>(CARDS);
  const [guess, setGuess] = useState<number | null>(null);
  const [presses, setPresses] = useState<SortKind[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const done = isTarget(cards) && presses.length > 0;

  const reset = () => {
    setCards(CARDS);
    setGuess(null);
    setPresses([]);
    setMsg(null);
    onDone?.(null);
  };

  const press = (kind: SortKind) => {
    if (done || guess === null) return;
    const next = applySort(cards, kind);
    const ps = [...presses, kind];
    setCards(next);
    setPresses(ps);

    if (isTarget(next)) {
      setMsg({ ok: true, text: "목표 순서가 됐습니다" });
      const actual = tiesAfter("name", 80);
      onDone?.({
        presses: ps,
        guess: GUESSES[guess].label,
        actual: actual.join(" → "),
        hit: GUESSES[guess].names.join(",") === actual.join(","),
      });
      return;
    }
    const ties = next.filter((c) => c.score === 80).map((c) => c.name);
    setMsg({
      ok: true,
      text:
        kind === "name"
          ? "이름순으로 줄을 세웠습니다. 점수는 뒤섞였어요"
          : `점수 높은 순으로 줄을 세웠습니다. 80점끼리는 직전 줄의 순서를 지켰어요 (${ties.join(" → ")})`,
    });
  };

  return (
    <section className="algo-byhand" aria-label="정렬 기준을 하나씩 적용해 목표 순서 만들기">
      <p className="algo-byhand-ask">
        {done
          ? "목표 순서가 됐습니다"
          : guess === null
            ? "카드 여섯 장을 점수가 높은 사람부터, 점수가 같으면 이름순으로 세웁니다. 먼저 맞혀 보세요. 이름순으로 한 번 줄을 세운 뒤 점수 높은 순으로 줄을 세우면, 80점인 세 사람은 어떤 순서로 설까요?"
            : "버튼을 눌러 줄을 세웁니다. 누를 때마다 지금 줄이 그 기준으로 다시 정해집니다"}
      </p>

      <div className="algo-psort-cards" role="img" aria-label={`지금 줄: ${orderNames(cards).join(", ")}`}>
        {cards.map((c) => (
          <div key={c.name} className={`algo-psort-card${done ? " algo-psort-card-done" : ""}`}>
            <b>{c.name}</b>
            <span>{c.score}점</span>
          </div>
        ))}
      </div>
      <p className="algo-psort-goal">목표 순서 · {TARGET_ORDER.join(" · ")}</p>

      {guess === null && (
        <div className="algo-psort-predict" role="group" aria-label="예상 고르기">
          {GUESSES.map((g, i) => (
            <button key={g.label} type="button" className="algo-opt" onClick={() => setGuess(i)}>
              {g.label}
            </button>
          ))}
        </div>
      )}

      {guess !== null && !done && (
        <div className="algo-pairs-btns">
          {(Object.keys(BUTTON) as SortKind[]).map((k) => (
            <button key={k} type="button" onClick={() => press(k)}>
              {BUTTON[k]}
            </button>
          ))}
        </div>
      )}

      {msg && (
        <p className="algo-pairs-msg" data-ok={msg.ok} role="status">
          {msg.ok ? "✔ " : "✘ "}
          {msg.text}
        </p>
      )}

      <div className="algo-byhand-foot">
        <span>
          누른 횟수 <b>{presses.length}</b>
          {presses.length > 0 && <> · {presses.map((k) => SHORT[k]).join(" → ")}</>}
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
