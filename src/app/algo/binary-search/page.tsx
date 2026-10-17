import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import { GameReveal } from "@/components/algo/GameReveal";
import { Quiz } from "@/components/algo/Quiz";
import { binarySearchTape } from "@/lib/algo/binary-search";

const VALUES = [7, 12, 19, 23, 31, 42, 55, 68, 71, 90];
const TARGET = 42;

export const metadata: Metadata = {
  title: "이분 탐색",
  description: "업-다운 게임 잘하는 법",
};

export default function BinarySearchPage() {
  const tape = binarySearchTape(VALUES, TARGET);

  return (
    <>
      <PublicNav active="" />
      <main className="algo-page">
        <p className="algo-crumb">탐색</p>
        <h1 className="algo-title">이분 탐색</h1>
        <p className="algo-lede">업-다운 게임 잘하는 법</p>

        {/* ① 직접 해 보기 → ② 되짚기 */}
        <p>
          제가 <strong>1~100</strong> 중 하나를 정했습니다. 몇 번 만에 맞히는지 해 보세요.
        </p>

        <GameReveal>
          <p>
            <strong>가운데를 부르면 절반이 날아갑니다.</strong> 어느 쪽 답이 오든 똑같습니다.
          </p>
          <p className="algo-chain">
            100 → 50 → 25 → 13 → 7 → 4 → 2 → <b>1</b>
            <span>일곱 번. 운이 나빠도 일곱 번.</span>
          </p>
          <p>
            매번 절반씩 버리는 방법 = <strong>이분 탐색</strong>
          </p>
        </GameReveal>

        {/* ③ 조건 짚기 */}
        <h2>이분 탐색은 정렬된 줄에서만 쓸 수 있다</h2>
        <ul className="algo-keys">
          <li>
            <b>버릴 수 있던 이유</b> — 왼쪽이 전부 더 작다고 알기 때문
          </li>
          <li>
            <b>섞여 있으면</b> — 가운데가 작아도 왼쪽에 큰 수가 있다. 못 버린다
          </li>
          <li>
            <b>신호</b> — 문제에 &ldquo;오름차순으로 주어진다&rdquo;
          </li>
        </ul>

        {/* ④ 코드와 플레이어 */}
        <h2>코드는 방금 한 게임을 그대로 옮긴 것이다</h2>
        <p>
          배열에서 <strong>{TARGET}</strong> 찾기. ▶로 한 칸씩 넘겨 보세요.
        </p>

        <TrackPlayer tape={tape} values={VALUES} title="이분 탐색이 한 칸씩 도는 모습" />

        <ul className="algo-keys">
          <li>
            <b>
              <code>left</code> <code>right</code>
            </b>{" "}
            — 아까 막대의 양 끝
          </li>
          <li>
            <b>
              <code>mid</code>
            </b>{" "}
            — 여러분이 부른 수
          </li>
        </ul>

        {/* ⑤ 확인 문제 — 오답은 42를 찾을 때 실제로 일어난 일이다 */}
        <Quiz
          question={`${TARGET} 대신 12를 찾는다면, 첫 질문 뒤에 어느 쪽이 버려질까요?`}
          options={[
            { label: "왼쪽 — 31과 그 앞쪽이 버려진다" },
            { label: "오른쪽 — 31과 그 뒤쪽이 버려진다", correct: true },
          ]}
          why={
            <>
              가운데 31이 12보다 큽니다. 12는 31보다 앞에 있습니다. 31과 그 오른쪽이 전부
              날아가고 왼쪽만 남습니다. {TARGET}를 찾을 때는 왼쪽이 날아갔습니다. 방향이
              반대입니다.
            </>
          }
        />

        {/* ⑥ 틀리는 자리 */}
        <h2>이분 탐색은 경계에서 틀린다</h2>
        <ul className="algo-keys">
          <li>
            <b>
              <code>&lt;=</code> 에서 등호를 빼면
            </b>{" "}
            — 한 칸 남았을 때 그 칸을 안 본다. 있어도 &ldquo;없다&rdquo;
          </li>
          <li>
            <b>
              <code>mid + 1</code> 에서 <code>+1</code> 을 빼면
            </b>{" "}
            — 범위가 안 줄어든다. 무한 루프
          </li>
        </ul>
        <p>
          위 플레이어에서 <strong>한 칸 남는 순간</strong>을 다시 돌려 보세요. 전부 거기서
          틀립니다.
        </p>

        {/* ⑦ 꺼내라는 신호 */}
        <h2>이분 탐색을 꺼내라는 세 가지 신호</h2>
        <div className="algo-signals">
          <b>정렬돼 있다</b>
          <b>값 하나를 찾는다</b>
          <b>N이 너무 크다</b>
        </div>
        <p className="algo-next">
          다음 장에서는 찾는 값이 여러 개일 때 그중 첫 번째를 어떻게 찾는지 봅니다.
        </p>
      </main>
      <Footer />
    </>
  );
}
