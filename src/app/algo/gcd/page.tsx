import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { GcdPlayer } from "@/components/algo/GcdPlayer";
import { GcdReveal } from "@/components/algo/GcdReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { HAND, euclidCount, gcd, gcdTape, pauseSpec } from "@/lib/algo/gcd";
import { josa } from "@/lib/algo/josa";
import { timeLabel } from "@/lib/algo/big-o";
import type { Tape } from "@/lib/algo/types";

export const metadata: Metadata = {
  title: "최대공약수",
  description: "유클리드가 2300년 전에 푼 문제",
};

// 입력 세 가지 — ① 에서 한 48·18, 서로소, 작은 수가 앞
const INPUTS = {
  a: [48, 18],
  b: [17, 5],
  c: [18, 48],
} as const;
type Key = keyof typeof INPUTS;

// 10억 근처에서 반복이 가장 많은 쌍(이웃한 피보나치 수)
const WORST = [1_134_903_170, 701_408_733] as const;

/** 두 번째 반복 앞에서 묻는 예측 — 정답은 첫 번째 */
function makePause(tape: Tape): PlayerPause | undefined {
  const p = pauseSpec(tape);
  if (!p) return undefined;
  const label = ([x, y]: [number, number]) => `a = ${x}, b = ${y}`;
  const r = p.a % p.b;
  return {
    at: p.at,
    ask: (
      <>
        누르기 전에 맞혀 보세요. 지금 a = {p.a}, b = {p.b} 입니다. 3번 줄 <code>a, b = b, a % b</code> 를 실행하면 a, b 는
        얼마가 될까요?
      </>
    ),
    options: [
      { label: label(p.right), correct: true },
      { label: label(p.wrongs[0]) },
      { label: label(p.wrongs[1]) },
    ],
    why: (
      <>
        {josa(p.a, "을", "를")} {josa(p.b, "으로", "로")} 나눈 나머지는 {r} 입니다. a 는 b 였던 {p.b}, b 는 나머지 {josa(r, "이", "가")} 됩니다.
      </>
    ),
  };
}

