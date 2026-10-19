import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import { BudgetReveal } from "@/components/algo/BudgetReveal";
import { GrowthTable } from "@/components/algo/GrowthTable";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { pairsTape, pairCount, ops } from "@/lib/algo/big-o";

const VALUES = [4, 7, 1, 9, 3, 6];
const BIG = 100_000;

export const metadata: Metadata = {
  title: "시간복잡도",
  description: "1억 번이면 1초, 그래서 어쩌라고",
};

export default async function BigOPage() {
  const tape = await highlightTape(pairsTape(VALUES));

  return (
    <main className="algo-page">
      <p className="algo-crumb">기초 개념</p>
      <h1 className="algo-title">시간복잡도</h1>
      <p className="algo-lede">1억 번이면 1초, 그래서 어쩌라고</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <BudgetReveal>
        <Counter
          rows={[
            { label: "모두와 모두를 견주기", n: Math.round(pairCount(BIG)), unit: "번" },
            { label: "생일순으로 줄 세우기", n: ops("nlogn", BIG), unit: "번" },
            { label: "한 명씩 보며 적어 두기", n: ops("linear", BIG), unit: "번" },
          ]}
          caption="같은 10만 명, 같은 질문. 일하는 횟수가 이만큼 다릅니다."
        />
        <ul className="algo-keys">
          <li>
            <b>시간을 정하는 것</b> — 컴퓨터 속도가 아니라 <strong>일하는 횟수</strong>
          </li>
          <li>
            <b>횟수를 정하는 것</b> — 사람 수 N 과 방법
          </li>
        </ul>
        <p>
          N 이 늘 때 횟수가 어떻게 늘어나는지를 적은 것 = <strong>시간복잡도</strong>. 위 세 방법은 각각 N², N log N, N 입니다.
          이 표기를 <strong>Big-O</strong>라고도 부릅니다.
        </p>
      </BudgetReveal>

      {/* ③ 조건 짚기 */}
      <h2>N 이 얼마인지가 방법을 정한다</h2>
      <p>N 을 바꿔 눌러 보세요. 어느 줄이 1초를 넘는지 보입니다.</p>
      <GrowthTable />
      <ul className="algo-keys">
        <li>
          <b>N 이 100만 이하</b> — N log N 까지 버틴다
        </li>
        <li>
          <b>N 이 1만 이하</b> — N² 까지 버틴다
        </li>
        <li>
          <b>N 이 25 이하</b> — 2^N 도 된다. 모든 경우를 다 해 본다는 뜻이다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>횟수는 반복문이 센다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 <code>count</code> 가 오르는 걸 보세요.
      </p>

      <TrackPlayer tape={tape} values={VALUES} title="모든 쌍을 견주는 모습" />

      <ul className="algo-keys">
        <li>
          <b>
            <code>count += 1</code>
          </b>{" "}
          — 한 쌍을 견줄 때마다 1 오른다
        </li>
        <li>
          <b>
            <code>range(i + 1, n)</code>
          </b>{" "}
          — 앞에서 본 쌍은 다시 안 본다
        </li>
        <li>
          <b>끝나면</b> — {VALUES.length}칸에서 {pairCount(VALUES.length)}번. N(N−1)/2 이라 N² 으로 친다
        </li>
      </ul>
      <Counter
        rows={[
          { label: "6칸", n: pairCount(6), unit: "번" },
          { label: "12칸", n: pairCount(12), unit: "번" },
          { label: "24칸", n: pairCount(24), unit: "번" },
        ]}
        caption="칸이 두 배가 될 때마다 횟수는 약 네 배가 됩니다."
      />

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="N 이 10배가 되면, 모든 쌍을 견주는 방법은 몇 배 오래 걸릴까요?"
        options={[
          { label: "10배 — 일이 10배니까" },
          { label: "100배", correct: true },
          { label: "2배 — 칸이 하나씩 늘 뿐이니까" },
        ]}
        why={
          <>
            쌍의 수는 <strong>N × N</strong> 에 가깝게 늡니다. 10배로 느는 건 한 번씩 훑는 방법입니다.
            그 방법은 N 이 10배일 때 횟수도 딱 10배입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>한 줄이어도 한 번이 아니다</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>x in arr</code>
          </b>{" "}
          — 리스트에서는 앞에서부터 N 번 훑는다. 반복문 안에 두면 N²
        </li>
        <li>
          <b>
            <code>arr.pop(0)</code>
          </b>{" "}
          — 나머지 칸을 전부 한 칸씩 당긴다. N 번
        </li>
        <li>
          <b>
            <code>sorted(arr)</code>
          </b>{" "}
          — 한 줄이지만 N log N 이다
        </li>
      </ul>
      <p>같은 값을 일찍 찾으면 빨리 끝납니다. 그래도 제한 시간은 <strong>가장 운이 나쁜 입력</strong>으로 어림합니다.</p>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>N 이 얼마까지</b>
        <b>제한 시간 1~2초</b>
        <b>반복문 안의 반복문</b>
      </div>
      <p className="algo-next">
        다음 장에서는 자기 안에서 자기를 다시 부르는 재귀를 봅니다.
      </p>
    </main>
  );
}
