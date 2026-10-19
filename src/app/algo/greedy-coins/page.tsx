import type { Metadata } from "next";
import Link from "next/link";
import { highlightTape } from "@/lib/algo/highlight";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { CoinPlayer } from "@/components/algo/CoinPlayer";
import { CoinReveal } from "@/components/algo/CoinReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import {
  COIN_SET_A,
  COIN_SET_B,
  bestCoins,
  coinSum,
  coinTape,
  greedyCoins,
} from "@/lib/algo/greedy-coins";

export const metadata: Metadata = {
  title: "거스름돈",
  description: "큰 동전부터 주면 되나",
};

export default async function GreedyCoinsPage() {
  const [tapeA, tapeB] = await Promise.all([
    highlightTape(coinTape(COIN_SET_A.coins, COIN_SET_A.amount)),
    highlightTape(coinTape(COIN_SET_B.coins, COIN_SET_B.amount)),
  ]);

  const gA = greedyCoins(COIN_SET_A.coins, COIN_SET_A.amount).given;
  const bA = bestCoins(COIN_SET_A.coins, COIN_SET_A.amount) ?? [];
  const gB = greedyCoins(COIN_SET_B.coins, COIN_SET_B.amount).given;
  const bB = bestCoins(COIN_SET_B.coins, COIN_SET_B.amount) ?? [];
  const unsortedB = greedyCoins(COIN_SET_B.coins, COIN_SET_B.amount, false).given;

  // ⑤ 확인 문제 — 1·5·12원으로 15원
  const quiz = greedyCoins([1, 5, 12], 15).given;
  const quizBest = bestCoins([1, 5, 12], 15) ?? [];

  // 예측 한 번 — 세트 B 에서 4원을 주고 남은 2원에, 다음에 줄 동전은 무엇일까
  const afterFour = tapeB.steps.findIndex((s) => s.line === 5 && s.vars.coin === 4 && s.vars.amount === 2);
  const pauseB: PlayerPause = {
    at: afterFour,
    ask: <>4원을 주고 남은 돈이 2원입니다. 다음에 줄 동전은 무엇일까요?</>,
    options: [
      { label: "1원 — 4원도 3원도 남은 2원보다 크다", correct: true },
      { label: "4원 — 큰 동전이니까 한 번 더" },
      { label: "3원 — 그다음으로 큰 동전" },
    ],
    why: (
      <>
        남은 돈보다 큰 동전은 줄 수 없습니다. 4원과 3원을 건너뛰고 <code>while amount &gt;= coin</code> 이 처음 참이 되는
        1원으로 넘어갑니다. 그래서 4 + 1 + 1 이 됩니다.
      </>
    ),
  };

  return (
    <main className="algo-page">
      <p className="algo-crumb">그리디</p>
      <h1 className="algo-title">거스름돈</h1>
      <p className="algo-lede">큰 동전부터 주면 되나</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>동전으로 거스름돈을 만들어 보세요. 줄 수 있는 동전 중 가장 큰 동전부터 한 개씩 줍니다.</p>

      <CoinReveal>
        <p className="algo-chain">
          {coinSum(gB)}
          <span>세트 B 를 큰 동전부터 주면 이렇게 됩니다 ({gB.length}개).</span>
        </p>
        <p className="algo-chain">
          {coinSum(bB)}
          <span>하지만 이렇게 주면 {bB.length}개입니다.</span>
        </p>
        <Counter
          rows={[
            { label: "세트 B · 큰 동전부터", n: gB.length, unit: "개" },
            { label: "세트 B · 가장 적게", n: bB.length, unit: "개" },
          ]}
          caption={`같은 6원입니다. 세트 A 는 큰 동전부터 줘도 ${gA.length}개로 가장 적었습니다.`}
        />
        <p>
          지금 가장 좋아 보이는 것(가장 큰 동전)을 고르고 되돌리지 않는 방법 = <strong>그리디</strong>(greedy)
        </p>
        <p>
          세트 A 에서는 맞았고 세트 B 에서는 틀렸습니다. 그리디는 늘 맞는 방법이 아닙니다. 모든 경우를 따져 맞게 만드는
          방법은 작은 경우부터 표를 채우는 DP 입니다. 앞 장의 <Link href="/algo/knapsack">0/1 배낭</Link> 이 그 예입니다.
        </p>
      </CoinReveal>

      {/* ③ 조건 짚기 */}
      <h2>큰 동전이 작은 동전의 배수일 때는 맞다</h2>
      <ul className="algo-keys">
        <li>
          <b>세트 A</b> — 500 = 5 × 100, 100 = 2 × 50, 50 = 5 × 10. 큰 동전 하나는 작은 동전 여러 개와 같아서 큰 동전을 줘도 손해가
          없다
        </li>
        <li>
          <b>세트 B</b> — 4 는 3 의 배수가 아니다. 4원을 먼저 주는 바람에 3 + 3 이 될 자리를 놓쳤다
        </li>
        <li>
          <b>그래서</b> — 동전이 서로 배수면 큰 것부터 줘도 된다. 배수가 아니면 틀릴 수 있다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 큰 동전부터 빼 나가는 것이 전부다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 남은 돈이 줄고 바구니가 차는 걸 보세요. 처음 화면은 ①에서 마지막으로 한
        세트 B 입니다.
      </p>

      <CoinPlayer
        tapes={{ A: tapeA, B: tapeB }}
        labels={{ A: "세트 A · 500·100·50·10원으로 1260원", B: "세트 B · 1·3·4원으로 6원" }}
        pauses={{ B: pauseB }}
        compare={{
          A: (
            <>
              같은 입력을 모든 경우로 따져도 <b>{bA.length}개</b>입니다. 큰 동전부터 준 <b>{gA.length}개</b>와 같습니다.
            </>
          ),
          B: (
            <>
              같은 입력을 모든 경우로 따지면 <b>{bB.length}개</b>({coinSum(bB)})입니다. 큰 동전부터 준 <b>{gB.length}개</b>(
              {coinSum(gB)})보다 적습니다.
            </>
          ),
        }}
      />

      <ul className="algo-keys">
        <li>
          <b>
            <code>sorted(coins, reverse=True)</code>
          </b>{" "}
          — 동전을 큰 것부터 늘어놓는다
        </li>
        <li>
          <b>
            <code>while amount &gt;= coin</code>
          </b>{" "}
          — 남은 돈에 이 동전을 낼 수 있는 동안 계속 낸다
        </li>
        <li>
          <b>
            <code>amount -= coin</code>
          </b>{" "}
          — 낼 때마다 남은 돈이 줄어든다. 한 번 낸 동전은 물리지 않는다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            동전이 1원·5원·12원일 때, 15원을 큰 동전부터 주면 몇 개일까요?
          </>
        }
        options={[
          { label: "15개 — 작은 동전부터 줬을 때" },
          { label: `${quizBest.length}개 — ${coinSum(quizBest)}` },
          { label: `${quiz.length}개 — ${coinSum(quiz)}`, correct: true },
        ]}
        why={
          <>
            12원을 먼저 주면 남은 돈이 3원이라 1원을 세 번 줍니다. 그래서 <strong>{quiz.length}개</strong>입니다. 5원을 세 번 주면{" "}
            {quizBest.length}개로 더 적습니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>그리디에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>정렬을 빼면</b> — <code>[1, 3, 4]</code> 순서 그대로 6원을 주면 1원부터 줘서 {unsortedB.length}개가 된다. 큰
          동전부터 줄 때는 {gB.length}개다
        </li>
        <li>
          <b>배수가 아닌 세트에서는</b> — <code>[1, 3, 4]</code> 6원은 큰 동전부터 {gB.length}개, 가장 적게는 {bB.length}개다
        </li>
        <li>
          <b>거슬러 줄 수 없는 돈은</b> — <code>[5, 10]</code> 으로 12원을 주면 에러 없이 <code>[10]</code> 이 나오고 남은 2원은
          말없이 사라진다. 남은 돈이 0 인지 따로 확인해야 한다
        </li>
        <li>
          <b>
            <code>while</code> 대신 <code>//</code> 와 <code>%</code>
          </b>{" "}
          — 세트 A 로 10억 원이면 <code>while</code> 이 200만 번 돌아 0.04초 걸린다. 몫을 <code>amount // coin</code> 으로 한 번에 구하면 4번
          계산해 0.000003초다(Python 3.14, 컴퓨터마다 다르다)
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>최소 개수</b>
        <b>큰 것부터 고르면 된다(배수 관계)</b>
        <b>증명할 수 있으면 그리디, 아니면 DP</b>
      </div>
      <p className="algo-next">다음 장에서는 끝나는 시간이 빠른 회의부터 고르는 회의실 배정을 봅니다.</p>
    </main>
  );
}
