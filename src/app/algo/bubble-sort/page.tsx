import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import { SortReveal } from "@/components/algo/SortReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { bubbleSortTape, countOps, countOpsNoShrink, sortLabels, HAND_VALUES } from "@/lib/algo/bubble-sort";

const VALUES = HAND_VALUES;
const BIG = 1000;

export const metadata: Metadata = {
  title: "버블 정렬",
  description: "옆 사람과 키 순서로 서 보기",
};

export default async function BubbleSortPage() {
  const tape = await highlightTape(bubbleSortTape(VALUES));
  const ops = countOps(VALUES);
  const wide = countOpsNoShrink(VALUES);
  const pairs: [number, string][] = [
    [2, "a"],
    [2, "b"],
    [1, "c"],
  ];

  return (
    <main className="algo-page">
      <p className="algo-crumb">정렬</p>
      <h1 className="algo-title">버블 정렬</h1>
      <p className="algo-lede">옆 사람과 키 순서로 서 보기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>여섯 칸을 작은 수부터 늘어놓아 보세요. 두 칸을 누르면 자리가 바뀌는데, 옆 칸끼리만 됩니다.</p>

      <SortReveal minSwaps={ops.swaps} compares={ops.compares}>
        <p>
          컴퓨터도 방금 여러분처럼 <strong>옆칸 둘씩만</strong> 견줍니다. 앞이 크면 바꾸고, 앞에서 뒤로 훑기를
          되풀이합니다.
        </p>
        <p>
          한 바퀴 돌면 가장 큰 수가 맨 뒤로 밀려납니다. 큰 수가 거품처럼 떠오른다고 해서 이름이 거품(버블)입니다.
        </p>
        <p>
          옆칸 비교만으로 정렬하는 방법 = <strong>버블 정렬</strong>
        </p>
      </SortReveal>

      {/* ③ 조건 짚기 */}
      <h2>한 바퀴에 큰 수 하나가 자리를 잡는다</h2>
      <ul className="algo-keys">
        <li>
          <b>한 바퀴</b> — 앞에서 뒤로 훑으며 옆칸끼리만 견준다
        </li>
        <li>
          <b>바퀴가 끝나면</b> — 가장 큰 수가 맨 뒤에 확정된다. 다음 바퀴는 한 칸 덜 본다
        </li>
        <li>
          <b>그래서</b> — 칸이 n개면 바퀴도 n−1번. 비교는 n²에 가깝다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 — 먼저 예측 */}
      <h2>코드는 바퀴 두 번 도는 것이 전부다</h2>
      <Quiz
        question="5 2 9 1 7 4 를 앞에서 뒤로 한 번만 훑고 나면, 맨 끝 칸에는 무엇이 있을까요?"
        options={[
          { label: "5 — 맨 앞에 있던 수" },
          { label: "9 — 가장 큰 수", correct: true },
          { label: "4 — 원래 맨 끝에 있던 수" },
        ]}
        why={
          <>
            9 는 훑는 동안 만나는 수마다 앞이 더 커서 바뀝니다. 1, 7, 4 와 차례로 바뀌며 끝까지 밀려갑니다. 아래
            플레이어에서 확인해 보세요.
          </>
        }
      />
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 확정된 칸이 뒤에서부터 쌓이는 걸 보세요.
      </p>

      <TrackPlayer tape={tape} values={VALUES} title="버블 정렬이 한 칸씩 도는 모습" />

      <ul className="algo-keys">
        <li>
          <b>
            <code>i</code>
          </b>{" "}
          — 몇 번째 바퀴인가
        </li>
        <li>
          <b>
            <code>j</code>
          </b>{" "}
          — 그 바퀴에서 지금 보는 자리
        </li>
        <li>
          <b>
            <code>n - 1 - i</code>
          </b>{" "}
          — 뒤쪽 확정된 칸은 다시 안 본다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="이미 작은 수부터 정렬된 배열을 넣으면 비교는 몇 번일까요?"
        options={[
          { label: "정렬이 안 된 때와 똑같다", correct: true },
          { label: "5번 — 한 바퀴만 훑는다" },
          { label: "0번 — 바꿀 게 없으니 건너뛴다" },
        ]}
        why={
          <>
            바꾸기는 한 번도 안 일어나지만 <strong>비교는 그대로 다 합니다.</strong>{" "}
            코드에 &ldquo;이미 정렬됐다&rdquo;를 확인하는 줄이 없어서입니다. 한 바퀴에 한 번도 안 바뀌면 멈추는 줄을 넣으면 그때부터
            달라집니다. 그러면 여섯 칸은 5번으로 끝납니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>버블 정렬에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>- i</code> 를 빼면
          </b>{" "}
          — 답은 맞는데 비교가 {ops.compares}번에서 {wide.compares}번으로 는다. 끝자리에 확정된 칸을 또 보기 때문이다
        </li>
        <li>
          <b>
            <code>range(n - 1 - i)</code> 대신 <code>range(n)</code>
          </b>{" "}
          — 마지막 칸에서 <code>arr[j + 1]</code> 이 없어 IndexError 가 난다
        </li>
        <li>
          <b>
            <code>&gt;</code> 대신 <code>&gt;=</code>
          </b>{" "}
          — 같은 값끼리도 자리를 바꾼다. 2a 2b 1c 를 정렬하면 <code>&gt;</code> 는 {sortLabels(pairs, ">").join(" ")},
          <code>&gt;=</code> 는 {sortLabels(pairs, ">=").join(" ")} 다
        </li>
      </ul>
      <p>
        같은 값의 원래 순서가 그대로 남는 정렬 = <strong>안정 정렬</strong>. <code>&gt;</code> 로 쓴 버블 정렬은
        안정 정렬입니다.
      </p>

      {/* ⑦ 신호 */}
      <h2>쓸 일은 적지만 이럴 때 나온다</h2>
      <Counter
        rows={[
          { label: `버블 정렬 · ${BIG}개`, n: (BIG * (BIG - 1)) / 2, unit: "번" },
          { label: `Python sorted · ${BIG}개`, n: Math.round(BIG * Math.log2(BIG)), unit: "번" },
        ]}
        caption="같은 1000개를 정렬할 때의 비교 횟수. 10000개면 차이가 또 열 배로 벌어집니다."
      />
      <p>
        여섯 칸짜리 예시에서는 비교 {ops.compares}번, 교환 {ops.swaps}번이었습니다. 칸이 늘어나면 이 수가 제곱으로
        커집니다.
      </p>
      <div className="algo-signals">
        <b>교환 횟수를 세라는 문제</b>
        <b>n 이 작고 구현이 단순해야 할 때</b>
        <b>같은 값의 순서를 지켜야 할 때</b>
      </div>
      <p>실전에서 정렬이 필요하면 <code>sorted()</code> 한 줄이면 됩니다.</p>
      <p className="algo-next">
        다음 장에서는 한 바퀴에 가장 작은 수를 골라 앞으로 보내는 선택 정렬을 봅니다.
      </p>
    </main>
  );
}
