import type { Metadata } from "next";
import Link from "next/link";
import { highlightTape } from "@/lib/algo/highlight";
import { KnapPlayer } from "@/components/algo/KnapPlayer";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { KnapReveal } from "@/components/algo/KnapReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { timeLabel } from "@/lib/algo/big-o";
import { josa } from "@/lib/algo/josa";
import {
  ITEMS,
  CAPACITY,
  GREEDY_COUNTER,
  knapTable,
  bestValue,
  traceBack,
  knapsackTape,
  knapGate,
  knapNoCheck,
  knap1dForward,
  knap1dBackward,
  greedyByRatio,
  subsetCount,
  tableCells,
} from "@/lib/algo/knapsack";

const TABLE = knapTable();
const BEST = bestValue();

export const metadata: Metadata = {
  title: "0/1 배낭",
  description: "가방에 무엇을 담을까",
};

export default async function KnapsackPage() {
  const tape = await highlightTape(knapsackTape());
  const took = traceBack().map((k) => ITEMS[k].name);
  const cells30 = tableCells(30, 1000);
  const all30 = subsetCount(30);

  // 예측 한 번 — (2, 5) 칸의 담기 값이 안 담기 값보다 클까
  const gate = knapGate(tape);
  const pause: PlayerPause = {
    at: gate,
    ask: (
      <>
        B 줄의 용량 {CAPACITY} 칸입니다. 안 담은 값은 바로 위 칸의 {TABLE[1][5]}입니다. 담았을 때의 값은 어떨까요?
      </>
    ),
    options: [
      { label: "안 담은 값보다 작다" },
      { label: "안 담은 값과 같다" },
      { label: "안 담은 값보다 크다", correct: true },
    ],
    why: (
      <>
        B 의 무게는 {ITEMS[1].w}입니다. 무게만큼 왼쪽 위 칸, 곧 A 줄의 용량 {CAPACITY - ITEMS[1].w} 칸의 값은 {TABLE[1][CAPACITY - ITEMS[1].w]}입니다.
        여기에 B 의 값 {josa(ITEMS[1].v, "을", "를")} 더한 {josa(TABLE[1][CAPACITY - ITEMS[1].w] + ITEMS[1].v, "이", "가")} 안 담은 {TABLE[1][5]}보다 큽니다.
      </>
    ),
  };

  const w6 = bestValue(ITEMS, 6);
  const fwd = knap1dForward();
  const bwd = knap1dBackward();
  const counterGreedy = greedyByRatio(GREEDY_COUNTER.items, GREEDY_COUNTER.W);
  const counterBest = bestValue(GREEDY_COUNTER.items, GREEDY_COUNTER.W);
  const allValue = ITEMS.reduce((s, x) => s + x.v, 0);

  return (
    <main className="algo-page">
      <p className="algo-crumb">DP</p>
      <h1 className="algo-title">0/1 배낭</h1>
      <p className="algo-lede">가방에 무엇을 담을까</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <KnapReveal>
        <p className="algo-chain">
          0 → 0 → 3 → 4 → 5 → 7
          <span>마지막 줄의 값입니다. 용량이 커질수록 담을 수 있는 최대 가치가 올라갑니다.</span>
        </p>
        <ul className="algo-keys">
          <li>
            <b>칸의 값</b> — 안 담기(바로 위 칸)와 담기(무게만큼 왼쪽 위 칸 + 이 물건의 값) 중 더 큰 쪽
          </li>
          <li>
            <b>끝 칸</b> — 용량 {CAPACITY}에 담을 수 있는 최대 가치는 {BEST}이다
          </li>
          <li>
            <b>무엇을 담았나</b> — 끝 칸에서 거꾸로 올라가며 위 칸과 값이 달라진 줄의 물건을 담은 것이다. 이 표에서는 {took.join("와 ")}이다
          </li>
        </ul>
        <p>
          작은 가방부터 채워 큰 가방의 답까지 올라가는 표 = <strong>0/1 배낭</strong> (동적 계획법, DP). 0/1 은 물건마다 담거나 안 담거나 둘 중 하나라는 뜻입니다.
        </p>
        <Counter
          rows={[
            { label: "물건 30개 · 모든 경우 세기", n: all30, unit: "가지" },
            { label: "물건 30개 · 용량 1000 · 표 채우기", n: cells30, unit: "칸" },
          ]}
          caption={`담을지 말지 모든 경우를 하나씩 보면 컴퓨터로 약 ${timeLabel(Math.log10(all30))} 걸립니다. 표는 1초 안에 끝납니다.`}
        />
      </KnapReveal>

      {/* ③ 조건 짚기 */}
      <h2>물건마다 담거나 말거나 둘 중 하나다</h2>
      <ul className="algo-keys">
        <li>
          <b>선택은 둘뿐</b> — 물건을 쪼개거나 두 번 담을 수 없다. 담으면 남은 용량이 물건의 무게만큼 줄어든다
        </li>
        <li>
          <b>칸이 하나로 정해진다</b> — 앞 물건들과 남은 용량만 알면 그 칸의 답이 정해진다. ①에서 위 칸과 왼쪽 위 칸이 채워져야 눌렸던 이유다
        </li>
        <li>
          <b>모든 경우를 세던 방법과 비교</b> — <Link href="/algo/brute-force">완전탐색</Link>은 물건이 N 개면 2^N 가지를 본다. 표는 N × 용량 칸이다. 같은 칸의 답을
          다시 구하지 않는다는 점은 <Link href="/algo/memoization">메모이제이션</Link>, 앞 칸으로 채운다는 점은 <Link href="/algo/dp-1d">1차원 DP</Link>와 같다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 물건마다 용량을 한 줄씩 채우는 이중 반복문이다</h2>
      <p>
        물건과 용량은 ①과 같습니다. <strong>다음</strong>을 눌러 한 줄씩 넘기며 노란 칸이 어떤 칸을 읽는지 보세요.
      </p>

      <KnapPlayer tape={tape} pause={pause} title="배낭 표를 한 줄씩 채우는 모습" />

      <ul className="algo-keys">
        <li>
          <b>
            <code>dp[i][w] = dp[i - 1][w]</code>
          </b>{" "}
          — 먼저 안 담은 값을 적는다. 바로 위 칸이다
        </li>
        <li>
          <b>
            <code>if w &gt;= wt</code>
          </b>{" "}
          — 무게가 용량보다 크면 담을 수 없어 위 칸 값 그대로 둔다
        </li>
        <li>
          <b>
            <code>dp[i - 1][w - wt] + val</code>
          </b>{" "}
          — 담았을 때의 값이다. 무게만큼 왼쪽 위 칸에 이 물건의 값을 더한다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={`가방 용량을 6 으로 늘리면 담을 수 있는 최대 가치는 얼마일까요? 물건은 그대로 A·B·C 입니다.`}
        options={[
          { label: `${w6} — A 와 C 를 함께 담는다 (무게 6)`, correct: true },
          { label: `${BEST} — 용량 ${CAPACITY}일 때와 같다` },
          { label: `${allValue} — 셋 다 담는다` },
        ]}
        why={
          <>
            용량 6 이면 A(무게 2)와 C(무게 4)가 딱 들어가 값이 3 + 5 = <strong>{w6}</strong>입니다. 용량 {CAPACITY}일 때는 C 를 담으면 A 가 못 들어가서 최선이 {BEST}이었습니다.
            셋을 다 담으면 값의 합은 {allValue}입니다. 하지만 무게의 합이 9 라 용량 6 에 들어가지 않습니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>그리디와 배열 줄이기에서 틀린다</h2>
      <ul className="algo-keys">
        <li>
          <b>무게당 값이 큰 것부터 담으면</b> — 틀릴 수 있다. 용량 {GREEDY_COUNTER.W}에 P(무게 3 · 값 5), Q(무게 2 · 값 3), R(무게 2 · 값 3)이 있으면 P 부터 담아{" "}
          {josa(counterGreedy, "이", "가")} 되지만 표는 Q 와 R 로 {josa(counterBest, "을", "를")} 찾는다. 이 장의 입력에서는 두 방법 모두 {greedyByRatio()}이다
        </li>
        <li>
          <b>1차원 배열로 줄일 때</b> — 용량을 <strong>큰 쪽부터 거꾸로</strong> 돌아야 한다. 앞에서부터 돌면 같은 물건을 여러 번 담아 용량 4 칸이 {josa(bwd[4], "이", "가")} 아니라 {josa(fwd[4], "이", "가")} 된다 (A 를 두 번 담은 값이다)
        </li>
        <li>
          <b>
            <code>if w &gt;= wt</code> 를 빼면
          </b>{" "}
          — <code>w - wt</code> 가 음수가 되어 파이썬은 그 줄의 끝에서부터 칸을 읽는다. 에러 없이 이 입력의 답이 {josa(BEST, "이", "가")} 아니라 {josa(knapNoCheck(), "으로", "로")} 나온다
        </li>
        <li>
          <b>0행과 0열</b> — 물건이 없거나 용량이 0 이면 값은 0 이다. 표를 0 으로 만들어 두면 이 칸들은 따로 채우지 않아도 된다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>무게(용량) 제한이 있다</b>
        <b>최대 가치 · 최소 비용</b>
        <b>물건마다 담거나 말거나</b>
      </div>
      <p className="algo-next">다음 장에서는 큰 동전부터 주면 되는지를 따지는 거스름돈을 봅니다.</p>
    </main>
  );
}
