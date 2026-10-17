import type { Metadata } from "next";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import { SortReveal } from "@/components/algo/SortReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { bubbleSortTape, countOps } from "@/lib/algo/bubble-sort";

const VALUES = [5, 2, 9, 1, 7, 4];
const BIG = 1000;

export const metadata: Metadata = {
  title: "버블 정렬",
  description: "옆 사람과 키 순서로 서 보기",
};

export default function BubbleSortPage() {
  const tape = bubbleSortTape(VALUES);
  const ops = countOps(VALUES);

  return (
    <main className="algo-page">
      <p className="algo-crumb">정렬</p>
      <h1 className="algo-title">버블 정렬</h1>
      <p className="algo-lede">옆 사람과 키 순서로 서 보기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>여섯 칸을 작은 수부터 늘어놓아 보세요. 두 칸을 누르면 자리가 바뀝니다.</p>

      <SortReveal>
        <p>
          컴퓨터는 한눈에 못 봅니다. <strong>옆칸 둘씩만</strong> 견줄 수 있습니다. 그래서
          앞에서 뒤로 훑으며 앞이 크면 바꾸기를 되풀이합니다.
        </p>
        <p>
          한 바퀴 돌면 가장 큰 수가 맨 뒤로 밀려납니다. 이렇게 옆칸 비교만으로 정렬하는 방법 ={" "}
          <strong>버블 정렬</strong>
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

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 바퀴 두 번 도는 것이 전부다</h2>
      <p>▶로 한 칸씩 넘기며 확정된 칸이 뒤에서부터 쌓이는 걸 보세요.</p>

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
          { label: "0번 — 바꿀 게 없으니 건너뛴다" },
          { label: "정렬이 안 된 때와 똑같다", correct: true },
        ]}
        why={
          <>
            바꾸기는 한 번도 안 일어나지만 <strong>비교는 그대로 다 합니다.</strong> 코드가
            &ldquo;이미 정렬됐다&rdquo;를 확인하는 줄이 없기 때문입니다. 한 바퀴에 한 번도 안
            바뀌면 멈추는 줄을 넣으면 그때부터 달라집니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 → ⑦ 신호 */}
      <h2>버블 정렬은 실전에서 쓰지 않는다</h2>
      <Counter
        rows={[
          { label: `버블 정렬 · ${BIG}개`, n: (BIG * (BIG - 1)) / 2, unit: "번" },
          { label: `Python sorted · ${BIG}개`, n: Math.round(BIG * Math.log2(BIG)), unit: "번" },
        ]}
        caption="같은 1000개를 정렬할 때의 비교 횟수. 10000개면 차이가 또 열 배로 벌어집니다."
      />
      <p>
        여섯 칸짜리 예시에서는 비교 {ops.compares}번, 교환 {ops.swaps}번이었습니다. 칸이 늘어나면
        이 수가 제곱으로 커집니다.
      </p>

      <h2>그래도 버블 정렬을 배우는 이유</h2>
      <div className="algo-signals">
        <b>옆칸만 비교</b>
        <b>제자리에서 정렬</b>
        <b>n² 가 어떤 느낌인지</b>
      </div>
      <p className="algo-next">
        다음 장에서는 한 바퀴에 가장 작은 수를 골라 앞으로 보내는 선택 정렬을 봅니다.
      </p>
    </main>
  );
}
