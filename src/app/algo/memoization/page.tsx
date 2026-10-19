import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { MemoPlayer } from "@/components/algo/MemoPlayer";
import { MemoReveal } from "@/components/algo/MemoReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { josa } from "@/lib/algo/josa";
import { memoTape, memoGate, fullTree, plainCalls, memoCalls, memoComputes } from "@/lib/algo/memoization";
import fixture from "@/lib/algo/fixtures/memoization.json";

const N = 6;

export const metadata: Metadata = {
  title: "메모이제이션",
  description: "같은 걸 두 번 세지 않기",
};

export default async function MemoizationPage() {
  const plain = memoTape(N);
  const gate = memoGate(plain);
  const gateStep = plain.steps[gate];
  const bookAtGate = gateStep.stage.memo!.notebook.map((e) => e.n).sort((a, b) => a - b);
  const tape = await highlightTape(plain);

  const nodes = fullTree(N);
  const twice = nodes.filter((x) => x.n === 2).length;
  const f = fixture.facts;

  return (
    <main className="algo-page">
      <p className="algo-crumb">DP</p>
      <h1 className="algo-title">메모이제이션</h1>
      <p className="algo-lede">같은 걸 두 번 세지 않기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <MemoReveal>
        <p className="algo-chain">
          호출 {plainCalls(N)}번 → 수첩에 적은 값 {memoComputes(N)}개 → <b>계산 {memoComputes(N)}번</b>
          <span>같은 값은 한 번만 계산했습니다. 두 번째부터는 수첩에서 꺼내 썼습니다.</span>
        </p>
        <ul className="algo-keys">
          <li>
            <b>처음 나오는 값</b> — 계산해서 수첩에 적는다
          </li>
          <li>
            <b>이미 적힌 값</b> — 다시 계산하지 않고 꺼내 쓴다. 그 아래 가지는 부르지도 않는다
          </li>
          <li>
            <b>그래서</b> — 서로 다른 값의 개수만큼만 계산한다
          </li>
        </ul>
        <p>
          한 번 구한 값을 적어 두었다가 다시 쓰는 방법 = <strong>메모이제이션(memoization)</strong>
        </p>
        <Counter
          rows={[
            { label: "수첩 없이 fib(30)", n: f.plainCalls30, unit: "번" },
            { label: "수첩을 쓰면", n: f.memoCalls30, unit: "번" },
          ]}
          caption={`호출 횟수. 수첩에는 값이 ${f.memoComputes30}개만 적힙니다.`}
        />
      </MemoReveal>

      {/* ③ 조건 짚기 */}
      <h2>수첩을 써도 되는 때</h2>
      <ul className="algo-keys">
        <li>
          <b>같은 입력이면 같은 값</b> — 수첩에 적은 fib(2) = 1 은 언제 꺼내도 같았다. 값이 달라질 수 있으면 적어 둘 수 없다
        </li>
        <li>
          <b>같은 계산이 되풀이된다</b> — 나무에서 fib(2) 가 {twice}번 나왔다. 겹치지 않는 문제는 적어 둬도 꺼내 쓸 일이 없다
        </li>
        <li>
          <b>입력으로 값을 찾는다</b> — 수첩은 입력(n)을 칸 이름 삼아 값을 찾는다. 앞서 본 해시가 이 일을 한다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 수첩을 하나 더 들고 다니는 것뿐이다</h2>
      <p>
        <code>fib({N}, {"{}"})</code> 로 부르면 수첩은 빈 딕셔너리로 시작합니다. <strong>다음</strong>을 눌러 한 줄씩 넘기며 층이 쌓이고 수첩이 채워지는 걸 보세요. 중간에 한 번 물어봅니다.
      </p>

      <MemoPlayer
        tape={tape}
        n={N}
        title="수첩을 쓰며 fib 가 자기를 부르는 모습"
        pause={{
          at: gate,
          ask: (
            <>
              <code>fib({gateStep.vars.n})</code> 호출이 수첩을 확인하는 순간입니다. 수첩에는 이미{" "}
              {bookAtGate.map((n) => `fib(${n})`).join(", ")} 의 값이 적혀 있습니다. 이 호출은 어떻게 할까요?
            </>
          ),
          options: [
            { label: "수첩에서 꺼낸다 — 이미 적혀 있어서", correct: true },
            { label: "계산한다 — 호출했으니까" },
            { label: "한 칸 작은 값부터 다시 부른다 — 항상 그렇게 하니까" },
          ],
          why: (
            <>
              수첩에 <strong>{josa(gateStep.vars.n, "이", "가")}</strong> 이미 있습니다. 앞에서 fib({gateStep.vars.n}) 을 계산하면서 적어 둔 값입니다. 계산하지 않고 줄 3 으로 가서 값을 그대로 돌려줍니다.
            </>
          ),
        }}
      />

      <ul className="algo-keys">
        <li>
          <b>
            <code>if n in memo</code>
          </b>{" "}
          — 수첩에 있으면 여기서 끝난다. 아래 가지를 부르지 않는다
        </li>
        <li>
          <b>
            <code>memo[n] = …</code>
          </b>{" "}
          — 구한 값을 돌려주기 전에 수첩에 적는다
        </li>
        <li>
          <b>끝나면</b> — 호출 {memoCalls(N)}번, 수첩에는 0 부터 {N} 까지 값이 하나씩 적혔다
        </li>
      </ul>

      <h2>코딩테스트에서는 한 줄이면 된다</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>@lru_cache(maxsize=None)</code>
          </b>{" "}
          — <code>from functools import lru_cache</code> 한 뒤 함수 위에 붙인다. 수첩은 파이썬이 대신 만들어 준다
        </li>
        <li>
          <b>같은 결과</b> — <code>fib(6)</code> 은 {f.lruCacheFib6} 이다. <code>fib.cache_info()</code> 로 보면 계산 7번, 꺼내 쓰기 4번으로 ① 에서 센 값과 같다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="같은 방법으로 fib(7) 을 구하면 값을 계산하는 일은 몇 번일까요?"
        options={[
          { label: `${memoComputes(7)}번 — fib(0) 부터 fib(7) 까지 값마다 한 번씩`, correct: true },
          { label: `${memoComputes(N)}번 — fib(6) 때와 같다` },
          { label: `${memoCalls(7)}번 — 호출한 횟수` },
        ]}
        why={
          <>
            계산은 서로 다른 값마다 한 번이라 fib(0) 부터 fib(7) 까지 <strong>{memoComputes(7)}번</strong>입니다. 호출은 {memoCalls(7)}번이고 그중 {memoCalls(7) - memoComputes(7)}번은 수첩에서 꺼내 씁니다. 수첩이 없으면 호출이 {plainCalls(7)}번입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>수첩을 써도 틀리거나 느려지는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>memo = {"{}"}</code> 를 함수 안에 쓰면
          </b>{" "}
          — 부를 때마다 빈 수첩이 새로 생긴다. fib(20) 의 호출이 {f.newMemoEachCall20.toLocaleString("ko-KR")}번으로 수첩이 없을 때와 같다. 함수 밖에서 만들어 건네면 {f.sharedMemoCalls20}번이다
        </li>
        <li>
          <b>깊이는 그대로</b> — 수첩을 써도 재귀라서 <code>fib(5000, {"{}"})</code> 는 <code>RecursionError</code> 를 낸다. 기본 한도가 {f.recursionLimit.toLocaleString("ko-KR")}이다
        </li>
        <li>
          <b>
            <code>lru_cache</code> 는 인자가 해시 가능해야 한다
          </b>{" "}
          — 리스트를 넘기면 <code>TypeError: {f.unhashable}</code>. 튜플로 바꿔서 넘긴다
        </li>
        <li>
          <b>값이 바뀌는 함수에는 쓰지 않는다</b> — 부를 때마다 1, 2, 3 을 세어 주는 함수를 캐시했더니 세 번 불러도 {f.impureTicks.join(", ")} 이었다. 함수는 {f.impureRuns}번만 돌았다
        </li>
      </ul>
      <p>
        직접 재 보니 수첩 없이 fib({f.measured.n}) 에 약 {f.measured.plainSeconds}초, 수첩을 쓰면 약 {f.measured.memoSeconds.toFixed(6)}초였습니다. 컴퓨터마다 다르니 비율만 보세요.
      </p>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>같은 계산이 반복된다</b>
        <b>부분 문제로 쪼개진다</b>
        <b>경우의 수·최댓값을 재귀로 쓴다</b>
      </div>
      <p className="algo-next">다음 장에서는 이 수첩을 위에서가 아니라 아래에서부터 채우는 1차원 DP 를 봅니다.</p>
    </main>
  );
}
