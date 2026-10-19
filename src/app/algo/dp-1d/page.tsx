import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { Dp1Reveal } from "@/components/algo/Dp1Reveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { timeLabel } from "@/lib/algo/big-o";
import { josa } from "@/lib/algo/josa";
import { climbTape, climbTable, climbWith, waysWithSteps, waysCount50, STAIRS } from "@/lib/algo/dp-1d";

const TABLE = climbTable(STAIRS);

export const metadata: Metadata = {
  title: "1차원 DP",
  description: "계단을 오르는 경우의 수",
};

export default async function Dp1dPage() {
  const tape = await highlightTape(climbTape(STAIRS));

  // 예측 한 번 — 5번 칸을 채우러 가는 순간 어떤 두 칸을 읽을지
  const toFive = tape.steps.findIndex((s) => s.line === 4 && s.vars.i === 5);
  const pause: PlayerPause = {
    at: toFive,
    ask: (
      <>
        5번 칸을 채울 차례입니다. <code>dp[5]</code> 는 어떤 두 칸의 합일까요?
      </>
    ),
    options: [
      { label: "dp[3] + dp[2]" },
      { label: "dp[4] + dp[2]" },
      { label: "dp[4] + dp[3]", correct: true },
    ],
    why: (
      <>
        <code>dp[i - 1] + dp[i - 2]</code> 에 i = 5 를 넣으면 <code>dp[4] + dp[3]</code> 입니다. 표에는 {josa(TABLE[4], "과", "와")} {josa(TABLE[3], "이", "가")}
        적혀 있어서 합은 {TABLE[5]} 입니다.
      </>
    ),
  };

  const three = waysWithSteps(3, [1, 2, 3]);
  const twoOnly = waysWithSteps(3, [1, 2]);
  const zeroStart = waysWithSteps(3, [1, 2, 3], 0);

  return (
    <main className="algo-page">
      <p className="algo-crumb">DP</p>
      <h1 className="algo-title">1차원 DP</h1>
      <p className="algo-lede">계단을 오르는 경우의 수</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <Dp1Reveal>
        <p className="algo-chain">
          1 → 1 → 2 → 3 → 5 → 8 → 13
          <span>표를 채운 순서입니다. 2번 칸부터는 앞 두 칸을 더한 값입니다.</span>
        </p>
        <Counter
          rows={[
            { label: "계단 50칸 · 길을 하나씩 세기", n: waysCount50, unit: "번" },
            { label: "계단 50칸 · 표 채우기", n: 49, unit: "칸" },
          ]}
          caption={`오르는 방법이 ${waysCount50.toLocaleString("ko-KR")}가지라 하나씩 세면 컴퓨터로 ${timeLabel(Math.log10(waysCount50))}입니다. 표는 1초 안에 끝납니다.`}
        />
        <p>
          작은 문제의 답을 표에 채우며 큰 문제의 답까지 올라가는 방법 = <strong>1차원 DP</strong> (동적 계획법, dynamic programming)
        </p>
        <ul className="algo-keys">
          <li>
            <b>칸의 값</b> — 앞 두 칸의 합. 이 관계를 점화식(recurrence)이라고 부른다
          </li>
          <li>
            <b>1 1 2 3 5 8 13</b> — 앞 장 메모이제이션의 피보나치 수열과 같은 수열이다
          </li>
        </ul>
      </Dp1Reveal>

      {/* ③ 조건 짚기 */}
      <h2>앞 칸의 답이 있으면 지금 칸이 정해진다</h2>
      <ul className="algo-keys">
        <li>
          <b>지금 칸의 답</b> — 마지막 걸음이 한 칸이면 한 칸 아래, 두 칸이면 두 칸 아래에서 온다. 그 두 칸의 답을 더하면 된다
        </li>
        <li>
          <b>앞에서부터 채우면</b> — 필요한 값이 늘 준비돼 있다. ①에서 앞 칸부터만 눌렸던 이유다
        </li>
        <li>
          <b>한 번 구한 칸은</b> — 표에 적어 두고 다시 계산하지 않는다. 앞 장의 수첩을 위가 아니라 아래부터 채운 것이다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 표를 앞에서부터 채우는 반복문이다</h2>
      <p>
        계단은 ①과 같은 {STAIRS}칸입니다. <strong>다음</strong>을 눌러 한 줄씩 넘기며 칸이 하나씩 채워지는 걸 보세요.
      </p>

      <TrackPlayer tape={tape} values={TABLE} title="계단 표를 앞에서부터 채우는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>dp = [0] * (n + 1)</code>
          </b>{" "}
          — 0번부터 n번까지 n + 1칸. 아직 안 채운 칸은 0 이다
        </li>
        <li>
          <b>
            <code>dp[0] = dp[1] = 1</code>
          </b>{" "}
          — 시작 자리와 1번 계단은 1가지씩이다
        </li>
        <li>
          <b>
            <code>dp[i - 1] + dp[i - 2]</code>
          </b>{" "}
          — 한 칸 아래와 두 칸 아래의 합이 i번 칸이다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            한 번에 1칸, 2칸, 3칸을 오를 수 있다면 3번째 계단까지는 몇 가지일까요? 0번과 1번 칸은 그대로 1가지씩입니다.
          </>
        }
        options={[
          { label: `${twoOnly}가지 — 앞 두 칸만 더한다` },
          { label: `${zeroStart}가지 — 시작 자리를 0가지로 둔다` },
          { label: `${three}가지 — 앞 세 칸을 더한다`, correct: true },
        ]}
        why={
          <>
            마지막 걸음이 1칸, 2칸, 3칸 중 하나라서 <code>dp[3] = dp[2] + dp[1] + dp[0]</code> 입니다. 2 + 1 + 1 = <strong>{three}가지</strong>입니다.
            앞 두 칸만 더하면 {twoOnly}가지입니다. 시작 자리에서 3칸 걸음으로 곧장 올라오는 방법이 빠집니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>초깃값과 0칸에서 틀린다</h2>
      <ul className="algo-keys">
        <li>
          <b>초깃값을 0 으로 두면</b> — 둘 다 0 이면 표가 전부 0 이다. <code>dp[0]</code> 만 0 이면 {STAIRS}번 계단이 {TABLE[STAIRS]}가지가 아니라{" "}
          {climbWith(STAIRS, 0, 1)}가지로 나온다. 오류도 안 난다
        </li>
        <li>
          <b>
            <code>n = 0</code> 이면
          </b>{" "}
          — <code>dp[1] = 1</code> 줄에서 <code>IndexError: list assignment index out of range</code>. n = 1 은 괜찮고 1 이 나온다
        </li>
        <li>
          <b>재귀에 메모만 붙이면</b> — <code>functools.lru_cache</code> 로도 n = 5000 에서 <code>RecursionError</code> 가 난다. 기본 한도가 1000 이다. 앞에서부터 채우는 표는 5000 칸도
          괜찮다
        </li>
        <li>
          <b>답이 아주 커지면</b> — n = 1000 이면 209자리다. 문제는 보통 <code>% 1_000_000_007</code> 로 나눈 나머지를 묻는다. 칸마다{" "}
          <code>dp[i] = (dp[i - 1] + dp[i - 2]) % 1_000_000_007</code> 로 적는다. 직접 재 보니 백만 칸을 0.05초에 채웠다(Python 3.14, 컴퓨터마다 다르다)
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>경우의 수를 센다</b>
        <b>앞 결과로 지금을 구한다</b>
        <b>n 이 크다 (1000 이상)</b>
      </div>
      <p className="algo-next">다음 장에서는 가방에 무엇을 담을지 고르는 0/1 배낭을 봅니다.</p>
    </main>
  );
}
