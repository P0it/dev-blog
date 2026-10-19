import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { SelectReveal } from "@/components/algo/SelectReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import {
  selectionSortTape,
  countSelectionOps,
  selectionLabels,
  compareCountFrom,
  SELECT_CARDS,
} from "@/lib/algo/selection-sort";
import { countOps as bubbleOps } from "@/lib/algo/bubble-sort";

const REVERSED = [6, 5, 4, 3, 2, 1];

export const metadata: Metadata = {
  title: "선택 정렬",
  description: "가장 작은 것부터 꺼내 놓기",
};

export default async function SelectionSortPage() {
  const tape = await highlightTape(selectionSortTape(SELECT_CARDS));
  const ops = countSelectionOps(SELECT_CARDS);
  const bubble = bubbleOps(SELECT_CARDS);
  const revSelect = countSelectionOps(REVERSED).swaps;
  const revBubble = bubbleOps(REVERSED).swaps;

  // 예측 한 번 — 첫 비교(2 와 후보 5) 다음 줄에서 후보가 바뀌는지
  const firstUpdate = tape.steps.findIndex((s) => s.line === 7);
  const pause: PlayerPause = {
    at: firstUpdate,
    ask: (
      <>
        {SELECT_CARDS[1]} 와 후보 {SELECT_CARDS[0]} 를 견줬습니다. 다음 줄에서 후보는 어떻게 될까요?
      </>
    ),
    options: [
      { label: `그대로 ${SELECT_CARDS[0]} 이다` },
      { label: `${SELECT_CARDS[0]} 와 ${SELECT_CARDS[1]} 둘 다 후보로 남는다` },
      { label: `${SELECT_CARDS[1]} 로 바뀐다`, correct: true },
    ],
    why: (
      <>
        {SELECT_CARDS[1]} 가 {SELECT_CARDS[0]} 보다 작아서 <code>min_idx = j</code> 가 실행됩니다. 후보는 늘 하나뿐이고,
        더 작은 카드를 만나야 바뀝니다.
      </>
    ),
  };

  const pairs: [number, string][] = [
    [2, "a"],
    [2, "b"],
    [1, "c"],
  ];
  const sortedPairs: [number, string][] = [
    [1, "a"],
    [1, "b"],
    [2, "c"],
  ];

  return (
    <main className="algo-page">
      <p className="algo-crumb">정렬</p>
      <h1 className="algo-title">선택 정렬</h1>
      <p className="algo-lede">가장 작은 것부터 꺼내 놓기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>카드 여섯 장을 작은 수부터 왼쪽에 늘어놓아 보세요. 한 장씩 보며 가장 작은 카드를 찾아 왼쪽 끝으로 보냅니다.</p>

      <SelectReveal>
        <p className="algo-chain">
          5 → 2 → 1
          <span>첫 바퀴에서 가장 작은 카드 후보가 이렇게 바뀌었습니다.</span>
        </p>
        <Counter
          rows={[
            { label: "버블 정렬 · 바꾼 횟수", n: bubble.swaps, unit: "번" },
            { label: "선택 정렬 · 바꾼 횟수", n: ops.swaps, unit: "번" },
          ]}
          caption={`같은 카드를 정렬합니다. 견준 횟수는 둘 다 ${ops.compares}번입니다. 선택 정렬은 많아야 ${ops.codeSwaps}번만 바꿉니다.`}
        />
        <p>
          한 바퀴에 가장 작은 카드 하나를 골라 맨 앞 빈 칸과 맞바꾸는 방법 = <strong>선택 정렬</strong>
        </p>
      </SelectReveal>

      {/* ③ 조건 짚기 */}
      <h2>이미 정렬돼 있어도 훑는 횟수는 같다</h2>
      <ul className="algo-keys">
        <li>
          <b>바퀴마다</b> — 남은 카드를 끝까지 봐야 가장 작은 카드를 안다. 앞에서 찾아도 끝까지 본다
        </li>
        <li>
          <b>훑는 횟수</b> — 5 + 4 + 3 + 2 + 1 = {ops.compares}번. 카드가 n장이면 n(n−1)/2번이다
        </li>
        <li>
          <b>정렬된 카드도</b> — 맨 앞이 가장 작은지 끝까지 봐야 안다. 위의 「이미 정렬된 카드로 해 보기」로 세어 보면
          여전히 {ops.compares}번이다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 후보 하나를 들고 훑는 것이 전부다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 후보가 바뀌는 걸 보세요. 앞에서부터 확정된 칸이 쌓입니다.
      </p>

      <TrackPlayer tape={tape} values={SELECT_CARDS} title="후보를 들고 훑다가 맨 앞 빈 칸과 맞바꾸는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>i</code>
          </b>{" "}
          — 지금 채우는 칸. 앞 i칸은 이미 자리를 잡았다
        </li>
        <li>
          <b>
            <code>min_idx</code>
          </b>{" "}
          — 지금까지 본 카드 중 가장 작은 카드의 칸 번호(후보)
        </li>
        <li>
          <b>
            <code>j</code>
          </b>{" "}
          — 지금 견주는 칸. <code>i + 1</code> 부터 끝까지 간다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            거꾸로 선 카드 <code>6 5 4 3 2 1</code> 을 선택 정렬하면 자리를 몇 번 바꿀까요?
          </>
        }
        options={[
          { label: `${revBubble}번 — 거꾸로 선 쌍마다 한 번씩` },
          { label: `${ops.codeSwaps}번 — 바퀴마다 한 번씩` },
          { label: `${revSelect}번`, correct: true },
        ]}
        why={
          <>
            6 은 1 과, 5 는 2 와, 4 는 3 과 맞바꾸면 끝납니다. 그 뒤 바퀴는 후보가 이미 제자리라 바꾸지 않습니다.{" "}
            <strong>거꾸로 선 쌍마다 한 번씩</strong>({revBubble}번)은 버블 정렬이고, {ops.codeSwaps}번은{" "}
            <code>2 3 4 5 6 1</code> 처럼 한 칸씩 돌려 놓은 줄에서 나옵니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>선택 정렬에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>같은 값의 순서가 뒤집힌다</b> — 먼 칸과 맞바꾼다. <code>2a 2b 1c</code> 를 정렬하면{" "}
          {selectionLabels(pairs, "<").join(" ")} 이 된다. 안정 정렬이 아니다
        </li>
        <li>
          <b>
            <code>&lt;</code> 대신 <code>&lt;=</code>
          </b>{" "}
          — 같은 값 중 뒤쪽을 후보로 잡는다. 이미 정렬된 <code>1a 1b 2c</code> 가 {selectionLabels(sortedPairs, "<=").join(" ")}{" "}
          로 바뀐다
        </li>
        <li>
          <b>
            <code>range(i + 1, n)</code> 대신 <code>range(i, n)</code>
          </b>{" "}
          — 자기 자신과도 견줘 비교가 {compareCountFrom(SELECT_CARDS.length, 1)}번에서 {compareCountFrom(SELECT_CARDS.length, 0)}번으로
          는다. 답은 그대로 맞다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>쓸 일은 적지만 이럴 때 나온다</h2>
      <div className="algo-signals">
        <b>n 이 작다</b>
        <b>바꾸는(쓰는) 횟수를 줄여야 한다</b>
        <b>k 번째로 작은 것까지만 필요하다</b>
      </div>
      <p>
        실전에서 정렬이 필요하면 <code>sorted()</code> 한 줄이면 됩니다.
      </p>
      <p className="algo-next">다음 장에서는 카드를 한 장씩 알맞은 자리에 끼워 넣는 삽입 정렬을 봅니다.</p>
    </main>
  );
}
