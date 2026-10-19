import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { IslandPlayer } from "@/components/algo/IslandPlayer";
import { IslandReveal } from "@/components/algo/IslandReveal";
import { Quiz } from "@/components/algo/Quiz";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { islandTape, firstSeenScanIndex, countIslands, ISLAND_GRID } from "@/lib/algo/connected-components";

const FOUR = countIslands(ISLAND_GRID);
const EIGHT = countIslands(ISLAND_GRID, true);

export const metadata: Metadata = {
  title: "연결 요소",
  description: "섬이 몇 개인지 세기",
};

export default async function ConnectedComponentsPage() {
  const raw = islandTape(ISLAND_GRID);
  const tape = await highlightTape(raw);

  // 이미 센 땅을 처음 훑는 스텝 앞에서 묻는다 — 섬 하나를 다 칠한 뒤 그 섬의 다른 칸을 만나는 자리다
  const at = firstSeenScanIndex(raw);
  const there = raw.steps[at];
  const pause: PlayerPause = {
    at,
    ask: (
      <>
        다음에 훑는 ({there.vars.r}, {there.vars.c}) 칸도 땅입니다. 그런데 이미 칠한 칸입니다. count 는 어떻게 될까요?
      </>
    ),
    options: [
      { label: "2가 된다 — 땅을 만났으니까" },
      { label: "0으로 돌아간다 — 새로 세니까" },
      { label: "1 그대로 — 이미 센 땅이라서", correct: true },
    ],
    why: (
      <>
        9번 줄 조건에 <code>(r, c) not in seen</code> 이 있어서, 이미 센 땅은 그냥 지나갑니다. <code>count += 1</code> 은
        실행되지 않습니다.
      </>
    ),
  };

  return (
    <main className="algo-page">
      <p className="algo-crumb">그래프 탐색</p>
      <h1 className="algo-title">연결 요소</h1>
      <p className="algo-lede">섬이 몇 개인지 세기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        노란 칸은 땅이고 빈 칸은 바다입니다. 땅이 이어진 덩어리가 섬이에요. <strong>섬이 몇 개일지 먼저 고르고</strong>{" "}
        땅을 눌러 섬을 하나씩 칠하며 세어 보세요.
      </p>

      <IslandReveal>
        <ul className="algo-keys">
          <li>
            <b>한 번 번지기 시작하면</b> — 이어진 땅이 모두 칠해졌다
          </li>
          <li>
            <b>섬 수</b> — 번지기를 새로 시작한 횟수와 같다
          </li>
        </ul>
        <p>
          한 덩어리로 이어진 칸 묶음 = <strong>연결 요소(connected component)</strong>
        </p>
        <p>
          번지는 일은 앞에서 본 BFS(가까운 칸부터 한 겹씩)나 DFS(막다른 길까지 파고들기)가 합니다. 이 페이지 코드는 큐로
          번지는 BFS 를 씁니다.
        </p>
      </IslandReveal>

      {/* ③ 조건 짚기 */}
      <h2>이어졌다는 건 위·아래·왼쪽·오른쪽이다</h2>
      <ul className="algo-keys">
        <li>
          <b>방금 겪은 대각선</b> — 대각선으로만 닿은 땅은 번지지 않았다. 그래서 다른 섬이다. 대각선까지 이으면 이 지도는 {EIGHT}개가 된다
        </li>
        <li>
          <b>센 땅은 표시해 둔다</b> — 칠한 땅을 또 만나도 세지 않아야 한다. 표시가 없으면 같은 섬을 두 번 센다
        </li>
        <li>
          <b>칸마다 한 번씩만 본다</b> — 칸이 N개면 N에 비례한다. 100만 칸 지도도 직접 재 보니 1초쯤 걸렸다(Python 3.14, 컴퓨터마다 다르다)
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 땅을 만날 때마다 번지기를 한 번 시작한다</h2>
      <p>
        큐 = 먼저 넣은 게 먼저 나오는 줄. 위에서 번진 것과 <strong>같은 지도</strong>입니다. (r, c) 는 위에서 r번째 줄,
        왼쪽에서 c번째 칸이고 0부터 셉니다.
      </p>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 칠해지는 칸과 큐를 보세요. 바다 칸은 줄을 올리지 않고 땅인 칸만
        보여 줍니다.
      </p>

      <IslandPlayer tape={tape} title="칸을 훑으며 섬을 세는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>seen</code>
          </b>{" "}
          — 이미 센 칸 모음. 칠하는 칸마다 여기에 넣는다
        </li>
        <li>
          <b>
            <code>count += 1</code>
          </b>{" "}
          — 안 센 땅을 만났을 때만 오른다. 새 섬이라는 뜻이다
        </li>
        <li>
          <b>
            <code>while q:</code>
          </b>{" "}
          — 큐가 빌 때까지 이웃 땅을 칠하며 번진다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="대각선으로 닿은 땅도 이어진 것으로 세면(8방향) 이 지도의 섬은 몇 개일까요?"
        options={[
          { label: `${FOUR}개 — 대각선은 상관없다` },
          { label: `${FOUR + 1}개 — 섬이 쪼개진다` },
          { label: `${EIGHT}개`, correct: true },
        ]}
        why={
          <>
            가운데 섬의 (2, 2) 칸과 아래 섬의 (3, 1) 칸이 대각선으로 닿습니다. 그러면 두 섬이 한 덩어리가 되어 {EIGHT}
            개입니다. 4방향이냐 8방향이냐로 섬 수가 달라지니, 문제에서 이어졌다는 말이 어디까지인지 먼저 읽습니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>섬 세기에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>seen.add((nr, nc))</code> 를 지우면
          </b>{" "}
          — 큐가 끝나지 않는다. 두 칸이 서로를 번갈아 큐에 넣는다. 1000번을 꺼내도 계속 돌았다
        </li>
        <li>
          <b>
            바깥 <code>not in seen</code> 을 지우면
          </b>{" "}
          — 같은 섬의 칸마다 count 가 올라서 3이 아니라 8이 나온다
        </li>
        <li>
          <b>경계 검사를 지우면</b> — 통째로 지우면 <code>IndexError: list index out of range</code> 가 난다.{" "}
          <code>0 &lt;=</code> 만 지우면 에러가 안 나서 더 위험하다. 음수 인덱스는 맨 뒤 칸을 읽고(<code>grid[-1]</code> 은 맨 아래 줄), 이 지도에서는 우연히 답이 같았다
        </li>
        <li>
          <b>재귀로 번지면</b> — 100×100 지도가 전부 땅이면 <code>RecursionError: maximum recursion depth exceeded</code> 가 난다. 같은 지도를 큐로 번지면 섬 1개로 끝난다
        </li>
        <li>
          <b>대각선까지 이으려면</b> — 이웃 방향 4개를 8개로 늘린다. 이 지도는 {EIGHT}개가 된다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>덩어리가 몇 개인가</b>
        <b>섬·영역</b>
        <b>서로 이어진 것끼리 묶는다</b>
      </div>
      <p className="algo-next">다음 장에서는 길마다 걸리는 시간이 다를 때의 최단 거리, 다익스트라를 봅니다.</p>
    </main>
  );
}
