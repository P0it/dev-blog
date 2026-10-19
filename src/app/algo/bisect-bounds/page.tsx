import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { BoundPlayer, type BoundTarget } from "@/components/algo/BoundPlayer";
import { BoundReveal } from "@/components/algo/BoundReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { BOUND_ARR, boundTape, type BoundVariant } from "@/lib/algo/bisect-bounds";
import { worstCaseGuesses } from "@/lib/algo/up-down";
import type { Tape } from "@/lib/algo/types";
import type { PlayerPause } from "@/components/algo/TapePlayer";

const BIG = 1_000_000;

const TARGETS: BoundTarget[] = [
  { value: 2, label: "2 · 같은 값 셋" },
  { value: 3, label: "3 · 하나뿐" },
  { value: 4, label: "4 · 없는 값" },
  { value: 0, label: "0 · 맨 앞보다 작음" },
];

/** 첫 비교 뒤에 lo 와 hi 중 어느 쪽이 움직일지 한 번 묻는다. `hi = mid` 가 `mid - 1` 이 아닌 이유도 여기서 짚는다. */
function pauseFor(tape: Tape, x: number, variant: BoundVariant): PlayerPause | undefined {
  const at = tape.steps.findIndex((s) => s.line === 5);
  if (at < 0) return undefined;
  const mid = tape.steps[at].vars.mid;
  const v = BOUND_ARR[mid];
  const small = variant === "left" ? v < x : v <= x;
  const cmp = variant === "left" ? (small ? "더 작습니다" : "크거나 같습니다") : small ? "작거나 같습니다" : "더 큽니다";
  const lo = { label: "lo — mid 칸 바로 뒤 틈으로 옮겨 앞쪽을 버린다" };
  const hi = { label: "hi — mid 칸 바로 앞 틈에 두어 뒤쪽을 버린다" };
  return {
    at: at + 1,
    ask: `먼저 예상해 보세요. ${mid}번 칸의 값은 ${v}입니다. 찾는 값 ${x} 와 견주면 ${cmp}. 다음에 움직이는 것은 무엇일까요?`,
    options: small ? [{ ...lo, correct: true }, hi] : [lo, { ...hi, correct: true }],
    why: small
      ? `${mid}번 칸까지는 전부 경계의 왼쪽입니다. 그래서 lo 가 그 칸 바로 뒤 틈으로 옮겨 가고 앞쪽이 통째로 버려집니다.`
      : `${mid}번 칸이 경계의 오른쪽에 있거나, 경계가 바로 이 칸 앞일 수 있습니다. 그래서 hi 를 이 칸 바로 앞 틈에 둡니다. 한 칸 더 앞으로 두면 이 칸이 후보에서 빠집니다.`,
  };
}

export const metadata: Metadata = {
  title: "왼쪽 끝·오른쪽 끝 찾기",
  description: "같은 값이 여러 개일 때",
};

