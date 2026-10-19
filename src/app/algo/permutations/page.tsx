import type { Metadata } from "next";
import Link from "next/link";
import { highlightTape } from "@/lib/algo/highlight";
import { PermPlayer } from "@/components/algo/PermPlayer";
import { PermReveal } from "@/components/algo/PermReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import {
  permuteTape,
  firstUndoGate,
  PERM_ITEMS,
    factorial,
  countPerm,
  countComb,
} from "@/lib/algo/permutations";
import { timeLabel } from "@/lib/algo/big-o";

const N = PERM_ITEMS.length;
const TOTAL = factorial(N);
const TWO_PERM = countPerm(N, 2);
const TWO_COMB = countComb(N, 2);
const FOUR = factorial(4);

export const metadata: Metadata = {
  title: "순열과 조합 만들기",
  description: "가능한 경우를 빠짐없이",
};

export default async function PermutationsPage() {
  const raw = permuteTape(PERM_ITEMS);
  const tape = await highlightTape(raw);

  // 첫 결과(ABC)를 담은 바로 다음 스텝 앞에서 묻는다 — 자리가 다 찼으니 이제 무엇을 할까
  const at = firstUndoGate(raw);
  const pause: PlayerPause = {
    at,
    ask: <>{PERM_ITEMS.join("·")} 한 가지를 결과에 담았습니다. 자리가 다 찼습니다. 다음에는 무엇을 할까요?</>,
    options: [
      { label: "새 친구를 한 명 더 세운다" },
      { label: "모든 자리를 비우고 처음부터 다시 한다" },
      { label: `마지막에 선 ${PERM_ITEMS[N - 1]}를 빼고 되돌아간다`, correct: true },
    ],
    why: (
      <>
        자리가 다 차서 더 세울 친구가 없습니다. 11번 줄 <code>path.pop()</code> 이 마지막 친구를 빼고, 12번 줄이{" "}
        <code>used</code> 표시를 지웁니다. 그다음 이 자리에 올 다른 친구가 있는지 찾고, 없으면 한 칸 더 되돌아갑니다.
      </>
    ),
  };

  return (
    <main className="algo-page">
      <p className="algo-crumb">백트래킹·구현</p>
      <h1 className="algo-title">순열과 조합 만들기</h1>
      <p className="algo-lede">가능한 경우를 빠짐없이</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        친구 셋이 한 줄로 섭니다. <strong>서는 순서가 몇 가지일지 먼저 고르고</strong> 앞자리부터 친구를 세워 서로 다른
        순서를 빠짐없이 모두 찾아 보세요.
      </p>

      <PermReveal>
        <ul className="algo-keys">
          <li>
            <b>자리마다 고른다</b> — 첫 자리는 3가지, 둘째 자리는 남은 2가지, 셋째 자리는 1가지였다
          </li>
          <li>
            <b>다 서면 되돌아온다</b> — 한 칸 되돌려 다른 친구를 고르고, 막히면 또 한 칸 되돌렸다
          </li>
        </ul>
        <p>
          자리마다 고르다 끝나면 되돌아와 다음을 고르는 방법 = <strong>백트래킹(backtracking)</strong>. 앞에서 본{" "}
          <Link href="/algo/recursion">재귀</Link>가 이 일을 합니다.
        </p>
        <ul className="algo-keys">
          <li>
            <b>순서가 있는 줄 세우기 = 순열(permutation)</b> — AB 와 BA 는 다른 순서다. 셋 중 둘을 세우면{" "}
            {TWO_PERM}가지다
          </li>
          <li>
            <b>순서 없이 뽑기만 하기 = 조합(combination)</b> — AB 와 BA 는 같은 하나다. 셋 중 둘을 뽑으면{" "}
            {TWO_COMB}가지다
          </li>
        </ul>
        <Counter
          rows={[
            { label: `친구 ${N}명`, n: TOTAL, unit: "가지" },
            { label: "친구 10명", n: factorial(10), unit: "가지" },
            { label: "친구 12명", n: factorial(12), unit: "가지" },
          ]}
          caption={`친구가 늘면 순서는 폭발합니다. 12명이면 1초에 1천만 번씩 세도 약 ${timeLabel(Math.log10(factorial(12)))} 걸립니다. 완전탐색 장에서 본 N!입니다.`}
        />
      </PermReveal>

      {/* ③ 조건 짚기 */}
      <h2>이미 선 친구는 다시 세우지 않는다</h2>
      <ul className="algo-keys">
        <li>
          <b>서 있는 친구는 못 누른다</b> — 방금 겪은 규칙이다. 코드에서는 <code>used</code> 가 이 표시다
        </li>
        <li>
          <b>한 번씩, 빠짐없이</b> — 첫 자리가 A 인 순서를 다 찾은 뒤에야 B 로 넘어간다. 그래서 겹치지도 빠지지도 않는다
        </li>
        <li>
          <b>되돌리면 표시도 지운다</b> — 뺀 친구는 다시 고를 수 있어야 한다. 표시를 지우지 않으면 한 가지만 찾고 끝난다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 세우기, 들어가기, 되돌리기가 전부다</h2>
      <p>
        처음에는 <code>permute([&quot;A&quot;, &quot;B&quot;, &quot;C&quot;], [], [False] * 3, result)</code> 처럼 빈 줄, 빈 표시, 빈 결과를 넣어
        부릅니다. 위에서 해 본 것과 <strong>같은 친구 셋</strong>입니다.
      </p>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘겨 보세요. 모든 줄을 올리면 150스텝이 넘어서, 친구를 세우는 10번 줄, 결과를 담는 4번 줄,
        마지막 친구를 빼는 12번 줄만 올렸습니다.
      </p>

      <PermPlayer tape={tape} title="친구를 세우고 되돌리며 모든 순서를 찾는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>used[i] = True</code> · <code>path.append(...)</code>
          </b>{" "}
          — 친구를 세운다. 8·9번 줄
        </li>
        <li>
          <b>
            <code>permute(...)</code>
          </b>{" "}
          — 다음 자리로 들어간다. 자기 안에서 같은 일을 다시 부른다
        </li>
        <li>
          <b>
            <code>path.pop()</code> · <code>used[i] = False</code>
          </b>{" "}
          — 마지막 친구를 빼고 표시를 지운다. 11·12번 줄
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="친구가 넷(A·B·C·D)이면 한 줄로 서는 순서는 모두 몇 가지일까요?"
        options={[
          { label: "16가지 — 자리마다 4가지씩" },
          { label: `${TOTAL * 2}가지 — 셋일 때의 ${TOTAL}가지를 두 배로` },
          { label: `${FOUR}가지 — 4 × 3 × 2 × 1`, correct: true },
        ]}
        why={
          <>
            첫 자리는 4가지, 둘째는 남은 3가지, 셋째는 2가지, 마지막은 1가지입니다. 곱하면 {FOUR}가지(4!)입니다. 자리를 채울수록
            선택지가 하나씩 줄어서 4 × 4 가 아닙니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>순열 만들기에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>result.append(path)</code> 로 쓰면
          </b>{" "}
          — 결과가 전부 같은 줄 하나를 가리킨다. 끝나면 그 줄이 비어서 <code>[[], [], [], [], [], []]</code> 가 나온다. 복사해서 담는다 —{" "}
          <code>path[:]</code>
        </li>
        <li>
          <b>
            <code>path.pop()</code> 과 <code>used[i] = False</code> 를 빼면
          </b>{" "}
          — 되돌리지 못해서 첫 한 가지 <code>[&apos;A&apos;, &apos;B&apos;, &apos;C&apos;]</code> 만 나오고 끝난다
        </li>
        <li>
          <b>같은 값이 섞이면</b> — <code>[1, 1, 2]</code> 는 6가지가 나오는데 서로 다른 건 3가지다. 같은 값끼리 자리를 바꾼 것도 따로
          센다. <code>set</code> 에 담거나, 정렬한 뒤 같은 값을 건너뛴다
        </li>
        <li>
          <b>실전에서는 한 줄</b> — <code>itertools.permutations(items)</code> 와 <code>itertools.combinations(items, 2)</code> 가
          튜플을 하나씩 돌려준다. <code>list()</code> 로 감싸면 개수를 볼 수 있다. 10명의 360만 가지를 훑는 데 약 0.1초 걸렸다(Python 3.14,
          컴퓨터마다 다르다)
        </li>
        <li>
          <b>n 이 크면 못 한다</b> — 12명은 4억 7,900만 가지라 1초에 1천만 번씩 세도 약 {timeLabel(Math.log10(factorial(12)))} 걸린다. 순열로 모든 경우를 다 만드는 건
          10명 이하일 때 쓴다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>모든 순서(순열)·모든 뽑기(조합)</b>
        <b>n 이 작다(10 이하)</b>
        <b>경우를 빠짐없이 나열</b>
      </div>
      <p className="algo-next">다음 장에서는 서로 못 보게 퀸을 놓는 N-퀸을 봅니다. 놓다가 막히면 돌아오는 백트래킹을 그대로 씁니다.</p>
    </main>
  );
}
