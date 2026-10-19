"use client";

import { useState } from "react";
import { respond, sizeOf, worstCaseGuesses, type Range, type Verdict } from "@/lib/algo/up-down";

const LO = 1;
const HI = 100;

/**
 * 페이지 맨 위에서 독자가 직접 하는 것.
 *
 * 타이핑을 요구하지 않는다 — 출퇴근길에 한 손 엄지로 밀어서 고른다.
 * 맞히기 전에는 뒤 설명이 숨어 있다(`onWin` 이 켠다). 일곱 번이라는 숫자를 미리 알려 주지 않고
 * 독자가 자기 횟수를 본 뒤에 듣게 하려는 것이다.
 */
export function UpDownGame({ onWin }: { onWin?: () => void }) {
  const [secret, setSecret] = useState(() => randomSecret());
  // 가운데(50)에서 시작하면 "가운데를 부르면 좋다"를 독자가 발견할 기회가 사라진다. 끝(1)에서 시작한다
  const [pick, setPick] = useState(LO);
  const [note, setNote] = useState("");
  const [range, setRange] = useState<Range>({ lo: LO, hi: HI });
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [tries, setTries] = useState<number[]>([]);
  const over = verdict === "hit";

  const say = () => {
    if (over) return;
    // 같은 수를 연달아 말하면 시도로 세지 않는다 — 실수가 7번 비교에 섞이면 안 된다
    if (tries.at(-1) === pick) {
      setNote("방금 말한 수예요. 세지 않습니다");
      return;
    }
    setNote("");
    const r = respond(secret, pick, range);
    setRange(r.range);
    setVerdict(r.verdict);
    setTries((t) => [...t, pick]);
    if (r.verdict === "hit") onWin?.();
  };

  const reset = () => {
    setSecret(randomSecret());
    setPick(LO);
    setNote("");
    setRange({ lo: LO, hi: HI });
    setVerdict(null);
    setTries([]);
  };

  const left = sizeOf(range);
  const best = worstCaseGuesses(HI - LO + 1);

  return (
    <section className="algo-game" aria-label="업다운 게임">
      <div className="algo-game-range">
        <span>{LO}</span>
        <span>{left === 1 ? "후보 1개" : `남은 후보 ${left}개`}</span>
        <span>{HI}</span>
      </div>

      <div className="algo-game-bar">
        <i
          style={{
            left: `${((range.lo - LO) / (HI - LO + 1)) * 100}%`,
            right: `${((HI - range.hi) / (HI - LO + 1)) * 100}%`,
          }}
        />
        <b style={{ left: `${((pick - LO) / (HI - LO)) * 100}%` }} />
      </div>

      <p className="algo-game-pick">{pick}</p>
      <label className="algo-game-label" htmlFor="algo-updown">
        밀어서 고르고, 아래를 누르세요
      </label>
      <input
        id="algo-updown"
        type="range"
        min={LO}
        max={HI}
        value={pick}
        disabled={over}
        onChange={(e) => setPick(Number(e.target.value))}
      />

      <div className="algo-game-row">
        <button type="button" onClick={say} disabled={over}>
          이 수를 말한다
        </button>
        <button type="button" onClick={reset} className="algo-game-again">
          새 게임
        </button>
      </div>

      <p className="algo-game-react" role="status">
        {verdict === "higher" && "더 커요 ↑"}
        {verdict === "lower" && "더 작아요 ↓"}
        {verdict === "hit" && `맞았습니다 — ${tries.length}번 만에`}
        {note && <small className="algo-game-note">{note}</small>}
      </p>

      <ol className="algo-game-tries">
        {tries.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ol>

      {over && (
        <p className="algo-game-verdict">
          {tries.length <= best ? (
            <>
              가운데만 골라도 최대 {best}번입니다. <strong>{tries.length}번</strong>이면 그 안에
              들었습니다.
            </>
          ) : (
            <>
              <strong>{tries.length}번</strong> 걸렸습니다. 매번 가운데만 골랐다면{" "}
              <strong>최대 {best}번</strong>이었습니다.
            </>
          )}
        </p>
      )}
    </section>
  );
}

function randomSecret() {
  return Math.floor(Math.random() * (HI - LO + 1)) + LO;
}
