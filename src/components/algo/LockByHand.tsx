"use client";

import { useState } from "react";
import { LOCK_SECRET, lockKey } from "@/lib/algo/brute-force";
import { josa } from "@/lib/algo/josa";

/** 이만큼 해 보고도 못 열면 그만하고 정답을 볼 수 있다. 막막함이 아니라 숫자를 보게 하려는 장치다. */
const GIVE_UP_AFTER = 8;

/**
 * ① 직접 해 보기 — 세 자리 자물쇠를 연다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. ▲▼ 로 번호를 맞춘 뒤 「열어 보기」를 누르면 **번호 하나를 해 본 것**이다.
 * 칸을 돌리는 것은 시도로 세지 않는다. 같은 번호를 또 해 보면 세지 않고 알려 준다 —
 * 빠뜨리지 않는 순서를 스스로 정하게 하는 것이 ②되짚기의 재료다.
 */
export function LockByHand({
  onDone,
  onReset,
}: {
  onDone?: (tries: number, gaveUp: boolean) => void;
  onReset?: () => void;
}) {
  const [dials, setDials] = useState([0, 0, 0]);
  const [tries, setTries] = useState(0);
  const [tried, setTried] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const turn = (i: number, d: 1 | -1) => {
    if (open || gaveUp) return;
    setDials(dials.map((v, k) => (k === i ? (v + d + 10) % 10 : v)));
    setMsg("");
  };

  const tryOpen = () => {
    if (open || gaveUp) return;
    const key = lockKey(dials);
    if (tried.includes(key)) {
      setMsg(`${key}${josa(Number(key), "은", "는").slice(-1)} 이미 해 본 번호예요. 세지 않습니다`);
      return;
    }
    const t = tries + 1;
    setTries(t);
    setTried([...tried, key]);
    if (key === lockKey(LOCK_SECRET)) {
      setOpen(true);
      setMsg("");
      onDone?.(t, false);
    } else {
      setMsg(`${key} — 열리지 않았습니다`);
    }
  };

  const giveUp = () => {
    setGaveUp(true);
    setMsg("");
    onDone?.(tries, true);
  };

  const reset = () => {
    setDials([0, 0, 0]);
    setTries(0);
    setTried([]);
    setMsg("");
    setOpen(false);
    setGaveUp(false);
    onReset?.(); // 되짚기도 다시 숨긴다
  };

  const done = open || gaveUp;

  return (
    <section className="algo-byhand" aria-label="자물쇠 열어 보기">
      <p className="algo-byhand-ask">
        {open
          ? "열렸습니다"
          : gaveUp
            ? `정답은 ${lockKey(LOCK_SECRET)} 이었습니다`
            : "번호는 세 자리입니다. ▲▼로 번호를 맞추고 「열어 보기」를 누르세요. 누를 때마다 1번으로 셉니다. 같은 번호를 또 해 보지 않으려면 어떤 순서가 좋을까요?"}
      </p>

      <div className="algo-lock" data-open={open}>
        {dials.map((v, i) => (
          <div key={i} className="algo-dial">
            <button type="button" aria-label={`${i + 1}번째 칸 올리기`} onClick={() => turn(i, 1)} disabled={done}>
              ▲
            </button>
            <b aria-live="polite">{v}</b>
            <button type="button" aria-label={`${i + 1}번째 칸 내리기`} onClick={() => turn(i, -1)} disabled={done}>
              ▼
            </button>
          </div>
        ))}
      </div>

      <div className="algo-lock-go">
        <button type="button" className="algo-go" onClick={tryOpen} disabled={done}>
          열어 보기
        </button>
        <span role="status">{msg}</span>
      </div>

      <div className="algo-byhand-foot">
        <span>
          열어 본 횟수 <b>{tries}</b>
        </span>
        {!done && tries >= GIVE_UP_AFTER && (
          <button type="button" onClick={giveUp}>
            그만 해 보고 정답 보기
          </button>
        )}
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
