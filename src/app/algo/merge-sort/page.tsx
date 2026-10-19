import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { MergePlayer } from "@/components/algo/MergePlayer";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { MergeReveal } from "@/components/algo/MergeReveal";
import { MergeTree } from "@/components/algo/MergeTree";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import {
  mergeSortTape,
  MERGE_CARDS,
  MERGE_TREE_CARDS,
  countMergeOps,
  mergeSortLabels,
  mergeSortWithoutRest,
} from "@/lib/algo/merge-sort";
import { ops, pairCount, log10Ops, timeLabel } from "@/lib/algo/big-o";
import { josa } from "@/lib/algo/josa";

const BIG = 1000;
const HUGE = 1_000_000;

export const metadata: Metadata = {
  title: "병합 정렬",
  description: "반으로 쪼갰다 붙이기",
};

export default async function MergeSortPage() {
  const tape = await highlightTape(mergeSortTape(MERGE_CARDS));

  const sortedEight = countMergeOps([1, 2, 3, 4, 5, 6, 7, 8]);
  const shuffledEight = countMergeOps(MERGE_TREE_CARDS);
  const mergeBig = ops("nlogn", BIG);
  const bubbleBig = pairCount(BIG);

  // 예측 한 번 — 합치는 두 묶음 [5] 와 [2, 9] 에서 5 와 2 를 견준 다음, 어느 카드가 내려갈까
  const firstRight = tape.steps.findIndex(
    (s) => s.line === 17 && s.stage.merge?.lo === 0 && s.stage.merge.hi === 3 && s.stage.merge.mid === 1,
  );
  const a = MERGE_CARDS[0];
  const b = MERGE_CARDS[1];
  const pause: PlayerPause = {
    at: firstRight,
    ask: (
      <>
        {josa(a, "과", "와")} {josa(b, "을", "를")} 견줬습니다. 다음에 새 줄로 내려가는 카드는 무엇일까요?
      </>
    ),
    options: [
      { label: `${a} — 왼쪽 묶음의 맨 앞 카드` },
      { label: `${MERGE_CARDS[2]} — 가장 큰 카드` },
      { label: `${b} — 오른쪽 묶음의 맨 앞 카드`, correct: true },
    ],
    why: (
      <>
        {josa(b, "이", "가")} {a} 보다 작아서 <code>left[i] &lt;= right[j]</code> 는 거짓입니다. 코드는 else 쪽(17번 줄)으로
        가서 오른쪽 묶음의 {josa(b, "을", "를")} 내려놓습니다.
      </>
    ),
  };

  const stablePairs: [number, string][] = [
    [2, "a"],
    [1, "c"],
    [2, "b"],
  ];

  return (
    <main className="algo-page">
      <p className="algo-crumb">정렬</p>
      <h1 className="algo-title">병합 정렬</h1>
      <p className="algo-lede">반으로 쪼갰다 붙이기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>이미 정렬된 두 묶음을 하나의 줄로 합쳐 보세요. 카드는 한 장씩 새 줄로 내려갑니다.</p>

      <MergeReveal>
        <p className="algo-chain">
          2 5 9 + 1 4 7 → 1 2 4 5 7 9
          <span>맨 앞 두 장만 견주며 한 장씩 내려놓은 결과입니다.</span>
        </p>
        <p>
          이미 정렬된 두 묶음을 하나로 합치는 방법 = <strong>병합(합치기)</strong>
        </p>
        <p>
          정렬이 안 된 카드 여덟 장도 이걸로 정렬할 수 있습니다. 반으로 쪼개고 또 쪼개면 한 장씩이 됩니다. 한 장은 이미
          정렬된 묶음이라 거꾸로 합쳐 올라가면 끝납니다.
        </p>
        <MergeTree cards={MERGE_TREE_CARDS} />
        <p>
          반으로 쪼갠 뒤 합치며 올라가는 방법 = <strong>병합 정렬</strong>
        </p>
      </MergeReveal>

      {/* ③ 조건 짚기 */}
      <h2>쪼개기는 한 장에서 멈춘다</h2>
      <ul className="algo-keys">
        <li>
          <b>두 묶음이 각각 정렬돼 있다</b> — 그래서 맨 앞 두 장만 견주면 됐다. ① 에서 뒤쪽 카드를 누를 수 없던 이유다
        </li>
        <li>
          <b>한 장짜리 묶음은 이미 정렬돼 있다</b> — 쪼개기를 여기서 멈춘다. 재귀가 멈추는 자리와 같다
        </li>
        <li>
          <b>층마다</b> — 합치며 카드를 한 번씩 내려놓는다. 반으로 쪼갠 횟수가 층 수다. 8장은 {sortedEight.levels}층, 1000장은 10층이다
        </li>
      </ul>
      <p>
        반으로 몇 번 쪼개면 1이 되는지가 log N 입니다. 층 수 × 카드 수가 곧 <strong>N log N</strong> 입니다.
      </p>
      <Counter
        rows={[
          { label: `버블 정렬 · ${BIG}장`, n: bubbleBig, unit: "번" },
          { label: `병합 정렬 · ${BIG}장`, n: mergeBig, unit: "번" },
        ]}
        caption={`같은 ${BIG}장을 정렬할 때 카드를 견주거나 내려놓는 횟수입니다. ${HUGE.toLocaleString("ko-KR")}장이면 약 2천만 번 대 5천억 번입니다. 시간으로는 ${timeLabel(log10Ops("nlogn", HUGE))} 대 ${timeLabel(Math.log10(pairCount(HUGE)))}쯤입니다(Python 1초 ≈ 1천만 번 어림).`}
      />

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 쪼개는 함수와 합치는 함수 둘이다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 위 줄에서 묶음이 합쳐지고 아래 줄이 채워지는 걸 보세요. 재귀로 부르는
        줄(5·6번)과 <code>i += 1</code> 같은 짧은 줄은 건너뜁니다. 마지막 합치기가 ① 에서 한 일입니다.
      </p>

      <MergePlayer tape={tape} values={MERGE_CARDS} title="쪼갠 묶음을 합치며 올라오는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>merge_sort(arr)</code>
          </b>{" "}
          — 반으로 나눠 각각 정렬해 돌려받고 <code>merge</code> 로 합친다. 자기를 두 번 부르는 재귀다
        </li>
        <li>
          <b>
            <code>left[i] &lt;= right[j]</code>
          </b>{" "}
          — 두 묶음의 맨 앞 두 장 중 작은 쪽을 고른다. ① 에서 한 일이다
        </li>
        <li>
          <b>
            <code>result</code>
          </b>{" "}
          — 합쳐서 만드는 줄. 위 그림의 아래 줄이다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="이미 작은 수부터 서 있는 카드 8장을 병합 정렬하면 카드를 모두 몇 번 내려놓을까요?"
        options={[
          { label: "0번 — 이미 정렬돼 있어 합칠 것이 없다" },
          { label: `${MERGE_TREE_CARDS.length}번 — 마지막 합치기 한 번만 한다` },
          { label: `${sortedEight.placed}번 — ${sortedEight.levels}층을 8장씩 다시 합친다`, correct: true },
        ]}
        why={
          <>
            병합 정렬은 입력이 어떻게 생겼든 똑같이 쪼개고 합칩니다. 8장은 {sortedEight.levels}층이고 층마다 8장을 내려놓아{" "}
            <strong>{sortedEight.placed}번</strong>입니다. 흐트러진 8장도 {shuffledEight.placed}번으로
            같습니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>병합 정렬에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>&lt;=</code> 대신 <code>&lt;</code>
          </b>{" "}
          — 같은 값에서 오른쪽 카드가 먼저 나와 원래 순서가 뒤집힌다. <code>2a 1c 2b</code> 를 정렬하면{" "}
          <code>&lt;=</code> 는 <code>{mergeSortLabels(stablePairs, "<=").join(" ")}</code>, <code>&lt;</code> 는{" "}
          <code>{mergeSortLabels(stablePairs, "<").join(" ")}</code> 순서가 된다
        </li>
        <li>
          <b>
            <code>result += left[i:] + right[j:]</code> 를 빼먹으면
          </b>{" "}
          — 한쪽 묶음이 먼저 비었을 때 남은 카드가 사라진다. 여섯 장 <code>{MERGE_CARDS.join(" ")}</code> 를 정렬하면 {mergeSortWithoutRest(MERGE_CARDS).length}장만 남는다
        </li>
        <li>
          <b>
            <code>arr[:mid]</code> 는 복사다
          </b>{" "}
          — 카드를 새 리스트로 옮기니 메모리를 카드 수만큼 더 쓴다. 쪼개는 깊이는 log N 이라 100만 장도 20층이다.
          RecursionError 는 걱정하지 않아도 된다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>같은 값의 순서를 지켜야 한다</b>
        <b>N 이 커도 최악이 N log N</b>
        <b>정렬된 두 묶음을 합친다</b>
      </div>
      <p>
        실전에서 정렬이 필요하면 <code>sorted()</code> 한 줄이면 됩니다. 파이썬의 <code>sorted()</code> 는 병합 정렬과 삽입
        정렬을 섞은 방법을 C 로 구현해 둬서 직접 만든 이 코드보다 훨씬 빠릅니다. Python 3.14 에서 10만 장을 재 보니 이 코드는 0.13초,{" "}
        <code>sorted()</code> 는 0.008초였습니다(컴퓨터마다 다르니 비율만 보세요).
      </p>
      <p className="algo-next">다음 장에서는 기준 카드 하나로 좌우를 가르는 퀵 정렬을 봅니다.</p>
    </main>
  );
}
