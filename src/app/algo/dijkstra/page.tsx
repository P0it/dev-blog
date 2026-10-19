import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { DijkPlayer } from "@/components/algo/DijkPlayer";
import { DijkReveal } from "@/components/algo/DijkReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import {
  dijkstraTape,
  GRAPH,
  START,
  TARGET,
  handOrder,
  fewestHops,
  fastestPath,
  setWeight,
  shortestTimes,
  runVariant,
} from "@/lib/algo/dijkstra";
import { ops, timeLabel } from "@/lib/algo/big-o";

const ROADS = 100_000;

export const metadata: Metadata = {
  title: "다익스트라",
  description: "길마다 걸리는 시간이 다르면",
};

export default async function DijkstraPage() {
  const tape = await highlightTape(dijkstraTape());

  const order = handOrder();
  const fewest = fewestHops(GRAPH, START, TARGET);
  const fastest = fastestPath(GRAPH, START, TARGET);

  // 두 번째로 큐에서 꺼내기 직전 — 큐에는 (2, A) 와 (5, B) 가 들어 있다
  const popSteps = tape.steps.map((s, i) => (s.line === 6 ? i : -1)).filter((i) => i >= 0);
  const pause: PlayerPause = {
    at: popSteps[1],
    ask: <>누르기 전에 맞혀 보세요. 큐에 (2, A)와 (5, B)가 들어 있습니다. 6번 줄에서 어느 것이 나올까요?</>,
    options: [
      { label: "(2, A) — 거리가 가장 작은 것", correct: true },
      { label: "(5, B) — 먼저 넣은 것" },
      { label: "둘 다 한꺼번에 꺼낸다" },
    ],
    why: (
      <>
        <code>heappop</code> 은 큐에서 <strong>거리가 가장 작은 것</strong>을 꺼냅니다. 넣은 순서와 상관없이 (2, A)가 나오고, A까지 2분이
        확정됩니다.
      </>
    ),
  };

  // ⑤ 확인 문제 — A–B 길이 1분이 아니라 4분이라면
  const changed = setWeight(GRAPH, "A", "B", 4);
  const changedBest = shortestTimes(changed, START)[TARGET];
  const oldPathNew = 2 + 4 + 2 + 1;

  // ⑥ 코드를 바꿔 돌려 본 값(실제 Python 으로도 같은 값을 확인했다)
  const normal = runVariant(GRAPH, START, {});
  const noStale = runVariant(GRAPH, START, { staleCheck: false });
  const nodeFirst = runVariant(GRAPH, START, { nodeFirst: true });
  const zero = runVariant(GRAPH, START, { initZero: true });

  const roadTime = timeLabel(Math.log10(ops("nlogn", ROADS)));

  return (
    <main className="algo-page">
      <p className="algo-crumb">최단경로·MST</p>
      <h1 className="algo-title">다익스트라</h1>
      <p className="algo-lede">길마다 걸리는 시간이 다르면</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <DijkReveal>
        <ul className="algo-keys">
          <li>
            <b>확정하는 순서</b> — 가장 가까운 곳부터 하나씩. {order.map((o) => `${o.name} ${o.time}분`).join(" → ")}
          </li>
          <li>
            <b>고쳐 적기</b> — 확정한 곳에서 이어진 길로 이웃까지 시간을 계산해, 더 짧을 때만 고친다. B는 5분에서 3분으로 줄었다
          </li>
          <li>
            <b>걸음과 시간</b> — 걸음이 가장 적은 길은 {fewest.hops}구간으로 {fewest.paths.map((p) => `${p.time}분`).join("·")}, 가장 빠른 길은{" "}
            {fastest.hops}구간으로 {fastest.time}분
          </li>
        </ul>
        <p>
          가장 가까운 곳부터 확정하고 이웃의 시간을 줄여 가는 방법 = <strong>다익스트라</strong>.
        </p>
        <Counter
          rows={[
            { label: `걸음이 가장 적은 길 (${fewest.paths[0].names.join("→")})`, n: fewest.paths[0].time, unit: "분" },
            { label: `가장 빠른 길 (${fastest.names.join("→")})`, n: fastest.time, unit: "분" },
          ]}
          caption="같은 지도, 같은 출발지와 도착지입니다. 걸음 수만 세는 방법은 이 길을 놓칩니다."
        />
        <p>
          격자 BFS 는 걸음 수가 같은 칸을 한 겹으로 봤습니다. 길마다 시간이 다르면 걸음이 적은 길이 가장 빠른 길이 아닙니다.
        </p>
      </DijkReveal>

      {/* ③ 조건 짚기 */}
      <h2>시간이 0 이상이어야 확정을 믿을 수 있다</h2>
      <ul className="algo-keys">
        <li>
          <b>확정한 곳은 끝</b> — 가장 가까운 곳이라, 다른 곳을 거쳐 오는 길이 더 짧을 수 없다. 길이 모두 0분 이상이기 때문이다
        </li>
        <li>
          <b>음수 시간이 있으면</b> — S→A 1분, S→B 2분, B→A −3분이면 A는 1분에 확정했는데 실제로는 −1분이다
        </li>
        <li>
          <b>① 에서 먼 곳을 못 누른 이유</b> — 더 가까운 곳이 남아 있으면 그곳을 거쳐 더 짧게 오는 길이 있을 수 있다
        </li>
        <li>
          <b>걸리는 일</b> — 길마다 큐에 한 번 넣고 꺼내니 많아야 길 수 × log. 길이 {ROADS.toLocaleString("ko-KR")}개면 약{" "}
          {ops("nlogn", ROADS).toLocaleString("ko-KR")}번, {roadTime}에 끝난다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 큐에서 가장 작은 거리를 꺼내는 반복이다</h2>
      <p>
        코드 위에 <code>import heapq</code> 한 줄이 있다고 보세요. <strong>다음</strong>을 눌러 한 줄씩 넘기며 거리표와 큐가 바뀌는 걸 보세요.
      </p>

      <DijkPlayer tape={tape} pause={pause} title="다익스트라가 지도에서 가장 빠른 시간을 찾는 모습" />

      <p>
        {tape.steps.length}스텝입니다. <code>while</code>·<code>for</code> 머리줄(5·9번)과 낡은 항목을 거르는 7번 줄은 건너뛰고, 낡은 항목이
        나올 때만 8번 줄이 켜집니다.
      </p>
      <ul className="algo-keys">
        <li>
          <b>
            <code>heapq.heappop(heap)</code>
          </b>{" "}
          — 큐에서 거리가 가장 작은 (거리, 곳)을 꺼낸다
        </li>
        <li>
          <b>
            <code>if d &gt; dist[u]: continue</code>
          </b>{" "}
          — 지금 기록보다 큰 낡은 항목은 건너뛴다
        </li>
        <li>
          <b>
            <code>if d + w &lt; dist[v]</code>
          </b>{" "}
          — 더 짧을 때만 고쳐 적고 큐에 넣는다
        </li>
        <li>
          <b>
            <code>(d + w, v)</code>
          </b>{" "}
          — 큐에는 거리를 앞에 둔다. 그래야 가장 가까운 곳부터 나온다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            A–B 길이 1분이 아니라 <b>4분</b>이라면, {START}에서 {TARGET}까지 가장 빠른 시간은 몇 분일까요?
          </>
        }
        options={[
          { label: `${fastest.time}분 — 길이 늘어도 예전 길 그대로` },
          { label: `${oldPathNew}분 — 예전 길(${fastest.names.join("→")})을 4분으로 다시 계산` },
          { label: `${changedBest}분 — S→B→D→E 로 길이 바뀐다`, correct: true },
        ]}
        why={
          <>
            예전 길은 2 + 4 + 2 + 1 = {oldPathNew}분이 됩니다. S→B 5분 + B→D 2분 + D→E 1분 = {changedBest}분이 더 빠릅니다. 길 하나의 시간이 바뀌면 가장
            빠른 길도 바뀝니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>다익스트라에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>if d &gt; dist[u]: continue</code> 를 빼면
          </b>{" "}
          — 답은 같지만 낡은 항목의 이웃까지 다시 본다. 이 지도에서 길 확인이 {normal.checks}번에서 {noStale.checks}번으로 늘어난다
        </li>
        <li>
          <b>거리를 0 으로 시작하면</b> — 어떤 길도 &ldquo;더 짧다&rdquo;로 보이지 않아 아무것도 고쳐지지 않는다. 결과가 모두 {zero.dist.E}분이다. 처음 값은{" "}
          <code>float(&apos;inf&apos;)</code>
        </li>
        <li>
          <b>
            큐에 <code>(v, d + w)</code> 순서로 넣으면
          </b>{" "}
          — 곳 이름순으로 꺼내져 &ldquo;가까운 곳 먼저&rdquo;가 깨진다. 답은 같지만 이 지도에서 {nodeFirst.pops}번 꺼내고 {nodeFirst.updates}번 고쳐 적는다(제대로면{" "}
          {normal.pops}번·{normal.updates}번)
        </li>
        <li>
          <b>음수 길이는</b> — 이 코드는 낡은 값을 고쳐 다시 큐에 넣어서 음수 길이 한두 개는 답을 맞게 낸다. 하지만 음수로 도는 순환이 있으면 끝나지 않는다.
          실제로 2,000번 꺼내도 거리가 계속 줄었다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>길마다 걸리는 시간·비용이 다르다</b>
        <b>최단 거리·최소 비용</b>
        <b>지도·네트워크</b>
      </div>
      <p className="algo-next">다음 장에서는 같은 계산을 두 번 하지 않는 메모이제이션을 봅니다.</p>
    </main>
  );
}