export default async function GcdPage() {
  const keys = Object.keys(INPUTS) as Key[];
  const tapes = Object.fromEntries(
    await Promise.all(keys.map(async (k) => [k, await highlightTape(gcdTape(INPUTS[k][0], INPUTS[k][1]))])),
  ) as Record<Key, Tape>;

  const pauses: Partial<Record<Key, PlayerPause>> = {};
  for (const k of keys) {
    const p = makePause(tapes[k]);
    if (p) pauses[k] = p;
  }

  const note = (k: Key): string => {
    const [a, b] = INPUTS[k];
    const g = gcd(a, b);
    const extra = k === "b" ? " 서로소라 한 변 1 짜리까지 내려갑니다." : k === "c" ? " 작은 수가 앞이라 첫 반복은 자리만 바뀝니다." : "";
    return `${josa(a, "과", "와")} ${b} 의 최대공약수는 ${g} 입니다. 나머지를 ${euclidCount(a, b)}번 구하면 끝납니다.${extra}`;
  };

  const worstSteps = euclidCount(WORST[0], WORST[1]);
  const trialSteps = WORST[1];

  return (
    <main className="algo-page">
      <p className="algo-crumb">수학</p>
      <h1 className="algo-title">최대공약수</h1>
      <p className="algo-lede">유클리드가 2300년 전에 푼 문제</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>바닥에 타일을 빈틈없이 깔아 보세요. 정사각형 타일만 쓰고 한 줄씩 가장 큰 것으로 깝니다.</p>

      <GcdReveal>
        <p className="algo-chain">
          48 % 18 = 12 → 18 % 12 = 6 → 12 % 6 = 0<span>나머지를 계속 구해 0 이 되면 끝입니다.</span>
        </p>
        <p>
          나머지가 0 이 될 때 나누는 수 = <strong>최대공약수</strong>(gcd). 이 방법 = <strong>유클리드 호제법</strong>. 2300년 전
          유클리드가 책에 적었습니다.
        </p>
        <Counter
          rows={[
            { label: "큰 수부터 내려가며 약수 찾기", n: trialSteps, unit: "번" },
            { label: "유클리드 방법", n: worstSteps, unit: "번" },
          ]}
          caption={`10억 근처의 두 수(${WORST[0].toLocaleString("ko-KR")}, ${WORST[1].toLocaleString("ko-KR")})입니다. 하나씩 내려가면 약 ${timeLabel(Math.log10(trialSteps))}, 나머지로 줄이면 많아야 ${worstSteps}번이라 순식간입니다.`}
        />
      </GcdReveal>

      {/* ③ 조건 짚기 */}
      <h2>나머지가 0 이 되면 끝난다</h2>
      <ul className="algo-keys">
        <li>
          <b>더 놓을 칸이 없는 줄</b> — 정사각형이 바닥을 딱 채우면 나머지가 0 이다. 그 줄의 정사각형 한 변이 답이다
        </li>
        <li>
          <b>빈틈없이 채우는 정사각형</b> — 한 변 3 짜리로도 깔 수 있지만 가장 큰 것은 6 이다. 가장 큰 것 = 최대공약수
        </li>
        <li>
          <b>그래서</b> — 가장 큰 정사각형으로 깔면 한 줄마다 바닥이 확 줄어든다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 나머지를 넘겨 주는 한 줄이 전부다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 바닥이 줄어드는 걸 보세요. 처음 화면은 ①에서 깐 {HAND.a}×{HAND.b} 입니다. 아래
        버튼으로 다른 두 수도 돌려 볼 수 있습니다.
      </p>

      <GcdPlayer
        tapes={tapes}
        labels={{ a: "48과 18", b: "17과 5 (서로소)", c: "18과 48 (작은 수가 앞)" }}
        pauses={pauses}
        notes={{ a: note("a"), b: note("b"), c: note("c") }}
      />

      <ul className="algo-keys">
        <li>
          <b>
            <code>while b</code>
          </b>{" "}
          — 나머지가 0 이 아닌 동안 계속한다. 바닥이 남아 있다는 뜻이다
        </li>
        <li>
          <b>
            <code>a, b = b, a % b</code>
          </b>{" "}
          — 짧은 변이 새 긴 변이 되고 나머지가 새 짧은 변이 된다
        </li>
        <li>
          <b>
            <code>return a</code>
          </b>{" "}
          — b 가 0 이 되면 그때의 a 가 최대공약수다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            <code>gcd(84, 36)</code> 은 얼마일까요?
          </>
        }
        options={[
          { label: "36 — 작은 수가 곧 답이다" },
          { label: "6 — 둘 다 6 으로 나뉜다" },
          { label: `${gcd(84, 36)} — 84 % 36 = 12, 36 % 12 = 0`, correct: true },
        ]}
        why={
          <>
            84 % 36 = 12, 36 % 12 = 0 이라서 답은 <strong>{gcd(84, 36)}</strong> 입니다. 작은 수가 곧 답인 건 <code>gcd(36, 72)</code> 처럼 작은 수가 큰 수를 나눌 때뿐입니다. 6 은 공통 약수이긴 해도 가장 크지 않습니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>최대공약수에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>실전에서는</b> — <code>math.gcd(a, b)</code> 한 줄이다. 여러 수도 <code>math.gcd(48, 36, 24)</code> 로 12 가 나온다
        </li>
        <li>
          <b>최소공배수는</b> — <code>a * b // gcd(a, b)</code> 로 구한다. 84 와 36 이면 252 다. <code>/</code> 를 쓰면 <code>252.0</code> 처럼
          실수가 나온다
        </li>
        <li>
          <b>작은 수가 앞에 와도</b> — 틀리지 않는다. <code>gcd(18, 48)</code> 은 첫 반복에서 <code>(48, 18)</code> 로 자리가 바뀐 뒤 6 이
          나온다
        </li>
        <li>
          <b>0 이 들어오면</b> — <code>gcd(12, 0)</code> 은 12, <code>math.gcd(0, 0)</code> 은 0 이다
        </li>
        <li>
          <b>기약분수는</b> — 분자와 분모를 gcd 로 나눈다. 18/48 은 gcd 가 6 이라 3/8 이다
        </li>
        <li>
          <b>약수를 하나씩 찾으면</b> — 1천만 근처의 두 수에서 0.54초, 유클리드는 0.0000002초다(Python 3.14, 컴퓨터마다 다르다)
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>최대공약수·최소공배수</b>
        <b>기약분수로 만들기</b>
        <b>주기가 다시 맞물리는 때</b>
      </div>
      <p className="algo-next">다음 장에서는 소수를 체로 거르는 에라토스테네스의 체를 봅니다.</p>
    </main>
  );
}
