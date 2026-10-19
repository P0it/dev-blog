import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { TowerPlayer } from "@/components/algo/TowerPlayer";
import { DollsReveal } from "@/components/algo/DollsReveal";
import { FibTree } from "@/components/algo/FibTree";
import { Quiz } from "@/components/algo/Quiz";
import { factorialTape, firstReturnGate } from "@/lib/algo/recursion";

const N = 4;

export const metadata: Metadata = {
  title: "재귀",
  description: "거울 앞에 거울을 두면",
};

export default async function RecursionPage() {
  const plain = factorialTape(N);
  const gate = firstReturnGate(plain);
  const tape = await highlightTape(plain);

  return (
    <main className="algo-page">
      <p className="algo-crumb">기초 개념</p>
      <h1 className="algo-title">재귀</h1>
      <p className="algo-lede">거울 앞에 거울을 두면</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <DollsReveal>
        <p className="algo-chain">
          상자 1 열기 → 상자 2 열기 → 상자 3 열기 → 상자 4 열기 → <b>구슬</b>
          <span>닫을 때 답이 1 → 2 → 3 → 4 로 이어졌습니다.</span>
        </p>
        <ul className="algo-keys">
          <li>
            <b>열 때</b> — 안쪽으로 한 겹씩. 답은 아직 모른다
          </li>
          <li>
            <b>맨 안쪽</b> — 더 열 상자가 없다. 여기서 첫 답(1)이 생긴다
          </li>
          <li>
            <b>닫을 때</b> — 안쪽 답에 1 을 더해 바깥 답이 정해진다. 안쪽이 끝나야 바깥을 안다
          </li>
        </ul>
        <p>
          자기 안에서 같은 일을 다시 하는 방법 = <strong>재귀</strong>
        </p>
        <p>
          거울 앞에 거울을 두면 거울 속에 거울이 끝없이 이어집니다. 상자는 맨 안쪽에서 끝났기에 답이 나왔습니다.
        </p>
      </DollsReveal>

      {/* ③ 조건 짚기 */}
      <h2>재귀에는 두 가지가 꼭 있다</h2>
      <ul className="algo-keys">
        <li>
          <b>멈추는 자리</b> — 구슬만 있는 맨 안쪽 상자. 더 부르지 않고 답을 돌려준다
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
        1 부터 <strong>{N}</strong> 까지 곱하는 <code>factorial({N})</code>. <strong>다음</strong>을 눌러 한 줄씩 넘기며 층이 쌓이고 걷히는 걸 보세요. 중간에 한 번 물어봅니다.
      </p>

      <TowerPlayer
        tape={tape}
        title="factorial 이 자기를 부르며 층이 쌓이는 모습"
        pause={{
          at: gate,
          ask: "factorial(1) 이 1 을 돌려줬습니다. 한 층 바깥의 factorial(2) 는 무엇을 돌려줄까요?",
          options: [
            { label: "2 — 2 × 1 을 곱해서", correct: true },
            { label: "1 — 안쪽에서 받은 값을 그대로" },
            { label: "3 — 2 + 1 을 더해서" },
          ],
          why: (
            <>
              코드가 <code>n * …</code> 이라서 <strong>2 × 1 = 2</strong> 를 돌려줍니다. 상자에서 안쪽 답에 1 을 더했듯, 안쪽 층의 값이 와야 바깥 층이 계산을 이어 갑니다.
            </>
          ),
        }}
      />

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

      <h2>자기를 두 번 부르면 나무가 된다</h2>
      <p>factorial 은 한 줄로 쌓입니다. 이런 문제는 반복문으로 써도 쉽습니다. 호출이 둘로 갈라지면 모습이 달라집니다.</p>
      <FibTree n={4} />
      <ul className="algo-keys">
        <li>
          <b>한 줄로 쌓이면</b> — 반복문으로 바꿔도 쉽다
        </li>
        <li>
          <b>둘로 갈라지면</b> — 반복문으로는 어디까지 했는지 직접 적어 두어야 해서 훨씬 어렵다
        </li>
        <li>
          <b>폴더 안에 폴더</b> — 안에 같은 것이 든 구조도 재귀로 쓰면 짧아진다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={`factorial(${N}) 에서 곱셈은 어떤 순서로 일어날까요?`}
        options={[
          { label: "4 × 3 부터. 먼저 부른 층이 먼저 곱한다" },
          { label: "4 × 3 × 2 × 1 을 마지막에 한꺼번에 곱한다" },
          { label: "2 × 1 부터. 가장 안쪽 층이 먼저 값을 돌려준다", correct: true },
        ]}
        why={
          <>
            factorial(1) 이 1 을 돌려준 뒤에야 <strong>2 × 1 = 2</strong>, 그다음 3 × 2 = 6, 마지막으로 4 × 6 = 24 입니다.
            곱셈은 부른 순서의 <strong>거꾸로</strong> 일어납니다. 안쪽 값이 있어야 바깥이 곱할 수 있기 때문입니다.
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
        <li>
          <b>
            <code>sys.setrecursionlimit(10**6)</code>
          </b>{" "}
          — 코딩테스트에서는 한도를 이렇게 늘려 씁니다. 너무 깊으면 한도에 닿기 전에 메모리가 먼저 터질 수 있다
        </li>
      </ul>
      <p>깊이가 1만, 10만이 될 수 있는 문제는 재귀 대신 반복문으로 바꾸는 쪽이 안전합니다.</p>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>같은 모양의 더 작은 문제</b>
        <b>자기를 둘 이상으로 나눈다</b>
        <b>폴더·트리처럼 안에 같은 것이 든다</b>
      </div>
      <p className="algo-next">
        다음 장에서는 일단 전부 해 보는 완전탐색을 봅니다.
      </p>
    </main>
  );
}
