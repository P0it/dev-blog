import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TowerPlayer } from "@/components/algo/TowerPlayer";
import { DollsReveal } from "@/components/algo/DollsReveal";
import { Quiz } from "@/components/algo/Quiz";
import { factorialTape } from "@/lib/algo/recursion";

const N = 4;

export const metadata: Metadata = {
  title: "재귀",
  description: "거울 앞에 거울을 두면",
};

export default async function RecursionPage() {
  const tape = await highlightTape(factorialTape(N));

  return (
    <main className="algo-page">
      <p className="algo-crumb">기초 개념</p>
      <h1 className="algo-title">재귀</h1>
      <p className="algo-lede">거울 앞에 거울을 두면</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <DollsReveal>
        <p className="algo-chain">
          상자 1 열기 → 상자 2 열기 → 상자 3 열기 → 상자 4 열기 → <b>구슬</b>
          <span>같은 일이 상자 안에 또 들어 있었습니다.</span>
        </p>
        <ul className="algo-keys">
          <li>
            <b>열 때</b> — 안쪽으로 한 겹씩. 아직 끝난 일은 없다
          </li>
          <li>
            <b>구슬이 나오면</b> — 더 열 상자가 없다. 여기서 답이 생긴다
          </li>
          <li>
            <b>닫을 때</b> — 바깥으로 한 겹씩. 가장 안쪽이 가장 먼저 끝난다
          </li>
        </ul>
        <p>
          자기 안에서 같은 일을 다시 하는 방법 = <strong>재귀</strong>
        </p>
      </DollsReveal>

      {/* ③ 조건 짚기 */}
      <h2>재귀에는 두 가지가 꼭 있다</h2>
      <ul className="algo-keys">
        <li>
          <b>멈추는 자리</b> — 구슬이 나온 상자. 더 부르지 않고 답을 돌려준다
        </li>
        <li>
          <b>작아지는 입력</b> — 열 때마다 남은 상자가 하나씩 줄었다
        </li>
        <li>
          <b>하나라도 빠지면</b> — 끝없이 열기만 한다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 상자 열기를 그대로 옮긴 것이다</h2>
      <p>
        1 부터 <strong>{N}</strong> 까지 곱하는 <code>factorial({N})</code>. <strong>다음</strong>을 눌러 한 줄씩 넘기며 층이 쌓이고 걷히는 걸 보세요.
      </p>

      <TowerPlayer tape={tape} title="factorial 이 자기를 부르며 층이 쌓이는 모습" />

      <ul className="algo-keys">
        <li>
          <b>
            <code>if n == 1</code>
          </b>{" "}
          — 멈추는 자리. 여기서만 자기를 부르지 않는다
        </li>
        <li>
          <b>
            <code>factorial(n - 1)</code>
          </b>{" "}
          — 한 칸 작아진 입력으로 자기를 부른다. 층이 하나 쌓인다
        </li>
        <li>
          <b>
            <code>n * …</code>
          </b>{" "}
          — 안쪽 층이 값을 돌려주면 그제야 곱한다. 층이 걷힌다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={`factorial(${N}) 을 실행하면 호출 탑은 가장 높을 때 몇 층일까요?`}
        options={[
          { label: "3층 — factorial(3) 을 실행했을 때의 높이" },
          { label: `${N}층`, correct: true },
          { label: "5층 — factorial(5) 를 실행했을 때의 높이" },
        ]}
        why={
          <>
            n 이 {N} → 3 → 2 → 1 로 내려가며 층이 하나씩 쌓입니다. 높이는 <strong>n 과 같습니다.</strong>{" "}
            n 이 3 이면 3층, 5 이면 5층입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>멈추는 자리를 빼먹으면</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>if n == 1</code> 이 없으면
          </b>{" "}
          — n 이 0, −1, −2 … 로 끝없이 내려간다
        </li>
        <li>
          <b>1000층쯤 쌓이면</b> — 파이썬이 <code>RecursionError</code> 를 내고 멈춘다. 기본 한도가 1000 이다
        </li>
        <li>
          <b>
            <code>factorial(0)</code>
          </b>{" "}
          — 이 코드는 n 이 1 일 때만 멈춘다. 0 에서 시작하면 한도까지 내려가다 터진다
        </li>
      </ul>
      <p>깊이가 1만, 10만이 될 수 있는 문제는 재귀 대신 반복문으로 바꿉니다.</p>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>같은 모양의 더 작은 문제</b>
        <b>점화식이 주어진다</b>
        <b>폴더·트리처럼 안에 같은 것이 든다</b>
      </div>
      <p className="algo-next">
        다음 장에서는 일단 전부 해 보는 완전탐색을 봅니다.
      </p>
    </main>
  );
}
