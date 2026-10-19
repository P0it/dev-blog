import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TrackPlayer } from "@/components/algo/TrackPlayer";
import { LockerReveal } from "@/components/algo/LockerReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { searchTape, SEARCH_ARR, SEARCH_TARGET, SEARCH_MISSING, linearSearch } from "@/lib/algo/linear-search";
import { ops } from "@/lib/algo/big-o";

const BIG = 1_000_000;
const REPEAT = 10_000;
const LOG_STEPS = Math.floor(Math.log2(BIG)) + 1;

export const metadata: Metadata = {
  title: "선형 탐색",
  description: "앞에서부터 하나씩 보면",
};

export default async function LinearSearchPage() {
  const tape = await highlightTape(searchTape(SEARCH_ARR, SEARCH_TARGET));
  const at = linearSearch(SEARCH_ARR, SEARCH_TARGET);

  // 두 번째 칸을 열러 가기 전에 묻는다 — 첫 칸이 아니라는 걸 본 뒤 코드가 어디로 가는지 예측한다
  const pause: PlayerPause = {
    at: 2,
    ask: (
      <>
        0번 칸의 번호표는 {SEARCH_ARR[0]} 입니다. 찾는 번호 {SEARCH_TARGET} 와 다릅니다. 코드는 다음에 어느 줄로 갈까요?
      </>
    ),
    options: [
      { label: "5번 줄 — 못 찾았다고 끝낸다" },
      { label: "3번 줄 — 같은 칸을 다시 본다" },
      { label: "2번 줄 — 다음 칸으로 넘어간다", correct: true },
    ],
    why: (
      <>
        <code>return</code> 은 찾았을 때만 실행됩니다. 다르면 <code>for</code> 가 다음 <code>i</code> 로 넘어갑니다.
      </>
    ),
  };

  return (
    <main className="algo-page">
      <p className="algo-crumb">탐색</p>
      <h1 className="algo-title">선형 탐색</h1>
      <p className="algo-lede">앞에서부터 하나씩 보면</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <LockerReveal>
        <p className="algo-chain">
          0번 칸 → 1번 칸 → … → {at}번 칸
          <span>찾을 때까지 앞에서부터 한 칸씩 열었습니다.</span>
        </p>
        <Counter
          rows={[
            { label: `앞에서부터 하나씩 · ${BIG.toLocaleString("ko-KR")}칸`, n: BIG, unit: "번" },
            { label: `절반씩 버리기 · ${BIG.toLocaleString("ko-KR")}칸`, n: LOG_STEPS, unit: "번" },
          ]}
          caption={`한 번 찾을 때 여는 칸 수(최악). 찾는 일을 ${REPEAT.toLocaleString("ko-KR")}번 되풀이하면 ${(BIG * REPEAT).toLocaleString("ko-KR")}번 대 ${(LOG_STEPS * REPEAT).toLocaleString("ko-KR")}번이 됩니다.`}
        />
        <p>
          앞에서부터 하나씩 열어 보는 방법 = <strong>선형 탐색</strong>
        </p>
        <ul className="algo-keys">
          <li>
            <b>운이 좋으면</b> — 첫 칸에서 끝난다
          </li>
          <li>
            <b>없으면</b> — {SEARCH_ARR.length}칸을 다 열어야 확실하다. 칸이 N개면 N번이고, 이걸 <code>O(N)</code> 이라고 적는다
          </li>
        </ul>
      </LockerReveal>

      {/* ③ 조건 짚기 */}
      <h2>번호표가 섞여 있어도 되는 방법</h2>
      <ul className="algo-keys">
        <li>
          <b>정렬이 필요 없다</b> — 앞 칸부터 열면 섞여 있어도 놓치지 않는다. 건너뛰어 열면 놓칠 수 있다
        </li>
        <li>
          <b>한 번만 찾을 때</b> — 줄을 세우는 데만 {SEARCH_ARR.length}칸에 약 {ops("nlogn", SEARCH_ARR.length)}번이 든다. 그냥 열면 많아야 {SEARCH_ARR.length}번이다
        </li>
        <li>
          <b>여러 번 찾을 때</b> — 한 번 줄을 세워 두면 절반씩 버리는 방법으로 바꿀 만하다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 칸 번호를 하나씩 올리는 반복문이 전부다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 지나간 칸이 쌓이는 걸 보세요. 번호표 {SEARCH_TARGET} 를 찾아 멈춥니다.
      </p>

      <TrackPlayer tape={tape} values={SEARCH_ARR} title="앞 칸부터 하나씩 열며 번호표를 찾는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>i</code>
          </b>{" "}
          — 지금 여는 칸 번호. 0번부터 하나씩 올라간다
        </li>
        <li>
          <b>
            <code>arr[i] == target</code>
          </b>{" "}
          — 칸 안 번호표가 찾는 번호와 같은지 본다. 같으면 바로 <code>i</code> 를 돌려준다
        </li>
        <li>
          <b>
            <code>return -1</code>
          </b>{" "}
          — 끝까지 열어도 없으면 -1 을 돌려준다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="번호표가 [4, 9, 2, 7] 인 사물함에서 7 을 찾습니다. 칸을 몇 번 열까요?"
        options={[
          { label: "1번 — 4 를 찾을 때처럼 첫 칸에서 끝난다" },
          { label: "2번 — 9 를 찾을 때처럼 두 칸에서 끝난다" },
          { label: "4번", correct: true },
        ]}
        why={
          <>
            앞 칸부터 하나씩 열어 7 은 3번 칸에서 나옵니다. 칸 번호는 0부터라서 연 횟수는 4번입니다. 4 를 찾았다면 1번, 9 를 찾았다면 2번에서 끝났을 겁니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>못 찾았는데 에러가 나거나, 한 줄인데 느리다</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>arr.index(x)</code>
          </b>{" "}
          — 없으면 -1 이 아니라 <code>ValueError</code> 가 난다. {SEARCH_MISSING} 을 찾으면 <code>list.index(x): x not in list</code> 로 멈춘다
        </li>
        <li>
          <b>같은 번호가 여럿이면</b> — 첫 칸만 돌려준다. <code>[3, 8, 3]</code> 에서 3 은 0번 칸이다
        </li>
        <li>
          <b>
            <code>x in arr</code>
          </b>{" "}
          — 한 줄이지만 속은 같은 선형 탐색이다. 10만 칸에서 맨 끝 번호를 2천 번 찾으면 리스트는 약 1초, <code>set</code> 은 약 0.00006초가 걸렸다. 컴퓨터마다 다르다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>정렬돼 있지 않다</b>
        <b>한 번만 찾는다</b>
        <b>N 이 작다</b>
      </div>
      <p className="algo-next">다음 장에서는 줄이 정렬돼 있을 때 절반씩 버리며 찾는 이분 탐색을 봅니다.</p>
    </main>
  );
}
