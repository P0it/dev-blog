import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import { PairsReveal } from "@/components/algo/PairsReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { pairTape, pairChecks, PAIR_CARDS, PAIR_TARGET } from "@/lib/algo/two-pointers";
import { pairCount } from "@/lib/algo/big-o";

const BIG = 100_000;

export const metadata: Metadata = {
  title: "투 포인터",
  description: "양쪽에서 좁혀 오기",
};

export default async function TwoPointersPage() {
  const tape = await highlightTape(pairTape(PAIR_CARDS, PAIR_TARGET));
  const checks = pairChecks(PAIR_CARDS, PAIR_TARGET);

  return (
    <main className="algo-page">
      <p className="algo-crumb">기초 개념</p>
      <h1 className="algo-title">투 포인터</h1>
      <p className="algo-lede">양쪽에서 좁혀 오기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <PairsReveal>
        <p className="algo-chain">
          1 + 13 → 1 + 10 → 3 + 10
          <span>양끝만 보고, 볼 때마다 카드 한 장을 버렸습니다.</span>
        </p>
        <Counter
          rows={[
            { label: `모든 쌍 · ${PAIR_CARDS.length}장`, n: pairCount(PAIR_CARDS.length), unit: "번" },
            { label: `양끝에서 좁히기 · ${PAIR_CARDS.length}장`, n: checks, unit: "번" },
          ]}
          caption={`같은 카드, 같은 목표. ${BIG.toLocaleString("ko-KR")}장이면 ${Math.round(pairCount(BIG)).toLocaleString("ko-KR")}번 대 ${(BIG - 1).toLocaleString("ko-KR")}번까지 벌어집니다.`}
        />
        <p>
          줄 선 카드의 양끝에서 시작해 가운데로 좁혀 가는 방법 = <strong>투 포인터</strong>
        </p>
      </PairsReveal>

      {/* ③ 조건 짚기 */}
      <h2>왜 버려도 될까</h2>
      <ul className="algo-keys">
        <li>
          <b>합이 크면</b> — 오른쪽 끝은 남은 카드 중 가장 작은 왼쪽 끝과 더해도 이미 크다. 짝이 없으니 버린다
        </li>
        <li>
          <b>합이 작으면</b> — 왼쪽 끝은 남은 카드 중 가장 큰 오른쪽 끝과 더해도 아직 작다. 짝이 없으니 버린다
        </li>
        <li>
          <b>그래서</b> — 가장 작은 카드와 가장 큰 카드가 양끝에 있어야 한다. 줄이 작은 수부터 서 있어야 한다는 뜻이다
        </li>
      </ul>
      <p>
        줄이 흐트러진 <code>[3, 9, 10, 1]</code> 에서 목표 13 을 찾는다고 해 봅니다. 처음 합 3 + 1 = 4 는 작으니 왼쪽 3 을
        버립니다. 그런데 3 + 10 = 13 이 정답이었습니다. 버리면 안 되는 카드를 버린 것입니다.
      </p>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 끝 두 개를 가리키는 변수 둘이 전부다</h2>
      <Quiz
        question={
          <>
            누르기 전에 맞혀 보세요. 처음 합 1 + 13 = 14 는 목표 {PAIR_TARGET} 보다 큽니다. 다음에 움직이는 변수는 무엇일까요?
          </>
        }
        options={[
          { label: "left 가 한 칸 오른쪽으로 간다" },
          { label: "right 가 한 칸 왼쪽으로 간다", correct: true },
          { label: "둘 다 한 칸씩 움직인다" },
        ]}
        why={
          <>
            합이 크니 큰 쪽 끝인 <strong>right</strong> 를 줄입니다. <strong>다음</strong>을 눌러 확인해 보세요. 3번 줄에서 left 와 right 가 매번 한 쪽만 움직입니다.
          </>
        }
      />

      <TrackPlayer tape={tape} values={PAIR_CARDS} title="양끝에서 좁혀 오며 합이 목표인 쌍을 찾는 모습" />

      <ul className="algo-keys">
        <li>
          <b>
            <code>left</code> · <code>right</code>
          </b>{" "}
          — 남은 카드의 양끝 칸 번호. 둘 사이가 아직 안 버린 카드다
        </li>
        <li>
          <b>
            <code>total</code>
          </b>{" "}
          — 지금 양끝의 합. 이 값 하나로 어느 쪽을 버릴지 정한다
        </li>
        <li>
          <b>
            <code>left &lt; right</code>
          </b>{" "}
          — 두 끝이 만나면 멈춘다. 같은 카드를 두 번 쓰지 않는다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="줄이 흐트러진 [3, 9, 10, 1] 에 같은 코드를 돌립니다. 3 + 10 = 13 이 있는데 목표 13 을 찾을까요?"
        options={[
          { label: "못 찾는다 — False 가 나온다", correct: true },
          { label: "찾는다 — True 가 나온다" },
          { label: "합을 한 번도 안 보고 끝난다" },
        ]}
        why={
          <>
            처음 합 3 + 1 = 4 가 작아서 3 을 버립니다. 3 은 다시 못 보니 3 + 10 은 영영 못 만들고, 합 4 → 10 → 11 로 끝까지 작아서 <code>False</code> 가 나옵니다. 합을 한 번도 안 보고 끝나는 것은 카드가 한 장도 없을 때입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>쌍이 있는데 없다고 하거나, 없는데 있다고 한다</h2>
      <ul className="algo-keys">
        <li>
          <b>줄이 안 섰다</b> — 위 문제처럼 쌍을 놓친다. 먼저 <code>arr.sort()</code> 로 줄을 세운다. 줄 세우는 데 N log N 이 든다
        </li>
        <li>
          <b>
            <code>left &lt;= right</code>
          </b>{" "}
          — 같은 카드를 두 번 쓴다. <code>[1, 6, 9]</code> 에서 목표 12 는 쌍이 없는데 6 + 6 을 쌍이라고 한다
        </li>
        <li>
          <b>끝까지 못 찾으면</b> — 두 끝이 만나서 반복문이 끝난다. 그때 <code>return False</code>
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>정렬돼 있다</b>
        <b>두 수의 합</b>
        <b>양끝에서 좁힌다</b>
      </div>
      <p className="algo-next">
        다음 장에서는 창문을 밀면서 보는 슬라이딩 윈도우를 봅니다.
      </p>
    </main>
  );
}
