"use client";

import { useState } from "react";
import { pairCount, ops, log10Ops, timeLabel, fitsInSecond, opsLabel } from "@/lib/algo/big-o";

const N = 100_000;

/** 같은 일을 하는 세 방법. 독자에게는 이름 대신 하는 일만 보인다. */
const METHODS = [
  { id: "pairs", title: "모두와 모두를 견주기", how: "한 사람을 나머지 모두와 하나씩 견줍니다", count: pairCount(N), log10: Math.log10(pairCount(N)) },
  { id: "list", title: "한 명씩 보며 적어 두기", how: "한 명을 볼 때마다 적어 둔 곳에 같은 날이 있는지 봅니다", count: ops("linear", N), log10: log10Ops("linear", N) },
  { id: "sort", title: "생일순으로 줄 세우기", how: "줄을 세운 뒤 옆 사람과만 견줍니다", count: ops("nlogn", N), log10: log10Ops("nlogn", N) },
] as const;

/**
 * ① 직접 해 보기 — 1초 안에 끝날 것 같은 방법을 **먼저 고른다**.
 *
 * 숫자를 보기 전에 예상을 걸게 해서, ②에서 틀린 쪽이 자기 예상과 어긋나는 걸 겪게 한다.
 * 타이핑이 없다: 버튼 세 개를 켜고 끈 뒤 「확인」을 누른다.
 */
export function BudgetByHand({ onDone }: { onDone?: (hits: number) => void }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);

  const toggle = (id: string) => {
    if (checked) return;
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const check = () => {
    setChecked(true);
    onDone?.(METHODS.filter((m) => picked.has(m.id) === fitsInSecond(m.log10)).length);
  };

  const reset = () => {
    setPicked(new Set());
    setChecked(false);
  };

  return (
    <section className="algo-byhand" aria-label="1초 안에 끝날 방법 고르기">
      <p className="algo-byhand-ask">
        {N.toLocaleString("ko-KR")}명 중에 생일이 같은 두 사람이 있는지 찾습니다.
        <br />
        컴퓨터는 1초에 1억 번 일합니다. <b>1초 안에 끝날 방법</b>을 모두 고르세요.
      </p>

      <div className="algo-picks">
        {METHODS.map((m) => {
          const fits = fitsInSecond(m.log10);
          const on = picked.has(m.id);
          const state = !checked ? (on ? "on" : "off") : on === fits ? "hit" : "miss";
          return (
            <button key={m.id} type="button" className="algo-pick" data-state={state} aria-pressed={on} onClick={() => toggle(m.id)} disabled={checked}>
              <b>{m.title}</b>
              <span>{m.how}</span>
              {checked && (
                <em>
                  {opsLabel(m.log10)}번 → {fits ? "✔ 1초 안" : `✘ ${timeLabel(m.log10)}`}
                </em>
              )}
            </button>
          );
        })}
      </div>

      <div className="algo-byhand-foot">
        <span>{checked ? "예상과 실제를 견줘 보세요" : `고른 방법 ${picked.size}개`}</span>
        {checked ? (
          <button type="button" onClick={reset}>
            다시 고르기
          </button>
        ) : (
          <button type="button" onClick={check} className="algo-pick-go">
            확인
          </button>
        )}
      </div>
    </section>
  );
}
