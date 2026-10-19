import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import { LockReveal } from "@/components/algo/LockReveal";
import { LockGrowth } from "@/components/algo/LockGrowth";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { packTape, subsetCount } from "@/lib/algo/brute-force";

const WEIGHTS = [2, 3, 4];
const VALUES = [3, 4, 5];
const LIMIT = 5;

export const metadata: Metadata = {
  title: "완전탐색",
  description: "일단 다 해 보면 안 되나",
};

export default async function BruteForcePage() {
  const tape = await highlightTape(packTape(WEIGHTS, VALUES, LIMIT));

  return (
    <main className="algo-page">
      <p className="algo-crumb">기초 개념</p>
      <h1 className="algo-title">완전탐색</h1>
      <p className="algo-lede">일단 다 해 보면 안 되나</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <LockReveal>
        <p className="algo-chain">
          000 → 001 → 002 → … → 999
          <span>순서를 정해 두면 하나도 빠뜨리지 않고 끝까지 갑니다.</span>
        </p>
        <ul className="algo-keys">
          <li>
            <b>한 일</b> — 될 수 있는 번호를 하나도 빠뜨리지 않고 전부 해 봤다
          </li>
          <li>
            <b>자릿수가 하나 늘면</b> — 경우가 열 배가 된다
          </li>
        </ul>
        <p>
          가능한 경우를 빠짐없이 다 해 보는 방법 = <strong>완전탐색</strong>
        </p>
        <LockGrowth />
      </LockReveal>

      {/* ③ 조건 짚기 */}
      <h2>경우가 적을 때만 쓸 수 있다</h2>
      <p>물건을 담을지 말지 고른다면, 물건이 하나 늘 때마다 경우가 두 배가 됩니다.</p>
      <Counter
        rows={[
          { label: "물건 30개", n: subsetCount(30), unit: "가지" },
          { label: "물건 20개", n: subsetCount(20), unit: "가지" },
          { label: "물건 10개", n: subsetCount(10), unit: "가지" },
        ]}
        caption="컴퓨터는 1초에 1억 번쯤 합니다(시간복잡도). 30개는 11초가 걸립니다."
      />
      <ul className="algo-keys">
        <li>
          <b>N 이 20 이하</b> — 2^N 도 1초 안에 끝난다
        </li>
        <li>
          <b>N 이 25 안팎을 넘으면</b> — 2^N 은 1초를 넘는다. 다른 방법을 찾아야 한다
        </li>
        <li>
          <b>그래서</b> — 문제에서 N 이 작다고 알려 주면 완전탐색을 먼저 의심한다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 모든 경우를 숫자 하나로 센다</h2>
      <p>
        물건 3개의 무게는 {WEIGHTS.join(", ")}, 값은 {VALUES.join(", ")}. 가방 한도는 {LIMIT} 입니다. <strong>다음</strong>을 눌러 담을지 말지 8가지를 하나씩 보세요.
      </p>

      <TrackPlayer tape={tape} values={WEIGHTS} title="물건을 담을지 말지 모든 경우를 해 보는 모습" />

      <ul className="algo-keys">
        <li>
          <b>
            <code>range(2 ** n)</code>
          </b>{" "}
          — 경우의 수만큼 반복한다. 물건이 3개라 0 부터 7
        </li>
        <li>
          <b>
            <code>mask</code>
          </b>{" "}
          — 이진수로 쓰면 자리 하나가 물건 하나. 3 은 011 이라 0번·1번 물건을 담는다
        </li>
        <li>
          <b>
            <code>best</code>
          </b>{" "}
          — 한도 안의 경우 중 지금까지 가장 좋은 값
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="물건이 4개면, 담을지 말지 경우는 몇 가지일까요?"
        options={[
          { label: "8가지 — 물건 3개일 때의 수" },
          { label: "16가지", correct: true },
          { label: "32가지 — 물건 5개일 때의 수" },
        ]}
        why={
          <>
            물건마다 담음과 안 담음, 두 가지씩이 곱해집니다. 2 × 2 × 2 × 2 = <strong>16</strong>. 3개면 8, 5개면 32입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>빠뜨리거나 두 번 세면 틀린다</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>range(2 ** n - 1)</code>
          </b>{" "}
          — 마지막 경우, 전부 담기를 빠뜨린다
        </li>
        <li>
          <b>순서만 바꾼 같은 묶음</b> — 물건 0번·1번과 1번·0번은 같은 경우다. 두 번 세지 않는다
        </li>
        <li>
          <b>
            <code>itertools</code>
          </b>{" "}
          — <code>product</code> 는 자리마다 고르기, <code>combinations</code> 는 k개 고르기, <code>permutations</code> 는 순서까지 센다
        </li>
      </ul>
      <p>N 이 25 안팎을 넘으면 이 방법은 끝나지 않습니다. 줄일 방법은 뒤쪽 장에서 봅니다.</p>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>N 이 작다</b>
        <b>모든 경우</b>
        <b>조건을 만족하는 것 중 최선</b>
      </div>
      <p className="algo-next">
        다음 장에서는 양쪽 끝에서 좁혀 오는 투 포인터를 봅니다.
      </p>
    </main>
  );
}