export default async function BisectBoundsPage() {
  // 찾는 값 4개 × 코드 2종. 색은 서버에서 한 번만 칠해 넘긴다
  const tapes: Record<string, Tape> = {};
  const pauses: Record<string, PlayerPause | undefined> = {};
  for (const variant of ["left", "right"] as BoundVariant[]) {
    for (const t of TARGETS) {
      const tape = await highlightTape(boundTape(BOUND_ARR, t.value, variant));
      tapes[`${variant}-${t.value}`] = tape;
      pauses[`${variant}-${t.value}`] = pauseFor(tape, t.value, variant);
    }
  }

  return (
    <main className="algo-page">
      <p className="algo-crumb">탐색</p>
      <h1 className="algo-title">왼쪽 끝·오른쪽 끝 찾기</h1>
      <p className="algo-lede">같은 값이 여러 개일 때</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        번호표가 <strong>1 2 2 2 3 5</strong> 로 줄을 섰습니다. 카드와 카드 <strong>사이의 틈</strong>에 번호가 붙어
        있습니다. 2번 표가 몇 장인지 세지 않고 알아내 보세요.
      </p>

      <BoundReveal>
        <p className="algo-chain">
          시작 틈 <b>bisect_left</b> · 끝 틈 <b>bisect_right</b>
          <span>개수 = 끝 틈 − 시작 틈. 없는 값이면 두 틈이 같아 0장.</span>
        </p>
        <p>
          둘 다 <strong>이분 탐색</strong>입니다. 값 하나를 찾는 대신 경계 틈을 찾습니다. 그래서 같은 값이 얼마나
          많아도 틈 두 개면 끝납니다.
        </p>
        <Counter
          rows={[
            { label: "하나씩 세기", n: BIG, unit: "번" },
            { label: "틈 두 개 찾기", n: worstCaseGuesses(BIG) * 2, unit: "번" },
          ]}
          caption="100만 장 중 같은 값이 몇 장인지 알아낼 때, 최악의 횟수."
        />
      </BoundReveal>

      {/* ③ 조건 짚기 */}
      <h2>정렬돼 있고, 같은 값이 한 덩어리여야 한다</h2>
      <ul className="algo-keys">
        <li>
          <b>정렬돼 있다</b> — 가운데를 보고 한쪽을 통째로 버리려면 필요하다. 이분 탐색과 같다
        </li>
        <li>
          <b>한 덩어리</b> — 정렬되면 같은 값은 자연히 붙는다. 그래서 두 틈 사이가 곧 개수다
        </li>
        <li>
          <b>틈은 늘 생긴다</b> — 값이 없어도 &ldquo;들어갈 자리&rdquo;가 있다. 4 가 그랬다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 이분 탐색에서 비교 한 줄이 다르다</h2>
      <ul className="algo-keys">
        <li>
          <b>찾았다고 멈추지 않는다</b> — 같은 값이 더 있을 수 있어서 경계가 나올 때까지 좁힌다
        </li>
        <li>
          <b>
            <code>lo</code> <code>hi</code>
          </b>{" "}
          — 칸이 아니라 틈 번호다. <code>hi</code> 는 <code>len(arr)</code> 에서 시작한다
        </li>
        <li>
          <b>
            <code>{"hi = mid"}</code>
          </b>{" "}
          — mid 칸이 경계 바로 뒤일 수 있어 <code>mid - 1</code> 이 아니라 mid 에 둔다
        </li>
      </ul>
      <p>
        찾는 값과 코드를 골라 <strong>다음</strong>을 눌러 보세요. 중간에 한 번 물어봅니다.
      </p>
      <p>
        오른쪽 코드는 비교 한 줄만 <code>{"<"}</code> 에서 <code>{"<="}</code> 로 바뀐 것입니다.
      </p>

      <BoundPlayer values={BOUND_ARR} targets={TARGETS} tapes={tapes} pauses={pauses} />

      {/* ⑤ 확인 문제 — 오답은 같은 줄에서 다른 코드가 실제로 돌려주는 값이다 */}
      <Quiz
        question="1 2 2 2 3 5 에서 2 를 찾을 때, bisect_right 는 몇 번 틈을 돌려줄까요?"
        options={[
          { label: "3번 — 마지막 2 가 있는 칸" },
          { label: "1번 — 2 묶음의 앞. bisect_left 의 답" },
          { label: "4번 — 2 묶음의 뒤", correct: true },
        ]}
        why={
          <>
            bisect_right 는 2 보다 큰 수가 <strong>처음 나오는 틈</strong>입니다. 마지막 2 는 3번 칸이고 그 바로 뒤
            틈이 4번입니다. 1번은 같은 줄에서 bisect_left 가 돌려주는 값이고, 3번은 틈이 아니라 칸 번호입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 — 아래 값은 모두 실제 Python 3.14 에서 돌려 확인했다 */}
      <h2>경계에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>정렬 안 된 줄에 쓰면</b> — 에러 없이 틀린다. <code>[1, 2, 5, 3]</code> 에서 3 의 자리를 물으면{" "}
          <code>2</code> 가 나오는데 그 칸은 5 다
        </li>
        <li>
          <b>없는 값도 답이 나온다</b> — <code>-1</code> 이 아니라 들어갈 자리다. 있는지는{" "}
          <code>i &lt; len(a) and a[i] == x</code> 로 확인한다. <code>i</code> 가 6 이면 <code>a[6]</code> 은{" "}
          <code>IndexError</code>
        </li>
        <li>
          <b>
            <code>hi = mid</code> 를 <code>hi = mid - 1</code> 로 쓰면
          </b>{" "}
          — 같은 줄에서 2 의 시작 틈이 1 이 아니라 0 이, 4 의 자리가 5 가 아니라 4 가 나온다
        </li>
        <li>
          <b>
            <code>lo = mid + 1</code> 에서 <code>+ 1</code> 을 빼면
          </b>{" "}
          — <code>[1, 2]</code> 에서 2 를 찾을 때 끝나지 않는다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>같은 값이 여러 개</b>
        <b>개수를 세야 한다</b>
        <b>x 이상이 처음 나오는 자리</b>
      </div>
      <p>
        파이썬에는 이미 있습니다. <code>from bisect import bisect_left, bisect_right</code> 를 쓰고, 개수는{" "}
        <code>bisect_right(a, x) - bisect_left(a, x)</code> 입니다.
      </p>
      <p className="algo-next">
        다음 장에서는 정렬된 줄이 없어도 쓰는 이분 탐색, 답을 이분 탐색하는 방법을 봅니다.
      </p>
    </main>
  );
}
