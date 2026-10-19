import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { LinePlayer } from "@/components/algo/LinePlayer";
import { QueueReveal } from "@/components/algo/QueueReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { lineTape, serveOrder, secondServeStep, LINE_START, LINE_EVENTS } from "@/lib/algo/queue-deque";
import { pairCount } from "@/lib/algo/big-o";

const BIG = 100_000;

export const metadata: Metadata = {
  title: "큐와 덱",
  description: "줄을 서면 앞사람부터",
};

const arrow = (a: number[]) => a.join(" → ");

export default async function QueueDequePage() {
  const tape = await highlightTape(lineTape(LINE_START, LINE_EVENTS));
  const askAt = secondServeStep(tape);
  const fifo = serveOrder(LINE_START, LINE_EVENTS, "queue");
  const backBack = serveOrder(LINE_START, LINE_EVENTS, "backBack");
  const frontFront = serveOrder(LINE_START, LINE_EVENTS, "frontFront");

  return (
    <main className="algo-page">
      <p className="algo-crumb">자료구조</p>
      <h1 className="algo-title">큐와 덱</h1>
      <p className="algo-lede">줄을 서면 앞사람부터</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <QueueReveal>
        <ul className="algo-keys">
          <li>
            <b>먼저 들어온 게 먼저 나가는 줄</b> = <strong>큐(queue)</strong>
          </li>
          <li>
            <b>앞에도 뒤에도 서고, 앞에서도 뒤에서도 나갈 수 있는 줄</b> = <strong>덱(deque)</strong>
          </li>
        </ul>
        <p>파이썬에서는 둘 다 <code>deque</code> 하나로 만듭니다.</p>
      </QueueReveal>

      {/* ③ 조건 짚기 */}
      <h2>줄은 양 끝에서만 바뀐다</h2>
      <ul className="algo-keys">
        <li>
          <b>서는 곳</b> — 맨 뒤. 새 손님은 앞사람을 밀어내지 못한다
        </li>
        <li>
          <b>받는 곳</b> — 맨 앞. 그래서 먼저 선 사람이 먼저 받는다
        </li>
        <li>
          <b>선생님과 종</b> — 앞에 서기와 뒤에서 나가기는 처음 두 버튼에 없었다. 양쪽 끝을 모두 쓰면 덱
        </li>
        <li>
          <b>가운데</b> — 아무도 건드리지 않는다. 일은 늘 양쪽 끝에서만 생긴다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 양 끝에서 넣고 빼는 두 줄이 전부다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 맨 뒤에 서고 맨 앞에서 나가는 걸 보세요. 위 ① 의 앞 여섯 가지 일과 같습니다.
      </p>

      <LinePlayer
        tape={tape}
        title="줄에서 맨 앞 사람이 나가고 새 손님이 맨 뒤에 서는 모습"
        pause={{
          at: askAt,
          ask: "줄은 2 · 3 · 4 · 5 · 6 · 7 · 8 · 9 번입니다. 다음 받기에서 나가는 사람은 누구일까요?",
          options: [{ label: "9번 — 방금 선 사람" }, { label: "3번" }, { label: "2번 — 맨 앞 사람", correct: true }],
          why: (
            <>
              받는 곳은 <strong>맨 앞</strong>입니다. 방금 선 9번은 맨 뒤라 가장 나중에 나갑니다.
            </>
          ),
        }}
      />

      <ul className="algo-keys">
        <li>
          <b>
            <code>q.popleft()</code>
          </b>{" "}
          — 맨 앞 사람이 나간다. 남은 사람은 움직이지 않는다
        </li>
        <li>
          <b>
            <code>q.append(e)</code>
          </b>{" "}
          — 맨 뒤에 선다
        </li>
        <li>
          <b>
            <code>deque(line)</code>
          </b>{" "}
          — 줄 서 있던 리스트를 deque 로 바꾼다. 파일 맨 위에 <code>from collections import deque</code>
        </li>
      </ul>

      <p>
        같은 줄을 리스트로 만들고 <code>pop(0)</code> 으로 받으면 어떻게 될까요? 맨 앞이 비면 남은 사람을 한 칸씩 당겨야
        합니다. 플레이어 아래의 당긴 칸 숫자가 그만큼입니다.
      </p>
      <Counter
        rows={[
          { label: `리스트 pop(0) · ${BIG.toLocaleString("ko-KR")}명`, n: Math.round(pairCount(BIG)), unit: "칸" },
          { label: `deque popleft · ${BIG.toLocaleString("ko-KR")}명`, n: 0, unit: "칸" },
        ]}
        caption="10만 명을 모두 받을 때 옮기는 칸 수. 이 컴퓨터에서 직접 재 보니 리스트 약 0.6초, deque 약 0.003초였습니다."
      />

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            1번부터 8번까지 선 줄에서 <code>[받기, 9번 도착, 받기, 받기, 10번 도착, 받기]</code> 를 하면 받는 순서는?
          </>
        }
        options={[
          { label: arrow(backBack) },
          { label: arrow(frontFront) },
          { label: arrow(fifo), correct: true },
        ]}
        why={
          <>
            서는 곳은 맨 뒤, 받는 곳은 맨 앞이라 앞에서부터 차례로 <strong>{arrow(fifo)}</strong> 입니다. 뒤에 서고 뒤에서 받으면{" "}
            {arrow(backBack)}, 앞에 서고 앞에서 받으면 {arrow(frontFront)} 순서입니다. 둘 다 나중에 선 사람이 먼저 받는 줄입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>한 줄이어도 느리거나 터지는 자리가 있다</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>list.pop(0)</code>
          </b>{" "}
          — 맨 앞을 빼면 나머지를 한 칸씩 당긴다. 10만 개를 모두 빼 보니 리스트 약 0.6초, <code>popleft()</code> 약 0.003초
        </li>
        <li>
          <b>
            <code>q[i]</code> 로 가운데 읽기
          </b>{" "}
          — deque 는 양쪽 끝만 빠르다. 10만 개의 가운데 칸을 2천 번 읽어 보니 리스트 약 0.0001초, deque 약 0.0075초
        </li>
        <li>
          <b>빈 줄에서 받기</b> — <code>IndexError: pop from an empty deque</code> 가 난다. <code>if q:</code> 로 먼저 확인한다
        </li>
        <li>
          <b>
            <code>deque(maxlen=3)</code>
          </b>{" "}
          — 가득 찬 줄에 넣으면 반대쪽 사람이 사라진다. <code>deque([1, 2, 3], maxlen=3)</code> 에 <code>append(4)</code> 하면{" "}
          <code>deque([2, 3, 4])</code>
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>먼저 온 순서</b>
        <b>BFS</b>
        <b>양쪽 끝에서 넣고 뺀다</b>
      </div>
      <p>격자 BFS 도 이 줄로 돕니다. 가까운 칸부터 차례로 꺼내야 하니 먼저 넣은 칸이 먼저 나옵니다.</p>
      <p className="algo-next">다음 장에서는 사물함을 번호 대신 이름으로 찾는 해시를 봅니다.</p>
    </main>
  );
}
