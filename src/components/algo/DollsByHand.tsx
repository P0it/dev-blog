"use client";

import type { ReactNode } from "react";
import { useState } from "react";

const N = 4;

/**
 * ① 직접 해 보기 — 상자 안의 상자를 안쪽 끝까지 열고, 열었던 순서의 반대로 닫는다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. 버튼 하나가 열기에서 닫기로 바뀐다.
 * 다 닫고 나면 센 횟수가 ②되짚기의 재료가 된다.
 */
export function DollsByHand({ onDone }: { onDone?: (moves: number) => void }) {
  const [depth, setDepth] = useState(0);
  const [closing, setClosing] = useState(false);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);

  const press = () => {
    if (done) return;
    const m = moves + 1;
    setMoves(m);
    if (!closing) {
      const d = depth + 1;
      setDepth(d);
      if (d === N) setClosing(true);
    } else {
      const d = depth - 1;
      setDepth(d);
      if (d === 0) {
        setDone(true);
        onDone?.(m);
      }
    }
  };

  const reset = () => {
    setDepth(0);
    setClosing(false);
    setMoves(0);
    setDone(false);
  };

  const render = (lvl: number): ReactNode =>
    lvl > depth ? (
      <div className="algo-box closed">상자 {lvl} · 닫혀 있음</div>
    ) : (
      <div className={`algo-box d${lvl % 4}`}>
        <span className="algo-box-label">상자 {lvl}</span>
        {lvl === N ? <div className="algo-marble" role="img" aria-label="구슬" /> : render(lvl + 1)}
      </div>
    );

  const ask = done
    ? "전부 처음처럼 닫았습니다"
    : closing
      ? "구슬이 나왔습니다. 열었던 상자를 안쪽부터 하나씩 닫으세요"
      : "상자 안에 상자가 들어 있습니다. 맨 안쪽에 뭐가 있는지 열어 보세요";

  return (
    <section className="algo-byhand" aria-label="상자 안의 상자 열고 닫기">
      <p className="algo-byhand-ask">{ask}</p>

      <div className="algo-dolls">{render(1)}</div>

      <div className="algo-byhand-foot">
        <span>
          누른 횟수 <b>{moves}</b>
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          {!done && (
            <button type="button" className="algo-pick-go" onClick={press}>
              {closing ? "가장 안쪽 상자 닫기" : "안쪽 상자 열기"}
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
