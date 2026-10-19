import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { GridPlayer } from "@/components/algo/GridPlayer";
import { DfsReveal } from "@/components/algo/DfsReveal";
import { Quiz } from "@/components/algo/Quiz";
import {
  dfsGridTape,
  dfsDist,
  noMarkPops,
  pauseStepIndex,
  demoBranches,
  DEMO_GRID,
  DEMO_START,
  DEMO_GOAL,
} from "@/lib/algo/dfs";
import { shortestSteps } from "@/lib/algo/bfs-grid";

const GRID = DEMO_GRID;
const COLS = GRID[0].length;
const START = DEMO_START;
const GOAL = DEMO_GOAL;
const BRANCH = demoBranches();
const LABELS = {
  [START[0] * COLS + START[1]]: "시작",
  [GOAL[0] * COLS + GOAL[1]]: "도착",
  [BRANCH.junction.cell[0] * COLS + BRANCH.junction.cell[1]]: "★",
};

export const metadata: Metadata = {
  title: "DFS",
  description: "막다른 길까지 가 보기",
};

export default async function DfsPage() {
  const raw = dfsGridTape(GRID, START, GOAL);
  const tape = await highlightTape(raw);
  const best = shortestSteps(GRID, START, GOAL);
  const dfs = dfsDist(GRID, START, GOAL);
  const reversed = dfsDist(GRID, START, GOAL, "reversed");
  const pops = raw.steps.filter((s) => s.line === 6).length;
  const pauseAt = pauseStepIndex(raw);
  const stuck = noMarkPops(GRID, START, GOAL, 1000);

  // ⑤ 아래 길의 (2,1) 칸을 벽으로 막은 같은 미로
  const walled = GRID.map((row) => [...row]);
  walled[2][1] = 1;
  const walledDfs = dfsDist(walled, START, GOAL);

  return (
    <main className="algo-page">
      <p className="algo-crumb">그래프 탐색</p>
      <h1 className="algo-title">DFS</h1>
      <p className="algo-lede">막다른 길까지 가 보기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        왼쪽 위 <strong>시작</strong> 칸에서 오른쪽 아래 <strong>도착</strong> 칸까지 미로를 걸어 보세요. 옆 칸을 눌러 한 칸씩
        갑니다. <strong>막다른 길에서는 되돌아가기</strong>를 눌러 지나온 길로 돌아옵니다.
      </p>

      <DfsReveal>
        <p>
          갈림길에서 한 길을 골라 막다른 길이나 도착이 나올 때까지 끝까지 가 보고, 막히면 돌아와 다음 길로 가는 방법 ={" "}
          <strong>깊이 우선 탐색(DFS, Depth-First Search)</strong>
        </p>
        <ul className="algo-keys">
          <li>
            <b>오른쪽 길</b> — 위로 돌아서 {BRANCH.rightSteps}걸음에 도착한다
          </li>
          <li>
            <b>아래 길</b> — 곧장 {BRANCH.otherSteps}걸음에 도착한다
          </li>
          <li>
            <b>돌아올 길을 기억하는 곳</b> — 나중에 넣은 것이 먼저 나오는 더미, 스택이다. 함수가 자기를 부르는 재귀도 같은
            일을 한다
          </li>
        </ul>
        <p>
          같은 미로에서 가까운 칸부터 퍼지는 BFS 는 <strong>{best}걸음</strong> 최단을 찾습니다. 한 길을 끝까지 가는 DFS 는
          오른쪽 길로 가서 <strong>{dfs}걸음</strong>에 닿습니다.
        </p>
      </DfsReveal>

      {/* ③ 조건 짚기 */}
      <h2>지나온 칸에 표시하지 않으면 같은 곳을 맴돈다</h2>
      <ul className="algo-keys">
        <li>
          <b>이미 온 칸은 못 들어간다</b> — 미로에서 눌러 보면 막히던 규칙이다
        </li>
        <li>
          <b>표시가 없으면</b> — 같은 칸을 몇 번이고 다시 넣는다. 아래 코드의 <code>dist</code> 가 그 표시다
        </li>
        <li>
          <b>그래서</b> — 표시를 뺀 코드는 이 미로에서 {stuck.pops.toLocaleString("ko-KR")}번을 꺼내도 도착 칸에 닿지
          못했다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>스택이 되돌아올 길을 기억한다</h2>
      <p>
        스택 = 나중에 넣은 게 먼저 나오는 더미. 위에서 걸은 것과 <strong>같은 미로</strong>입니다. 격자 BFS 코드에서{" "}
        <code>popleft()</code> 를 <code>pop()</code> 으로 바꾼 코드입니다.
      </p>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 스택 <strong>맨 위</strong>(오른쪽 끝)가 먼저 나오는 걸 보세요. 숫자는 그 칸까지의
        걸음 수입니다.
      </p>

      <GridPlayer
        tape={tape}
        cols={COLS}
        labels={LABELS}
        lane="stack"
        title="DFS 가 막다른 길까지 파고드는 모습"
        pause={
          pauseAt > 0
            ? {
                at: pauseAt,
                ask: "★ 갈림길에서 두 칸을 쌓았습니다. 다음에 꺼낼 칸은 어느 쪽일까요?",
                options: [
                  { label: "먼저 쌓은 아래 칸" },
                  { label: "둘 중 아무 칸이나" },
                  { label: "마지막에 쌓은 오른쪽 칸", correct: true },
                ],
                why: (
                  <>
                    스택은 <strong>맨 위부터</strong> 꺼냅니다. 오른쪽 칸을 마지막에 쌓았으니 그 칸이 먼저 나옵니다. 아래 칸은
                    스택 바닥에서 기다립니다.
                  </>
                ),
              }
            : undefined
        }
      />

      <ul className="algo-keys">
        <li>
          <b>
            <code>pop()</code>
          </b>{" "}
          — 스택 맨 위, 가장 나중에 넣은 칸을 꺼낸다. 막다른 길이면 그 아래 칸이 맨 위가 되어 <strong>되돌아온 것</strong>이다
        </li>
        <li>
          <b>
            <code>stack.append</code>
          </b>{" "}
          — 이웃을 쌓는다. 마지막에 쌓은 칸이 가장 먼저 나온다
        </li>
        <li>
          <b>
            <code>not in dist</code>
          </b>{" "}
          — 이미 넣은 칸은 다시 쌓지 않는다
        </li>
      </ul>
      <p>
        이 미로에서는 아래 줄 끝의 막다른 칸까지 파고든 뒤에야 도착 칸이 나옵니다. 꺼낸 횟수는 {pops}번입니다.
      </p>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={`아래 길의 한 칸을 벽으로 막으면, 같은 코드가 도착까지 낸 걸음 수는 몇 걸음일까요?`}
        options={[
          { label: `${best}걸음 — 막아도 처음 BFS 걸음 수 그대로다` },
          { label: `${walledDfs + 2}걸음 — 더 돌아가서 멀어진다` },
          { label: `${walledDfs}걸음 — 길이 하나뿐이라 BFS 와 같다`, correct: true },
        ]}
        why={
          <>
            길이 하나뿐이면 어떤 순서로 가도 같은 길입니다. 그래서 DFS 도 BFS 와 같은 <strong>{walledDfs}걸음</strong>이 나옵니다.
            길이 둘 이상일 때만 DFS 가 더 먼 길로 갈 수 있습니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>DFS 에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>방문 표시를 빼면</b> — 이미 온 칸을 계속 다시 쌓아 끝나지 않는다. 위 미로에서 {stuck.pops.toLocaleString("ko-KR")}
          번을 꺼내도 도착하지 못했다
        </li>
        <li>
          <b>재귀로 쓰면</b> — 길이 길수록 깊이가 칸 수만큼 는다. 파이썬 기본 한도는 1000이라 벽 없는 32×32 격자(1,024칸)에서{" "}
          <code>RecursionError</code> 가 난다. 31×31 은 된다
        </li>
        <li>
          <b>최단 거리를 보장하지 않는다</b> — 같은 미로에서 BFS 는 {best}걸음, 이 코드는 {dfs}걸음이다
        </li>
        <li>
          <b>이웃 쌓는 순서</b> — 순서를 거꾸로 바꾸면 같은 미로에서 {dfs}걸음이 {reversed}걸음으로 바뀐다. 길이 둘이면 먼저 가는
          쪽이 결과를 정한다
        </li>
      </ul>
      <p>그래서 최단 거리가 필요하면 BFS 를, 길을 끝까지 다 살펴야 하면 DFS 를 씁니다.</p>

      {/* ⑦ 신호 */}
      <h2>DFS 를 꺼내라는 세 가지 신호</h2>
      <div className="algo-signals">
        <b>모든 경로를 찾는다</b>
        <b>도달할 수 있는가</b>
        <b>한 덩어리로 이어진 곳을 찾는다</b>
      </div>
      <p className="algo-next">다음 장에서는 이어진 덩어리가 몇 개인지 세는 연결 요소를 봅니다.</p>
    </main>
  );
}
