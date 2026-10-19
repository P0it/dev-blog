import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { QuickReveal } from "@/components/algo/QuickReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { quickSortTape, countQuickOps, quickLabels, QUICK_CARDS, QUICK_SORTED } from "@/lib/algo/quick-sort";
import { josa } from "@/lib/algo/josa";
import { ops, pairCount, timeLabel } from "@/lib/algo/big-o";

const BIG = 1000;
const HUGE = 100_000;

export const metadata: Metadata = {
  title: "퀵 정렬",
  description: "기준 하나로 좌우를 가르기",
};

export default async function QuickSortPage() {
  const tape = await highlightTape(quickSortTape(QUICK_CARDS));
  const hand = countQuickOps(QUICK_CARDS);
  const sorted = countQuickOps(QUICK_SORTED);
  const pivot = QUICK_CARDS[0];
  const third = QUICK_CARDS[2];

  // 예측 한 번 — 세 번째 카드(8)를 기준(6)과 견주기 직전, 8·9번 줄이 실행될지
  const askAt = tape.steps.findIndex((s) => s.line === 7 && s.vars.j === 2);
  const pause: PlayerPause = {
    at: askAt,
    ask: (
      <>
        다음 카드 {josa(third, "은", "는")} 기준 {pivot} 보다 작을까요?
      </>
    ),
    options: [
      { label: "작다 — i 가 한 칸 늘어난다" },
      { label: "같다 — 아무것도 안 바뀐다" },
      { label: "크다 — i 는 그대로 있고 j 만 다음 카드로 간다", correct: true },
    ],
    why: (
      <>
        {josa(third, "은", "는")} 기준 {pivot} 보다 큽니다. 7번 줄의 조건이 거짓이라 8·9번 줄은 건너뛰고 <code>j</code> 만 다음
        카드로 갑니다.
      </>
    ),
  };

  return (
    <main className="algo-page">
      <p className="algo-crumb">정렬</p>
      <h1 className="algo-title">퀵 정렬</h1>
      <p className="algo-lede">기준 하나로 좌우를 가르기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>카드 일곱 장이 있습니다. 맨 앞 카드를 기준으로 삼고 나머지를 한 장씩 보며 왼쪽과 오른쪽 묶음으로 가릅니다.</p>

      <QuickReveal>
        <ul className="algo-keys">
          <li>
            <b>기준 카드</b> — 왼쪽 묶음의 장수가 곧 제자리 칸 번호다. 다시 움직이지 않는다
          </li>
          <li>
            <b>두 묶음</b> — 안쪽 순서는 뒤죽박죽이어도 된다. 묶음마다 같은 일을 되풀이한다
          </li>
        </ul>
        <p>
          기준을 잡고 좌우로 가르기를 되풀이하는 방법 = <strong>퀵 정렬</strong>. 이때 기준 카드를 <strong>피벗(pivot)</strong>이라고
          부릅니다.
        </p>
        <Counter
          rows={[
            { label: `버블 정렬 · ${BIG}개`, n: pairCount(BIG), unit: "번" },
            { label: `퀵 정렬(평균) · ${BIG}개`, n: ops("nlogn", BIG), unit: "번" },
          ]}
          caption="묶음을 쪼개는 층 수 log N 에 층마다 훑는 N 번을 곱한 N log N 입니다. 기준이 가운데쯤에 놓일 때의 평균입니다."
        />
      </QuickReveal>

      {/* ③ 조건 짚기 */}
      <h2>기준이 가운데쯤에 놓여야 빠르다</h2>
      <ul className="algo-keys">
        <li>
          <b>반씩 갈리면</b> — 층이 log N 개다. 층마다 카드를 한 번씩 보니 N log N
        </li>
        <li>
          <b>한쪽으로 쏠리면</b> — 한 번에 기준 카드 하나만 정해진다. 층이 N 개가 되어 비교가 N(N−1)/2, 곧 N²
        </li>
        <li>
          <b>정렬된 카드</b> — 위의 「이미 정렬된 카드로 해 보기」에서 왼쪽이 0장이었다. 일곱 장이면 비교 {sorted.compares}번이다(손으로
          해 본 카드는 {hand.compares}번). 10만 장이면 {pairCount(HUGE).toLocaleString("ko-KR")}번으로{" "}
          {timeLabel(Math.log10(pairCount(HUGE)))} 걸린다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 가르고 양쪽에 되풀이하는 것이 전부다</h2>
      <p>
        ① 에서 한 순서 그대로 기준을 맨 앞 칸에 두고 앞에서부터 훑습니다.{" "}
        <strong>다음</strong>을 눌러 첫 분할을 한 줄씩 보세요. 안쪽 분할은 기준을 놓은 줄 하나로 묶어 보여 줍니다.
      </p>

      <TrackPlayer tape={tape} values={QUICK_CARDS} title="기준을 잡고 좌우로 가른 뒤 양쪽에 되풀이하는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>lo</code> · <code>hi</code>
          </b>{" "}
          — 지금 가르는 구간. 처음엔 0번 칸부터 6번 칸까지다
        </li>
        <li>
          <b>
            <code>i</code>
          </b>{" "}
          — 작은 카드 묶음의 끝 칸 번호
        </li>
        <li>
          <b>
            <code>j</code>
          </b>{" "}
          — 지금 기준과 견주는 칸. <code>lo + 1</code> 부터 <code>hi</code> 까지 간다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            이미 정렬된 카드 <code>{QUICK_SORTED.join(" ")}</code> 을 맨 앞 카드를 기준으로 첫 분할하면 왼쪽 묶음에 몇 장이 모일까요?
          </>
        }
        options={[
          { label: `${sorted.firstRight}장 — 거꾸로 선 카드에서 나오는 수` },
          { label: "3장 — 가운데 카드 4 를 기준으로 잡았을 때 나오는 수" },
          { label: `${sorted.firstLeft}장`, correct: true },
        ]}
        why={
          <>
            기준 1 보다 작은 카드가 없어서 왼쪽 묶음은 비어 있습니다. 6장은 <code>7 6 5 4 3 2 1</code> 처럼 거꾸로 선 카드에서
            나옵니다. 3장은 가운데 카드 4 를 기준으로 잡았을 때 나옵니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>퀵 정렬에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>정렬된 큰 입력</b> — 5000장만 돼도 <code>RecursionError: maximum recursion depth exceeded</code> 가 난다. 층이 N 개가
          되는데 파이썬의 기본 재귀 한도는 1000이다
        </li>
        <li>
          <b>같은 값이 많으면</b> — 5000장이 모두 같아도 같은 에러가 난다. 같은 카드는 <code>&lt;</code> 가 거짓이라 전부 오른쪽으로
          가서 쏠린다
        </li>
        <li>
          <b>기준을 가운데나 무작위로</b> — 가운데 카드를 맨 앞으로 옮겨 기준으로 삼으면 정렬된 5000장도 끝까지 간다
        </li>
        <li>
          <b>같은 값의 순서가 뒤집힌다</b> — <code>2a 1b 1c</code> 를 정렬하면{" "}
          {quickLabels([
            [2, "a"],
            [1, "b"],
            [1, "c"],
          ]).join(" ")}{" "}
          가 된다. 안정 정렬이 아니다
        </li>
        <li>
          <b>리스트 컴프리헨션 버전</b> — 짧게 쓸 수 있지만 가를 때마다 새 리스트를 만들어 메모리를 더 쓴다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>코딩테스트에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>평균적으로 빠른 정렬을 직접 짜야 한다</b>
        <b>k 번째로 작은 수</b>
        <b>기준보다 작다/크다로 가르기</b>
      </div>
      <p>
        실전에서 정렬이 필요하면 <code>sorted()</code> 한 줄이면 됩니다.
      </p>
      <p className="algo-next">다음 장에서는 여러 기준으로 정렬하는 Python sort 와 key 를 봅니다.</p>
    </main>
  );
}
