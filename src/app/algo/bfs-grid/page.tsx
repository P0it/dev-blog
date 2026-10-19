import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { GridPlayer } from "@/components/algo/GridPlayer";
import { SpreadReveal } from "@/components/algo/SpreadReveal";
import { Quiz } from "@/components/algo/Quiz";
import {
  bfsGridTape,
  shortestSteps,
  stackSteps,
  pushCounts,
  openGrid,
  DEMO_GRID,
  DEMO_START,
  DEMO_GOAL,
} from "@/lib/algo/bfs-grid";

const GRID = DEMO_GRID;
const COLS = GRID[0].length;
const START = DEMO_START;
const GOAL = DEMO_GOAL;
const LABELS = { [START[0] * COLS + START[1]]: "시작", [GOAL[0] * COLS + GOAL[1]]: "도착" };

export const metadata: Metadata = {
  title: "격자 BFS",
  description: "소문은 어떻게 퍼질까",
};

export default async function BfsGridPage() {
  const tape = await highlightTape(bfsGridTape(GRID, START, GOAL));
  const best = shortestSteps(GRID, START, GOAL);
  const stack = stackSteps(GRID, START, GOAL);
  const wide = pushCounts(openGrid(30, 30), [0, 0], [29, 29]);

  return (
    <main className="algo-page">
      <p className="algo-crumb">그래프 탐색</p>
      <h1 className="algo-title">격자 BFS</h1>
      <p className="algo-lede">소문은 어떻게 퍼질까</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        왼쪽 위에서 소문이 시작돼 오른쪽 아래 도착 칸까지 퍼집니다. <strong>도착까지 몇 걸음일지 먼저 고르고</strong>,
        한 걸음씩 퍼뜨려 맞혀 보세요.
      </p>

      <SpreadReveal>
        <p>
          겹이 하나씩 넓어지니 <strong>먼저 물든 칸이 더 가까운 칸</strong>입니다. 어느 칸에 처음 닿은 걸음 수가 곧
          최단 거리입니다.
        </p>
        <p>
          이렇게 가까운 곳부터 한 겹씩 넓혀 가는 방법 = <strong>BFS</strong>
        </p>
      </SpreadReveal>

      {/* ③ 조건 짚기 */}
      <h2>BFS 의 최단 거리는 걸음 수가 같을 때만 맞다</h2>
      <ul className="algo-keys">
        <li>
          <b>한 겹 = 한 걸음</b> — 겹이 넓어지는 순서가 곧 가까운 순서다
        </li>
        <li>
          <b>처음 닿았을 때가 최단</b> — 나중에 다시 닿는 길은 반드시 더 멀다
        </li>
        <li>
          <b>깨지는 경우</b> — 길마다 걸리는 시간이 다르면 안 맞는다. 그때는 걸리는 시간이 짧은 길부터 넓히는 방법
          (다익스트라)을 쓴다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>큐가 겹을 만든다</h2>
      <p>
        큐 = 먼저 넣은 게 먼저 나오는 줄. 맛집 대기줄처럼 맨 앞 사람부터 들어갑니다. 위에서 본 것과{" "}
        <strong>같은 격자</strong>입니다.
      </p>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 <strong>큐에 쌓이는 순서</strong>를 보세요. 아래 숫자가 그 칸까지의
        걸음 수이고, 숫자가 같은 칸끼리 한 겹입니다.
      </p>

      <GridPlayer
        tape={tape}
        cols={COLS}
        labels={LABELS}
        title="BFS 가 한 겹씩 번지는 모습"
      />

      <ul className="algo-keys">
        <li>
          <b>
            <code>popleft</code>
          </b>{" "}
          — 큐 맨 앞에서 꺼낸다. 먼저 넣은 칸이 먼저 나온다
        </li>
        <li>
          <b>
            <code>0 &lt;= nr &lt; rows</code>
          </b>{" "}
          — 격자 밖 칸은 건너뛴다
        </li>
        <li>
          <b>
            <code>not in dist</code>
          </b>{" "}
          — 이미 다녀간 칸은 다시 넣지 않는다. 이 줄이 없으면 영원히 돈다
        </li>
        <li>
          <b>
            <code>dist[(r,c)] + 1</code>
          </b>{" "}
          — 이웃은 나보다 딱 한 걸음 멀다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <p>
        스택 = 나중에 넣은 게 먼저 나오는 더미. 접시를 쌓듯 맨 위 것부터 꺼냅니다. 코드에서 <code>popleft()</code>{" "}
        를 <code>pop()</code> 으로 바꾸면 큐가 스택이 됩니다.
      </p>
      <Quiz
        question="큐 대신 스택을 쓰면, 같은 격자에서 도착까지 몇 걸음이 나올까요?"
        options={[
          { label: `${best}걸음 — 큐와 똑같다` },
          { label: `${best - 2}걸음 — 지름길로 간다` },
          { label: `${stack}걸음 — 먼저 파고든 길로 돌아간다`, correct: true },
        ]}
        why={
          <>
            스택은 <strong>마지막에 넣은 칸부터</strong> 꺼냅니다. 그래서 한 겹씩 넓어지지 않고 한 방향으로 막다른
            길까지 파고듭니다. 이 방법 = DFS. 이 격자는 길이 둘이라 먼저 파고든 쪽이 더 멉니다.{" "}
            <strong>{stack}걸음</strong>이 나옵니다. 길이 하나뿐인 격자라면 스택도 {best}걸음처럼 최단이 나와서 구분이 안
            됩니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>격자 BFS 에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>꺼낼 때 표시하면</b> — 같은 칸이 큐에 여러 번 들어간다. 걸음 수는 맞는데 큐가 길어져 느려진다. 벽 없는 30×30
          격자에서 큐에 넣은 횟수가 {wide.early.toLocaleString("ko-KR")}번 → {wide.late.toLocaleString("ko-KR")}번이다
        </li>
        <li>
          <b>
            <code>list.pop(0)</code>
          </b>{" "}
          — 파이썬 리스트는 맨 앞을 꺼낼 때마다 전부 당긴다. <code>deque</code> 를 쓴다
        </li>
        <li>
          <b>격자 밖</b> — 범위 검사를 빼먹으면 파이썬은 <code>grid[-1]</code> 을 마지막 줄로 읽어 반대쪽 줄로 넘어간다.
          끝을 넘는 쪽은 IndexError 다
        </li>
        <li>
          <b>도착할 수 없을 때</b> — 큐가 비면 <code>-1</code> 을 돌려준다. 위에서 벽으로 길을 막았을 때와 같은 경우다
        </li>
      </ul>
      <p>
        위 플레이어에서 도착까지 <strong>{best}걸음</strong>입니다. 가로 4칸 + 세로 3칸 = {best}걸음으로,
        이 격자에는 돌아가지 않고 갈 수 있는 길이 있습니다. 벽이 그 길을 막으면 더 걸립니다.
      </p>

      {/* ⑦ 신호 */}
      <h2>BFS 를 꺼내라는 세 가지 신호</h2>
      <p>그래프 = 점과 선으로 이어진 지도. 칸 하나가 점이고, 이웃 칸으로 가는 길이 선입니다.</p>
      <div className="algo-signals">
        <b>최단 거리를 묻는다</b>
        <b>한 칸 이동이 전부 똑같다</b>
        <b>격자나 그래프다</b>
      </div>
      <p className="algo-next">
        다음 장에서는 막다른 길까지 파고드는 DFS 를 봅니다.
      </p>
    </main>
  );
}
