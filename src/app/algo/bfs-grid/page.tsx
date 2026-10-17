import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { GridPlayer } from "@/components/algo/GridPlayer";
import { SpreadReveal } from "@/components/algo/SpreadReveal";
import { Quiz } from "@/components/algo/Quiz";
import { bfsGridTape, shortestSteps, type Cell } from "@/lib/algo/bfs-grid";

// 0 = 길, 1 = 벽
const GRID = [
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0],
];
const COLS = GRID[0].length;
const START: Cell = [0, 0];
const GOAL: Cell = [3, 4];
const LABELS = { 0: "시작", [GOAL[0] * COLS + GOAL[1]]: "도착" };

export const metadata: Metadata = {
  title: "격자 BFS",
  description: "소문은 어떻게 퍼질까",
};

export default async function BfsGridPage() {
  const tape = await highlightTape(bfsGridTape(GRID, START, GOAL));
  const best = shortestSteps(GRID, START, GOAL);

  return (
    <main className="algo-page">
      <p className="algo-crumb">그래프 탐색</p>
      <h1 className="algo-title">격자 BFS</h1>
      <p className="algo-lede">소문은 어떻게 퍼질까</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        왼쪽 위에서 소문이 시작됩니다. 칸을 눌러 벽을 놓고,{" "}
        <strong>한 걸음씩 퍼뜨려</strong> 보세요.
      </p>

      <SpreadReveal>
        <p>
          겹이 하나씩 넓어지니 <strong>먼저 물든 칸이 더 가까운 칸</strong>입니다. 어느 칸에
          처음 닿은 걸음 수가 곧 최단 거리입니다.
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
          <b>깨지는 경우</b> — 길마다 걸리는 시간이 다르면 안 맞는다. 그때는 다익스트라다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>큐가 겹을 만든다</h2>
      <p>
        ▶로 한 칸씩 넘기며 <strong>큐에 쌓이는 순서</strong>를 보세요. 아래 숫자가 그 칸까지의
        걸음 수입니다.
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
      <Quiz
        question="큐(deque) 대신 스택을 쓰면 어떻게 될까요?"
        options={[
          { label: "최단 거리가 더 빨리 나온다" },
          { label: "한 방향으로 끝까지 파고든다", correct: true },
        ]}
        why={
          <>
            스택은 <strong>마지막에 넣은 것부터</strong> 꺼냅니다. 그래서 한 겹씩 넓어지지 않고 한
            방향으로 막다른 길까지 파고듭니다. 그게 DFS 입니다. 길은 찾지만 그 길이 최단이라는
            보장이 없습니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>격자 BFS 에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>넣을 때 표시하지 않으면</b> — 같은 칸이 큐에 여러 번 들어가 느려지고 거리도 틀린다
        </li>
        <li>
          <b>
            <code>list.pop(0)</code>
          </b>{" "}
          — 파이썬 리스트는 맨 앞을 꺼낼 때마다 전부 당긴다. <code>deque</code> 를 쓴다
        </li>
        <li>
          <b>격자 밖</b> — 범위 검사를 빼먹으면 반대쪽 줄로 넘어간다
        </li>
      </ul>
      <p>
        위 플레이어에서 도착까지 <strong>{best}걸음</strong>입니다. 벽을 돌아가는 길이라 직선
        거리보다 깁니다.
      </p>

      {/* ⑦ 신호 */}
      <h2>BFS 를 꺼내라는 세 가지 신호</h2>
      <div className="algo-signals">
        <b>최단 거리를 묻는다</b>
        <b>한 칸 이동이 전부 똑같다</b>
        <b>격자나 그래프다</b>
      </div>
      <p className="algo-next">
        다음 장에서는 길마다 걸리는 시간이 다를 때 쓰는 다익스트라를 봅니다.
      </p>
    </main>
  );
}
