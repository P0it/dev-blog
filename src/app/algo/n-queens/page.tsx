import type { Metadata } from "next";
import Link from "next/link";
import { highlightTape } from "@/lib/algo/highlight";
import { QueenPlayer } from "@/components/algo/QueenPlayer";
import { QueenReveal } from "@/components/algo/QueenReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { timeLabel } from "@/lib/algo/big-o";
import {
  QUEEN_N,
  queensTape,
  firstEmptyScanIndex,
  countPlacements,
  countSolutions,
  choose,
} from "@/lib/algo/n-queens";

const ALL4 = choose(16, 4);
const FIRST4 = countPlacements(QUEEN_N, true);
const ALL8 = choose(64, 8);
const BT8_ALL = countPlacements(8, false);
const BT8_FIRST = countPlacements(8, true);
const SOLUTIONS = Object.fromEntries([1, 2, 3, 4, 8].map((n) => [n, countSolutions(n)]));

export const metadata: Metadata = {
  title: "N-퀸",
  description: "서로 못 보게 놓기",
};

export default async function NQueensPage() {
  const raw = queensTape(QUEEN_N);
  const tape = await highlightTape(raw);

  // 놓을 수 있는 칸이 하나도 없는 줄에 처음 들어오는 스텝 앞에서 묻는다 — 줄 0 칸 0, 줄 1 칸 2 를 놓은 직후다
  const at = firstEmptyScanIndex(raw);
  const pause: PlayerPause = {
    at,
    ask: <>누르기 전에 맞혀 보세요. 퀸이 줄 0 칸 0, 줄 1 칸 2 에 있습니다. 다음 줄(줄 2)에 놓을 수 있는 칸이 있을까요?</>,
    options: [
      { label: "칸 1 에 놓을 수 있다" },
      { label: "칸 3 에 놓을 수 있다" },
      { label: "하나도 없다 — 앞 줄로 돌아간다", correct: true },
    ],
    why: (
      <>
        줄 2 의 네 칸이 모두 막혀 있습니다. 칸 0 은 줄 0 퀸과, 칸 2 는 줄 1 퀸과 같은 열입니다. 칸 1 과 칸 3 은 줄 1 칸 2 의
        퀸이 대각선으로 노립니다. 그래서 다음 스텝에서 앞 줄로 돌아갑니다.
      </>
    ),
  };

  return (
    <main className="algo-page">
      <p className="algo-crumb">백트래킹·구현</p>
      <h1 className="algo-title">N-퀸</h1>
      <p className="algo-lede">서로 못 보게 놓기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        퀸은 같은 줄·같은 열·대각선에 있는 칸을 노립니다. 보드에 퀸 {QUEEN_N}개를 서로 노리지 않게 놓습니다.{" "}
        <strong>첫 줄 맨 왼쪽에 놓으면 끝까지 놓을 수 있을지 먼저 고르고</strong> 위 줄부터 한 줄에 하나씩 놓아 보세요.
      </p>

      <QueenReveal>
        <ul className="algo-keys">
          <li>
            <b>놓을 수 있는 칸에 놓았다</b> — 가장 왼쪽 칸부터 시도했다
          </li>
          <li>
            <b>다음 줄이 막히면</b> — 앞 줄 퀸을 거두고 그 줄의 다음 칸으로 갔다
          </li>
        </ul>
        <p>
          놓다가 막히면 앞 줄로 돌아가 다른 선택을 하는 방법 = <strong>백트래킹(backtracking)</strong>. 돌아오는 건{" "}
          <Link href="/algo/recursion">재귀</Link>가 해 주는 일입니다. 앞 장{" "}
          <Link href="/algo/permutations">순열과 조합 만들기</Link>에서도 같은 일을 했습니다.
        </p>
        <p>
          보드의 모든 배치를 따지면 {QUEEN_N}×{QUEEN_N} 에서 퀸 {QUEEN_N}개를 놓는 방법이 {ALL4.toLocaleString("ko-KR")}가지입니다.
          백트래킹은 퀸을 {FIRST4}번 놓고 첫 해를 찾았습니다.
        </p>
        <Counter
          rows={[
            { label: "8×8 모든 배치를 하나씩", n: ALL8, unit: "가지" },
            { label: "8×8 백트래킹으로 해 92개 모두", n: BT8_ALL, unit: "번" },
          ]}
          caption={`8×8 에서 퀸 8개를 놓는 모든 배치는 약 44억 가지입니다. 하나씩 따지면 Python 으로 약 ${timeLabel(Math.log10(ALL8))}이 걸립니다. 막다른 길을 일찍 끊으면 놓는 횟수 ${BT8_ALL.toLocaleString("ko-KR")}번으로 해 ${SOLUTIONS[8]}개를 모두 찾습니다. 해 하나만이면 ${BT8_FIRST}번입니다.`}
        />
      </QueenReveal>

      {/* ③ 조건 짚기 */}
      <h2>퀸이 노리는 칸은 세 방향이다</h2>
      <ul className="algo-keys">
        <li>
          <b>같은 열</b> — 위 줄 퀸과 칸 번호가 같다
        </li>
        <li>
          <b>대각선</b> — 줄 − 열이 같거나 줄 + 열이 같다. 줄 0 칸 0 퀸은 줄 1 칸 1, 줄 2 칸 2 를 노린다
        </li>
        <li>
          <b>같은 줄</b> — 한 줄에 퀸 하나만 놓아서 따로 볼 필요가 없다
        </li>
      </ul>
      <p>방금 막힌 칸을 눌렀을 때 나온 「같은 열이에요」「대각선으로 노려요」가 이 규칙입니다.</p>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 놓고, 부르고, 안 되면 거둔다</h2>
      <p>
        위에서 놓아 본 것과 <strong>같은 보드</strong>입니다. 줄 번호와 칸 번호는 코드의 <code>row</code>, <code>col</code> 처럼
        0부터 셉니다. <strong>다음</strong>을 눌러 퀸이 놓이고 거둬지는 걸 보세요. 칸을 훑는 줄은 한 스텝으로 묶었습니다.
      </p>

      <QueenPlayer tape={tape} title="퀸을 놓고 거두는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>cols</code> <code>d1</code> <code>d2</code>
          </b>{" "}
          — 노리는 열, 줄 − 열(<code>diag</code>), 줄 + 열(<code>anti</code>)을 모아 둔 집합. 놓을 때 넣고 거둘 때 뺀다
        </li>
        <li>
          <b>
            <code>place(row + 1, …)</code>
          </b>{" "}
          — 다음 줄을 같은 방법으로 풀어 본다. 놓을 곳이 없으면 <code>False</code> 로 돌아온다
        </li>
        <li>
          <b>
            <code>cols.remove(col)</code>
          </b>{" "}
          — 돌아와서 퀸을 거두는 줄. 같은 줄의 다음 칸을 이어서 본다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="3×3 보드에 퀸 3개를 서로 노리지 않게 놓는 방법은 몇 가지일까요?"
        options={[
          { label: `${SOLUTIONS[3]}가지 — 어떻게 놓아도 서로 노린다`, correct: true },
          { label: `${SOLUTIONS[3] + 1}가지` },
          { label: `${SOLUTIONS[4]}가지 — 4×4 와 같다` },
        ]}
        why={
          <>
            3×3 에서는 첫 줄에 어디를 놓아도 아래 줄 어딘가가 막혀 끝까지 놓을 수 없습니다. 보드 크기별 방법의 수는 1×1 이{" "}
            {SOLUTIONS[1]}가지, 2×2 와 3×3 이 {SOLUTIONS[2]}가지, 4×4 가 {SOLUTIONS[4]}가지, 8×8 이 {SOLUTIONS[8]}가지입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>N-퀸에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>대각선을 한쪽만 검사하면</b> — 8×8 해가 {SOLUTIONS[8]}가지가 아니라 2,113가지로 나온다. 노리는 배치까지 센다
        </li>
        <li>
          <b>
            거두는 줄(<code>remove</code>)을 빼면
          </b>{" "}
          — 한 번 놓은 칸의 표시가 남아서 다음 시도가 막힌다. 해가 있는 4×4 에서도 <code>False</code> 가 나왔다
        </li>
        <li>
          <b>N 이 하나 늘면 약 5배 느려진다</b> — 해를 모두 세는 데 N = 8 이 약 0.001초, 10 이 약 0.02초, 11 이 약 0.1초였다(Python
          3.14, 컴퓨터마다 다르다)
        </li>
        <li>
          <b>퀸 위치는 줄마다 칸 번호 하나로 적는다</b> — <code>board[row] = col</code> 처럼 리스트 하나면 충분하다. 보드 전체를 2차원으로 들고 다닐 필요가 없다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>조건을 만족하는 배치를 찾는다</b>
        <b>놓다가 안 되면 돌아가 다른 선택</b>
        <b>경우의 수는 많은데 안 되는 경우는 일찍 끊는다</b>
      </div>
      <p className="algo-next">다음 장에서는 시키는 대로 그대로 따라 하는 시뮬레이션을 봅니다.</p>
    </main>
  );
}
