import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { HeapPlayer } from "@/components/algo/HeapPlayer";
import { HeapReveal } from "@/components/algo/HeapReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { heapTape, pushed, popMin, treeHeight, WARD, NEWCOMER } from "@/lib/algo/heap";
import { ops, timeLabel } from "@/lib/algo/big-o";
import { josa } from "@/lib/algo/josa";

const BIG = 100_000;

export const metadata: Metadata = {
  title: "힙(우선순위 큐)",
  description: "가장 급한 것부터 꺼내기",
};

export default async function HeapPage() {
  const tape = await highlightTape(heapTape(WARD, NEWCOMER));
  const after = pushed(WARD, NEWCOMER);
  const popped = popMin(after);

  // 부모와 견준 직후, 바꾸는 줄(8번)로 넘어가기 전에 묻는다
  const swapAt = tape.steps.findIndex((s) => s.line === 8);
  const pause: PlayerPause = {
    at: swapAt,
    ask: (
      <>
        누르기 전에 맞혀 보세요. 6번 줄에서 부모 {josa(WARD[2], "과", "와")} 새 환자 {josa(NEWCOMER, "을", "를")} 견줬습니다. 다음에 켜질 줄은 어디일까요?
      </>
    ),
    options: [
      { label: "8번 줄 — 부모와 자리를 바꾼다", correct: true },
      { label: "7번 줄 — break 로 멈춘다" },
      { label: "10번 줄 — 바로 돌려준다" },
    ],
    why: (
      <>
        <code>heap[p] &lt;= heap[i]</code> 는 {WARD[2]} ≤ {josa(NEWCOMER, "이라", "라")} 거짓입니다. 그래서 <code>break</code> 를 건너뛰고 8번 줄에서 자리를
        바꿉니다.
      </>
    ),
  };

  // N 명이 차례로 오는 경우 — 올 때마다 전부 다시 줄 세우기 vs 힙에 앉히고 올리기
  const resortOne = ops("nlogn", BIG);
  const heapOne = treeHeight(BIG);
  const resortAllTime = timeLabel(Math.log10(resortOne) + Math.log10(BIG));
  const heapAllTime = timeLabel(Math.log10(heapOne) + Math.log10(BIG));

  return (
    <main className="algo-page">
      <p className="algo-crumb">자료구조</p>
      <h1 className="algo-title">힙(우선순위 큐)</h1>
      <p className="algo-lede">가장 급한 것부터 꺼내기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <HeapReveal>
        <p className="algo-chain">
          6번 자리 → 2번 자리 → 0번 자리
          <span>새 환자가 올라간 길입니다. 부모보다 급할 때만 한 칸씩 올라갑니다.</span>
        </p>
        <ul className="algo-keys">
          <li>
            <b>맨 위 환자</b> — 언제나 가장 급한 환자(가장 작은 숫자)입니다
          </li>
          <li>
            <b>위 칸과 아래 칸</b> — 위 칸은 바로 아래 두 칸보다 늘 같거나 급합니다
          </li>
          <li>
            <b>올라간 횟수</b> — 많아야 나무 높이만큼입니다. 환자가 {BIG.toLocaleString("ko-KR")}명이어도 {heapOne}번입니다
          </li>
        </ul>
        <p>
          맨 위가 늘 가장 작은 나무 = <strong>힙</strong>. 파이썬에서는 <code>heapq</code> 모듈이 이 일을 해 줍니다.
        </p>
        <p>
          아래 한 줄도 같은 나무입니다. 칸 번호로 읽으면 <strong>부모 = (자식 번호 − 1) // 2</strong> 입니다.
        </p>
        <Counter
          rows={[
            { label: "올 때마다 전부 다시 줄 세우기", n: resortOne, unit: "번" },
            { label: "힙에 앉히고 올리기 (많아야)", n: heapOne, unit: "번" },
          ]}
          caption={`환자 한 명이 올 때의 횟수. ${BIG.toLocaleString("ko-KR")}명이 차례로 오면 다시 줄 세우기는 ${resortAllTime}, 힙은 ${heapAllTime}입니다.`}
        />
      </HeapReveal>

      {/* ③ 조건 짚기 */}
      <h2>왜 맨 위만 믿을 수 있을까</h2>
      <ul className="algo-keys">
        <li>
          <b>규칙은 하나</b> — 위 칸은 바로 아래 두 칸보다 늘 같거나 급하다
        </li>
        <li>
          <b>줄 세운 게 아니다</b> — 새 환자를 올린 뒤 배열은 <code>{`[${after.join(", ")}]`}</code> 입니다. 앞에서부터 읽으면 작은 순서가 아닙니다. 믿을 수 있는 건 맨 앞 칸뿐입니다
        </li>
        <li>
          <b>부모가 더 급하면 멈춘다</b> — 새 환자가 4였다면 부모 3이 더 급해서 첫 비교에서 바로 멈춥니다
        </li>
      </ul>
      <p className="algo-chain">
        {`${josa(popped.min, "을", "를")} 부르면`}
        <span>
          맨 끝 환자 {josa(after[after.length - 1], "이", "가")} 빈 맨 위에 앉고, 아래 두 자식 중 더 급한 쪽과 바꾸며 내려갑니다. 결과는{" "}
          <code>{`[${popped.heap.join(", ")}]`}</code> 입니다.
        </span>
      </p>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 부모와 견주며 올라가는 반복문이다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기세요. 새 환자가 앉은 자리에서 부모와 견주고, 급하면 바꿔 올라갑니다.
      </p>

      <HeapPlayer tape={tape} pause={pause} title="새 환자가 부모와 견주며 올라가는 모습" />

      <ul className="algo-keys">
        <li>
          <b>
            <code>p = (i - 1) // 2</code>
          </b>{" "}
          — 부모 자리 번호
        </li>
        <li>
          <b>
            <code>if heap[p] &lt;= heap[i]: break</code>
          </b>{" "}
          — 부모가 같거나 더 급하면 멈춘다
        </li>
        <li>
          <b>
            <code>heap[p], heap[i] = heap[i], heap[p]</code>
          </b>{" "}
          — 부모와 자리를 바꾼다
        </li>
        <li>
          <b>
            <code>i = p</code>
          </b>{" "}
          — 올라간 자리에서 다시 견준다
        </li>
      </ul>
      <p>
        파이썬에서는 이 반복문을 직접 쓰지 않습니다. <code>heapq.heappush(heap, x)</code> 한 줄이 같은 일을 합니다.
      </p>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            새 환자가 <b>4</b> 였다면 맨 아래 빈자리에서 몇 번 올라갈까요?
          </>
        }
        options={[
          { label: "1번 올라간다" },
          { label: `2번 올라간다 — 새 환자 ${NEWCOMER} 일 때처럼` },
          { label: `올라가지 않는다 — 부모 ${josa(WARD[2], "이", "가")} 더 급하다`, correct: true },
        ]}
        why={
          <>
            4의 부모는 {WARD[2]}입니다. {josa(WARD[2], "이", "가")} 더 급해서({WARD[2]} ≤ 4) 6번 줄에서 바로 <code>break</code> 합니다. 2번 올라가는 건 {josa(NEWCOMER, "이", "가")}
            앉았을 때입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>heapq 에서 헷갈리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>가장 작은 것이 먼저다</b> — <code>heapq</code> 는 최소 힙이다. 큰 것부터 꺼내려면 <code>-x</code> 로 넣고 꺼낸 뒤 다시 <code>-</code> 를 붙인다
        </li>
        <li>
          <b>리스트는 정렬이 아니다</b> — 5, 3, 8, 1을 차례로 넣으면 <code>[1, 3, 8, 5]</code> 다. 맨 앞 <code>heap[0]</code> 만 가장 작다
        </li>
        <li>
          <b>급한 정도와 이름을 같이</b> — <code>{`heappush(h, (2, "복통"))`}</code> 처럼 튜플로 넣는다. 앞 숫자가 같으면 뒤 값끼리 견주는데, 견줄 수 없는 값이면 <code>TypeError</code> 가 난다
        </li>
        <li>
          <b>한 번에 만들 때</b> — 이미 있는 리스트는 <code>heapify(arr)</code> 한 번으로 N 에 비례해 만든다. 하나씩 넣으면 N log N 이다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>매번 가장 작은(큰) 것</b>
        <b>K번째로 큰 수</b>
        <b>다익스트라 · 작업 스케줄</b>
      </div>
      <p className="algo-next">다음 장에서는 옆 칸끼리 바꿔 가며 줄을 세우는 버블 정렬을 봅니다.</p>
    </main>
  );
}
