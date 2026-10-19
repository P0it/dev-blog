import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import { WindowReveal } from "@/components/algo/WindowReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { windowTape, windowSums, bruteOps, slideOps, TEMPS, WINDOW_K } from "@/lib/algo/sliding-window";
import { timeLabel } from "@/lib/algo/big-o";

const BIG_N = 100_000;
const BIG_K = 10_000;

export const metadata: Metadata = {
  title: "슬라이딩 윈도우",
  description: "창문을 밀면서 보기",
};

export default async function SlidingWindowPage() {
  const tape = await highlightTape(windowTape(TEMPS, WINDOW_K));
  const sums = windowSums(TEMPS, WINDOW_K);
  const brute = bruteOps(BIG_N, BIG_K);
  const slide = slideOps(BIG_N, BIG_K);

  return (
    <main className="algo-page">
      <p className="algo-crumb">기초 개념</p>
      <h1 className="algo-title">슬라이딩 윈도우</h1>
      <p className="algo-lede">창문을 밀면서 보기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <WindowReveal>
        <p className="algo-chain">
          {sums.join(" → ")}
          <span>창을 한 칸씩 밀 때마다 합이 이렇게 이어졌습니다. 가장 큰 합은 {Math.max(...sums)}.</span>
        </p>
        <ul className="algo-keys">
          <li>
            <b>한 칸 밀면</b> — 바뀌는 칸은 둘뿐이다. 나가는 칸과 들어오는 칸
          </li>
          <li>
            <b>그래서</b> — 세 칸을 다시 더하지 않고 <code>− 나간 값</code> <code>+ 들어온 값</code> 만 한다
          </li>
        </ul>
        <p>
          창을 한 칸씩 밀며 합을 이어 가는 방법 = <strong>슬라이딩 윈도우</strong>
        </p>
        <Counter
          rows={[
            { label: `창마다 다시 더하기 · ${BIG_N.toLocaleString("ko-KR")}칸`, n: brute, unit: "번" },
            { label: `한 칸 밀며 이어 가기 · ${BIG_N.toLocaleString("ko-KR")}칸`, n: slide, unit: "번" },
          ]}
          caption={`창이 ${BIG_K.toLocaleString("ko-KR")}칸이면 차이가 큽니다. 다시 더하면 ${timeLabel(Math.log10(brute))}, 이어 가면 ${timeLabel(Math.log10(slide))}.`}
        />
      </WindowReveal>

      {/* ③ 조건 짚기 */}
      <h2>연속한 칸이고, 창 크기가 정해져 있어야 한다</h2>
      <ul className="algo-keys">
        <li>
          <b>연속한 칸</b> — 건너뛴 칸이 끼면 한 칸 밀어서 합을 이을 수 없다
        </li>
        <li>
          <b>정해진 크기</b> — 이 장은 창 크기 k 가 처음부터 끝까지 같다. 창이 늘었다 줄었다 하는 문제도 같은 틀이지만 여기서는 다루지 않는다
        </li>
        <li>
          <b>그래서</b> — 매번 달라지는 나가는 값과 들어오는 값만 계산하면 된다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 처음 한 번만 다 더한다</h2>
      <p>
        ① 과 같은 열 칸, 창 {WINDOW_K}. <strong>다음</strong>을 눌러 빠지는 값과 들어오는 값을 보세요.
      </p>

      <TrackPlayer tape={tape} values={TEMPS} title="창을 한 칸씩 밀며 합을 이어 가는 모습" />

      <ul className="algo-keys">
        <li>
          <b>
            <code>window = sum(arr[:k])</code>
          </b>{" "}
          — 처음 창만 직접 더한다
        </li>
        <li>
          <b>
            <code>window += arr[i] - arr[i - k]</code>
          </b>{" "}
          — 들어오는 칸을 더하고 나가는 칸을 뺀다
        </li>
        <li>
          <b>
            <code>best</code>
          </b>{" "}
          — 지금까지 본 합 중 가장 큰 것
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="칸이 10개이고 창 크기가 4이면, 창은 몇 곳에 놓일까요?"
        options={[
          { label: "8곳 — 창 크기가 3일 때의 수" },
          { label: "6곳 — 창 크기가 5일 때의 수" },
          { label: "7곳", correct: true },
        ]}
        why={
          <>
            첫 창은 0번 칸에서 시작하고, 마지막 창은 6번 칸에서 시작합니다. <strong>10 − 4 + 1 = 7</strong>.
            창이 3칸이면 8곳, 5칸이면 6곳입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>처음 창과 끝 창에서 틀린다</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>window = sum(arr[:k])</code>
          </b>{" "}
          — 이 줄을 빼먹으면 <code>window</code> 가 없는 채로 <code>+=</code> 를 해서 에러가 난다
        </li>
        <li>
          <b>
            <code>arr[i - k + 1]</code>
          </b>{" "}
          — 나갈 칸 대신 아직 창 안에 있는 칸을 뺀다. 에러 없이 합만 틀린다
        </li>
        <li>
          <b>
            <code>k &gt; n</code>
          </b>{" "}
          — 에러가 나지 않고 전체를 더한 값이 돌아온다. 먼저 k 가 칸 수 이하인지 확인한다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>연속한 구간</b>
        <b>길이가 k 로 정해져 있다</b>
        <b>최대·최소 구간 합</b>
      </div>
      <p className="algo-next">다음 장에서는 어떤 구간이든 뺄셈 한 번으로 합을 구하는 누적합을 봅니다.</p>
    </main>
  );
}
