import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { SievePlayer } from "@/components/algo/SievePlayer";
import { SieveReveal } from "@/components/algo/SieveReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import {
  sieveTape,
  SIEVE_N,
  primesUpTo,
  largestPress,
  innerWrites,
  outerChecks,
  sieveWithout01,
} from "@/lib/algo/sieve";

const N = SIEVE_N;
const PRIMES = primesUpTo(N);
const QUIZ_N = 100;
const QUIZ_PRESS = largestPress(QUIZ_N); // 7

export const metadata: Metadata = {
  title: "에라토스테네스의 체",
  description: "소수를 체로 거르기",
};

export default async function SievePage() {
  const raw = sieveTape(N);
  const tape = await highlightTape(raw);

  // i = 4 에서 5번 줄을 실행하기 직전에 묻는다 — 4 는 2 의 배수라 이미 지워진 수다
  const at = raw.steps.findIndex((s) => s.line === 5 && s.vars.i === 4);
  const pause: PlayerPause = {
    at,
    ask: <>누르기 전에 맞혀 보세요. i 가 4 입니다. 4 가 있는 칸은 이미 지워져 있습니다. 안쪽 반복이 돌까요?</>,
    options: [
      { label: "돈다 — 4 의 배수 16, 20, 24 … 를 지워야 하니까" },
      { label: "돈다 — 모든 i 에서 안쪽 반복이 돈다" },
      { label: "돌지 않는다 — 4 는 2 의 배수로 이미 지워졌으니까", correct: true },
    ],
    why: (
      <>
        5번 줄 <code>if is_prime[i]</code> 가 거짓이라 안쪽 반복으로 들어가지 않습니다. 4 의 배수는 모두 2 의 배수라 2 가 이미
        지웠습니다. 안쪽 반복은 지워지지 않은 수에서만 돕니다.
      </>
    ),
  };

  const bad = sieveWithout01(N);

  return (
    <main className="algo-page">
      <p className="algo-crumb">수학</p>
      <h1 className="algo-title">에라토스테네스의 체</h1>
      <p className="algo-lede">소수를 체로 거르기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        1부터 {N}까지 수가 있습니다. <strong>몇 개가 남을지 먼저 고르고</strong> 지워지지 않은 가장 작은 수를 눌러 그 수의
        배수를 지워 보세요.
      </p>

      <SieveReveal>
        <ul className="algo-keys">
          <li>
            <b>남은 수</b> — {PRIMES.length}개: {PRIMES.join(" ")}
          </li>
          <li>
            <b>이 수들의 공통점</b> — 1 과 자기 자신 말고는 나누어떨어지는 수가 없다
          </li>
        </ul>
        <p>
          약수가 1 과 자기 자신뿐인 수 = <strong>소수</strong>(prime number)
        </p>
        <p>
          작은 수부터 그 배수를 지워 나가는 방법 = <strong>에라토스테네스의 체</strong>
        </p>
        <p>
          7 까지만 눌러도 끝이었습니다. 11 부터는 11 × 11 = 121 이 {N}을 넘어서 눌러도 지울 수가 없습니다. {N} 이하의 합성수는
          7 이하의 소수를 약수로 하나는 가지기 때문입니다.
        </p>
        <Counter
          rows={[
            { label: "수마다 나눠 보기 · 1000만 이하", n: 54.8, unit: "초" },
            { label: "체 · 1000만 이하", n: 0.55, unit: "초" },
          ]}
          caption="직접 재 본 값입니다. 100만 이하는 나눠 보기 1.9초, 체 0.038초였습니다(Python 3.14, 컴퓨터마다 다릅니다). 체는 칸을 평균 두 번쯤만 건드립니다(100만 칸에 2,122,048번)."
        />
      </SieveReveal>

      {/* ③ 조건 짚기 */}
      <h2>남은 수는 더 작은 수의 배수가 아니다</h2>
      <ul className="algo-keys">
        <li>
          <b>지워지지 않은 수</b> — 더 작은 어떤 수의 배수도 아니다. 그래서 1 과 자기 자신 말고는 약수가 없다
        </li>
        <li>
          <b>작은 수부터 누른다</b> — 앞에서 누른 수가 합성수를 대신 지워 준다. 방금 막혔던 이유다. 3 이 남아 있는데 9 를
          누르면 9 는 아직 지워지지 않았을 뿐 약수가 3 인 수다
        </li>
        <li>
          <b>처음부터 지워 둔 1</b> — 약수가 1 하나뿐이라 &ldquo;1 과 자기 자신&rdquo; 규칙에서 따로 뺐다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 소수를 만날 때마다 배수를 지운다</h2>
      <p>
        위에서 지운 것과 <strong>같은 1~{N}</strong> 입니다. <code>is_prime[k]</code> 가 True 인 수가 지워지지 않고 남은 수입니다.
      </p>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 지워지는 칸을 보세요. 안쪽 반복은 칸마다 되풀이되지만 소수 하나당 두
        스텝으로 묶어 보여 줍니다.
      </p>

      <SievePlayer tape={tape} title="1~60 에서 배수를 지우는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>if is_prime[i]</code>
          </b>{" "}
          — i 가 아직 지워지지 않았을 때만 안쪽 반복으로 들어간다
        </li>
        <li>
          <b>
            <code>range(i * i, n + 1, i)</code>
          </b>{" "}
          — i × i 부터 i 칸씩 지운다. i × 2 부터 i × (i − 1) 까지는 더 작은 수가 이미 지웠다
        </li>
        <li>
          <b>
            <code>int(n ** 0.5)</code>
          </b>{" "}
          — i 는 {Math.floor(Math.sqrt(N))} 까지만 돈다. 8 이상의 합성수는 이미 지워져 있다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={`같은 방법으로 1~${QUIZ_N} 을 거르면, 눌러서 배수가 지워지는 가장 큰 수는 얼마일까요?`}
        options={[
          { label: "5 — 5 의 배수까지만 지우면 끝이다" },
          { label: `${QUIZ_PRESS} — ${QUIZ_PRESS} × ${QUIZ_PRESS} = ${QUIZ_PRESS! * QUIZ_PRESS!} 은 ${QUIZ_N} 이하라서 지워진다`, correct: true },
          { label: `${Math.floor(Math.sqrt(QUIZ_N))} — √${QUIZ_N} = ${Math.floor(Math.sqrt(QUIZ_N))} 이니까` },
        ]}
        why={
          <>
            11 × 11 = 121 이 {QUIZ_N}을 넘어서 11 부터는 눌러도 지울 수가 없습니다. 8, 9, 10 은 이미 2·3·5 의 배수로 지워졌습니다.
            코드의 바깥 반복은 {Math.floor(Math.sqrt(QUIZ_N))} 까지 돌지만 안쪽 반복은 2, 3, 5, 7 에서만 돕니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>체에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>is_prime[0] = is_prime[1] = False</code> 를 빼면
          </b>{" "}
          — 에러가 안 난다. 소수 목록이 {PRIMES.length}개가 아니라 {bad.length}개이고 <code>[0, 1, 2, …]</code> 로 시작한다
        </li>
        <li>
          <b>
            <code>i * i</code> 대신 <code>i * 2</code> 부터 지우면
          </b>{" "}
          — 결과는 같다. 지우는 횟수만 늘어서 100만 기준 {innerWrites(1_000_000, "square").toLocaleString("ko-KR")}번 대{" "}
          {innerWrites(1_000_000, "double").toLocaleString("ko-KR")}번이다. 시간은 0.035초와 0.036초로 거의 같았다
        </li>
        <li>
          <b>바깥 반복을 n 까지 돌리면</b> — 소수가 아닌 수도 하나씩 훑는다. 100만에서 {outerChecks(1_000_000, "sqrt").toLocaleString("ko-KR")}번이 아니라{" "}
          {outerChecks(1_000_000, "n").toLocaleString("ko-KR")}번 돈다. 0.035초가 0.049초가 됐다
        </li>
        <li>
          <b>수 하나만 소수인지 알고 싶으면</b> — 체를 만들 필요가 없다. √n 까지 <code>n % d</code> 로 나눠 보면 된다.
          1,000,000,007 은 0.0013초 만에 소수라고 나왔다
        </li>
        <li>
          <b>칸이 많으면 메모리가 문제다</b> — 리스트는 한 칸이 8바이트라 100만 칸이 8,000,056바이트(<code>sys.getsizeof</code>
          )다. 1억 칸이면 약 800MB다. <code>bytearray</code> 는 한 칸 1바이트라 약 100MB다
        </li>
        <li>
          <b>슬라이스로 한 번에 지우면</b> — <code>is_prime[i*i::i] = [False] * len(range(i*i, n+1, i))</code>. 1000만에서 0.55초가
          0.22초로 줄었다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>N 이하 소수를 전부 구한다</b>
        <b>소수 판별을 여러 번 한다</b>
        <b>약수가 없는 수를 거른다</b>
      </div>
      <p className="algo-next">이 탭의 알고리즘 목록은 여기까지입니다. 왼쪽 사이드바에서 다른 장을 골라 다시 풀어 보세요.</p>
    </main>
  );
}
