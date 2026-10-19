"use client";

import { useState } from "react";
import { EDIT_ACTIONS, nextAction, undoTop, canUndoAt } from "@/lib/algo/stack";

export type EditResult = {
  /** 독자가 처음에 고른 예상 */
  guess: string;
  /** 두 번 되돌린 뒤 실제로 남은 것 */
  remaining: string;
  /** 되돌린 순서 */
  undone: string[];
};

/** 예상 선택지 — 한 일의 순서와 다르게 늘어놓아야 위치로 찍을 수 없다. */
const GUESSES = ["색 바꾸기", "그림 넣기", "글자 굵게"] as const;
const ANSWER = "글자 굵게";

/**
 * ① 직접 해 보기 — 편집기에서 작업 세 가지를 하고 되돌려 본다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. **먼저 예상을 고른다**(두 번 되돌리면 무엇이 남을까).
 * 되돌리기는 맨 위(가장 마지막에 한 것)만 나가고, 가운데 것을 누르면 왜 안 되는지 말한다 —
 * 여기서 허용하는 동작이 곧 스택의 동작이라 ②되짚기가 ①을 반증하지 않는다.
 * 처음부터를 누르면 ② 도 다시 숨는다(`onDone(null)`).
 */
export function EditByHand({ onDone }: { onDone?: (r: EditResult | null) => void }) {
  const [guess, setGuess] = useState<string | null>(null);
  const [pile, setPile] = useState<string[]>([]);
  // 세 가지를 다 했는가 — 그 뒤로는 새 작업을 못 하고 되돌리기만 한다
  const [peaked, setPeaked] = useState(false);
  const [undoAfterPeak, setUndoAfterPeak] = useState(0);
  const [undoCount, setUndoCount] = useState(0);
  const [undoneList, setUndoneList] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [finished, setFinished] = useState(false);

  const todo = nextAction(pile);

  const act = (a: string) => {
    if (guess === null || peaked || finished || a !== todo) return;
    const next = [...pile, a];
    setPile(next);
    setMsg(null);
    if (next.length === EDIT_ACTIONS.length) setPeaked(true);
  };

  const undo = () => {
    if (finished) return;
    const r = undoTop(pile);
    if (r.undone === null) {
      setMsg({ ok: false, text: "되돌릴 일이 없습니다. 먼저 작업을 해 보세요" });
      return;
    }
    const list = [...undoneList, r.undone];
    setPile(r.pile);
    setUndoCount(undoCount + 1);
    setUndoneList(list);
    setMsg({ ok: true, text: `되돌렸습니다 → ${r.undone}` });
    if (peaked) {
      const after = undoAfterPeak + 1;
      setUndoAfterPeak(after);
      if (after === 2) {
        setFinished(true);
        onDone?.({ guess: guess ?? "", remaining: r.pile[0], undone: list.slice(-2) });
      }
    }
  };

  const pickFromPile = (index: number) => {
    if (finished) return;
    if (canUndoAt(pile, index)) {
      undo();
      return;
    }
    setMsg({
      ok: false,
      text: `가운데 있는 「${pile[index]}」만 따로 되돌릴 수는 없어요. 되돌리기는 맨 위, 가장 최근에 한 것부터 나갑니다`,
    });
  };

  const reset = () => {
    setGuess(null);
    setPile([]);
    setPeaked(false);
    setUndoAfterPeak(0);
    setUndoCount(0);
    setUndoneList([]);
    setMsg(null);
    setFinished(false);
    onDone?.(null);
  };

  const bold = pile.includes("글자 굵게");
  const image = pile.includes("그림 넣기");
  const color = pile.includes("색 바꾸기");

  return (
    <section className="algo-byhand" aria-label="편집기에서 작업을 하고 되돌려 보기">
      {guess === null ? (
        <div className="algo-edit-predict" role="group" aria-label="예상 고르기">
          <p className="algo-byhand-ask">
            문서에 <b>글자 굵게 → 그림 넣기 → 색 바꾸기</b> 를 차례로 합니다. 그리고 되돌리기를 <b>두 번</b> 누릅니다.
            <br />
            문서에 무엇이 남을까요? 먼저 골라 보세요.
          </p>
          <div className="algo-pairs-btns">
            {GUESSES.map((g) => (
              <button key={g} type="button" onClick={() => setGuess(g)}>
                {g}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="algo-byhand-ask">
            {finished
              ? "두 번 되돌렸습니다"
              : peaked
                ? "세 가지를 다 했습니다. 이제 되돌리기를 두 번 누르세요"
                : `내 예상: ${guess}. 이제 ${EDIT_ACTIONS.join(" → ")} 순서로 눌러 보세요`}
          </p>

          <div className="algo-edit">
            <div className="algo-edit-left">
              <div className="algo-edit-doc" data-bold={bold} data-color={color} aria-label="문서 미리보기">
                <p className="algo-edit-title">오늘의 일기</p>
                {image && <div className="algo-edit-img">그림</div>}
              </div>
              <div className="algo-edit-btns">
                {EDIT_ACTIONS.map((a) => (
                  <button key={a} type="button" onClick={() => act(a)} disabled={peaked || finished || a !== todo}>
                    {a}
                  </button>
                ))}
                <button type="button" className="algo-edit-undo" onClick={undo} disabled={finished || pile.length === 0}>
                  되돌리기 (Ctrl+Z)
                </button>
              </div>
            </div>

            <div className="algo-edit-right">
              <p className="algo-row-cap">한 일 (위가 가장 최근)</p>
              <ol className="algo-pile" aria-label="한 일 목록">
                {pile.length === 0 && <li className="algo-pile-empty">아직 한 일이 없습니다</li>}
                {pile
                  .map((a, i) => ({ a, i }))
                  .reverse()
                  .map(({ a, i }) => (
                    <li key={i}>
                      <button
                        type="button"
                        className={`algo-pile-item${canUndoAt(pile, i) ? " top" : ""}`}
                        onClick={() => pickFromPile(i)}
                        disabled={finished}
                      >
                        {a}
                      </button>
                    </li>
                  ))}
              </ol>
            </div>
          </div>
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
          한 일 <b>{pile.length}</b> · 되돌린 횟수 <b>{undoCount}</b>
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}

export { ANSWER as EDIT_ANSWER };
