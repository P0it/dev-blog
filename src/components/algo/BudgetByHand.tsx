"use client";

import { useState } from "react";
import { pairCount, log10Ops, timeLabel, fitsInSecond, opsLabel } from "@/lib/algo/big-o";

const N = 100_000;

/**
 * 같은 일을 하는 두 방법. 독자에게는 이름 대신 하는 일만 보인다.
 *
 * 줄 세우기(N log N)는 일부러 뺐다 — 중학생이 가늠할 근거가 없어 찍기가 된다.
 * 대신 ② 되짚기에서 세 번째 방법으로 소개한다.
 */
const METHODS = [
  {
    id: "pairs",
    title: "모두와 모두를 견주기",
    how: "한 장을 나머지 모든 장과 하나씩 견줍니다",
    log10: Math.log10(pairCount(N)),
  },
  {
    id: "mark",
    title: "번호 칸에 표시해 두기",
    how: "번호마다 칸을 하나씩 둡니다. 한 장을 볼 때 그 번호의 칸에 이미 표시가 있는지 바로 봅니다",
    log10: log10Ops("linear", N),
  },
] as const;

/**
 * ① 직접 해 보기 — 1초 안에 끝날 것 같은 방법을 **먼저 고른다**.
 *
 * 예상을 먼저 걸게 해서, ②에서 실제 횟수와 자기 예상이 어긋나는 걸 겪게 한다.
 * 타이핑이 없다: 버튼을 켜고 끈 뒤 「확인」을 누른다.
 * 결과는 방법마다 「내 예상 / 실제 / 맞았나」 한 줄이다 — 색은 예상이 맞았는지만 뜻한다.
 */
export function BudgetByHand({ onDone }: { onDone?: (hits: number | null) => void }) {
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
    onDone?.(null);
  };

  return (
    <section className="algo-byhand" aria-label="1초 안에 끝날 방법 고르기">
      <p className="algo-byhand-ask">
        번호표가 {N.toLocaleString("ko-KR")}장 있습니다. <b>번호가 같은 두 장</b>이 있는지 찾습니다. 같은 번호가 없을 수도 있습니다.
        <br />
        컴퓨터는 1초에 약 1천만 번 일합니다. <b>1초 안에 끝날 방법</b>을 모두 고르세요.
      </p>

      <div className="algo-picks algo-picks-2">
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
                  내 예상: {on ? "1초 안에 끝남" : "못 끝남"} · 실제: {opsLabel(m.log10)}번, {fits ? "1초 안" : `${timeLabel(m.log10)} 걸림`} →{" "}
                  <u>{on === fits ? "맞았어요" : "틀렸어요"}</u>
                </em>
              )}
            </button>
          );
        })}
      </div>

      <div className="algo-byhand-foot">
        <span>{checked ? "고른 것이 예상입니다. 안 고른 방법은 못 끝난다는 예상으로 셉니다" : `고른 방법 ${picked.size}개`}</span>
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
