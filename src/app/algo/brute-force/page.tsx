import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { PackPlayer } from "@/components/algo/PackPlayer";
import { StageTable } from "@/components/algo/StageTable";
import { LockReveal } from "@/components/algo/LockReveal";
import { LockGrowth } from "@/components/algo/LockGrowth";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { packTape, emptyPackTable, subsetCount } from "@/lib/algo/brute-force";
import type { PlayerPause } from "@/components/algo/TapePlayer";

const WEIGHTS = [2, 3, 4];
const VALUES = [3, 4, 5];
const LIMIT = 5;

export const metadata: Metadata = {
  title: "완전탐색",
  description: "일단 다 해 보면 안 되나",
};

export default async function BruteForcePage() {
  const plain = packTape(WEIGHTS, VALUES, LIMIT);
  const tape = await highlightTape(plain);
  const table0 = emptyPackTable(WEIGHTS, VALUES, LIMIT);

  // 무게 합을 구하는 줄로 넘어가기 직전에 한 번 묻는다. mask 3 = 011 을 눈으로 따라가 본 뒤다.
  const pause: PlayerPause = {
    at: plain.steps.findIndex((s) => s.line === 5 && s.vars.mask === 3),
    ask: "먼저 예상해 보세요. mask 3 은 011 입니다. 0번과 1번 물건을 담습니다. 담은 물건의 무게 합은 얼마일까요?",
    options: [
      { label: "5", correct: true },
      { label: "7 — 값을 더한 수" },
      { label: "9 — 세 물건 전부" },
    ],
    why: "무게는 2 + 3 = 5 입니다. 값을 더하면 3 + 4 = 7 이고, 세 물건 전부를 담는 경우는 mask 7 입니다.",
  };

  return (
    <main className="algo-page">
      <p className="algo-crumb">기초 개념</p>
      <h1 className="algo-title">완전탐색</h1>
      <p className="algo-lede">일단 다 해 보면 안 되나</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <LockReveal>
        <p>순서가 들쭉날쭉하면 번호를 빠뜨리거나 같은 번호를 또 해 봅니다. 순서를 정해 두면 이렇게 됩니다.</p>
        <p className="algo-chain">
          000 → 001 → 002 → … → 999
          <span>번호 하나를 열어 보면 1번. 끝까지 가면 최악 1,000번입니다.</span>
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
        <p>
          물건 담기도 같은 모양입니다. 물건 개수를 <strong>N</strong>이라고 두겠습니다. 물건마다 담기와 안 담기, 두 가지라서 경우는 2 × 2 × … = <strong>2^N</strong>가지입니다.
        </p>
      </LockReveal>

      {/* ③ 조건 짚기 */}
      <h2>경우가 적을 때만 쓸 수 있다</h2>
      <p>물건 개수가 N이면 경우는 2^N가지입니다. 물건이 하나 늘 때마다 두 배가 됩니다.</p>
      <Counter
        rows={[
          { label: "물건 30개", n: subsetCount(30), unit: "가지" },
          { label: "물건 20개", n: subsetCount(20), unit: "가지" },
          { label: "물건 10개", n: subsetCount(10), unit: "가지" },
        ]}
        caption="Python 은 1초에 1천만~3천만 번쯤 계산합니다. 경우마다 물건 수만큼 더 보니 20개는 약 2천만 번이라 1초 안팎입니다. 30개는 약 320억 번이라 18~54분이 걸립니다."
      />
      <ul className="algo-keys">
        <li>
          <b>N 이 10 이하</b> — 순서까지 따지는 N! 가지도 된다(10! = 3,628,800)
        </li>
        <li>
          <b>N 이 20 이하</b> — 담을지 말지 2^N 가지가 된다(20 × 2^20 ≈ 2천만 번)
        </li>
        <li>
          <b>N 이 1,000 이하</b> — 둘씩 짝짓는 이중 반복문 N²이 된다(100만 번)
        </li>
        <li>
          <b>N 이 20을 훌쩍 넘으면</b> — 2^N 은 못 쓴다. 다른 방법을 찾아야 한다
        </li>
      </ul>
      <p>문제가 N 이 작다고 알려 주면 완전탐색을 먼저 떠올립니다.</p>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 모든 경우를 숫자 하나로 센다</h2>
      <p>
        물건 3개의 무게는 {WEIGHTS.join(", ")}, 값은 {VALUES.join(", ")}. 가방 한도는 {LIMIT} 입니다. 담을지 말지는 8가지이고, 경우마다 번호(mask)를 붙입니다.
      </p>
      <StageTable table={table0} />
      <ul className="algo-keys">
        <li>
          <b>
            <code>mask</code>
          </b>{" "}
          — 담을 물건을 0 과 1 로 적은 번호. 오른쪽 자리가 0번 물건이다. 3 = 011 이면 0번·1번을 담는다
        </li>
        <li>
          <b>
            <code>range(2 ** n)</code>
          </b>{" "}
          — 경우의 수만큼 반복한다. 물건이 3개라 0 부터 7
        </li>
        <li>
          <b>
            <code>best</code>
          </b>{" "}
          — 한도 안의 경우 중 지금까지 가장 좋은 값
        </li>
      </ul>
      <p>
        <strong>다음</strong>을 눌러 8가지를 위에서부터 훑어 보세요. 중간에 한 번 물어봅니다.
      </p>

      <PackPlayer
        tape={tape}
        weights={WEIGHTS}
        pause={pause}
        title="물건을 담을지 말지 모든 경우를 해 보는 모습"
      />

      {/* ⑤ 확인 문제 — 오답은 같은 코드가 다른 mask 에서 실제로 하는 행동이다 */}
      <Quiz
        question="mask 가 5 이면 어떤 물건을 담을까요?"
        options={[
          { label: "0번·1번 물건 — mask 3 일 때의 답" },
          { label: "1번·2번 물건 — mask 6 일 때의 답" },
          { label: "0번·2번 물건", correct: true },
        ]}
        why={
          <>
            5 를 이진수로 쓰면 <strong>101</strong> 입니다. 오른쪽부터 0번·1번·2번 자리라서 1 이 있는 0번과 2번을 담습니다. 무게는 2 + 4 = 6 이라 한도 5 를 넘으니 버립니다.
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
          <b>조합과 순열</b> — [1, 2, 3] 에서 둘을 고를 때 순서를 안 따지면 3가지(12, 13, 23)이고, 순서까지 따지면 6가지(12, 21, 13, 31, 23, 32)다
        </li>
        <li>
          <b>담을지 말지는 순서가 없다</b> — 0번·1번 물건과 1번·0번 물건은 같은 경우라서 한 번만 센다. 순서까지 세는 것은 순열 쪽이다
        </li>
        <li>
          <b>
            <code>itertools</code>
          </b>{" "}
          — <code>product</code> 는 자리마다 고르기, <code>combinations([1, 2, 3], 2)</code> 는 3개, <code>permutations([1, 2, 3], 2)</code> 는 6개를 만든다
        </li>
      </ul>
      <p>N 이 20을 훌쩍 넘으면 이 방법은 끝나지 않습니다. 줄이는 방법은 뒤쪽 장에서 봅니다.</p>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>N 이 작다(20 이하)</b>
        <b>모든 경우</b>
        <b>조건을 만족하는 것 중 최선</b>
      </div>
      <p className="algo-next">
        다음 장에서는 양쪽 끝에서 좁혀 오는 투 포인터를 봅니다.
      </p>
    </main>
  );
}
