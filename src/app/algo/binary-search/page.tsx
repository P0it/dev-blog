import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { SearchPlayer, type SearchTarget } from "@/components/algo/SearchPlayer";
import { GameReveal } from "@/components/algo/GameReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { binarySearchTape, type Variant } from "@/lib/algo/binary-search";
import { worstCaseGuesses } from "@/lib/algo/up-down";
import { josa } from "@/lib/algo/josa";
import type { Tape } from "@/lib/algo/types";
import type { PlayerPause } from "@/components/algo/TapePlayer";

const VALUES = [7, 12, 19, 23, 31, 42, 55, 68, 71, 90];
const TARGETS: SearchTarget[] = [
  { value: 42, label: "42 · 가운데쯤" },
  { value: 7, label: "7 · 맨 앞" },
  { value: 90, label: "90 · 맨 끝" },
  { value: 50, label: "50 · 없는 값" },
];

/** 첫 비교 뒤에 left 와 right 중 어느 쪽이 움직일지 한 번 묻는다. 막대의 양 끝이 움직이는 걸 먼저 떠올리게 한다. */
function pauseFor(tape: Tape, target: number): PlayerPause | undefined {
  const at = tape.steps.findIndex((s) => s.line === 7);
  if (at < 0) return undefined;
  const mid = tape.steps[at].vars.mid;
  const smaller = VALUES[mid] < target;
  const left = { label: "left — mid 다음 칸으로 가서 왼쪽을 버린다" };
  const right = { label: "right — mid 앞 칸으로 가서 오른쪽을 버린다" };
  return {
    at: at + 1,
    ask: `먼저 예상해 보세요. ${mid}번 칸의 ${josa(VALUES[mid], "은", "는")} 찾는 값 ${target}보다 ${smaller ? "작습니다" : "큽니다"}. 다음에 움직이는 것은 무엇일까요?`,
    options: smaller ? [{ ...left, correct: true }, right] : [left, { ...right, correct: true }],
    why: smaller
      ? `${josa(target, "은", "는")} mid 의 값보다 더 오른쪽에 있습니다. 그래서 막대의 왼쪽 끝(left)이 mid 다음 칸으로 옮겨 가고 왼쪽이 통째로 버려집니다.`
      : `${josa(target, "은", "는")} mid 의 값보다 더 왼쪽에 있습니다. 그래서 막대의 오른쪽 끝(right)이 mid 앞 칸으로 옮겨 가고 오른쪽이 통째로 버려집니다.`,
  };
}

export const metadata: Metadata = {
  title: "이분 탐색",
  description: "업-다운 게임 잘하는 법",
};

export default async function BinarySearchPage() {
  // 찾는 값 4개 × 코드 2종. 색은 서버에서 한 번만 칠해 넘긴다
  const tapes: Record<string, Tape> = {};
  const pauses: Record<string, PlayerPause | undefined> = {};
  for (const variant of ["ok", "lt"] as Variant[]) {
    for (const t of TARGETS) {
      const tape = await highlightTape(binarySearchTape(VALUES, t.value, variant));
      tapes[`${variant}-${t.value}`] = tape;
      pauses[`${variant}-${t.value}`] = pauseFor(tape, t.value);
    }
  }

  return (
    <main className="algo-page">
        <p className="algo-crumb">탐색</p>
        <h1 className="algo-title">이분 탐색</h1>
        <p className="algo-lede">업-다운 게임 잘하는 법</p>

        {/* ① 직접 해 보기 → ② 되짚기 */}
        <p>
          제가 <strong>1~100</strong> 중 하나를 정했습니다. 몇 번 만에 맞히는지 해 보세요.
        </p>

        <GameReveal>
          <p>
            <strong>가운데를 부르면 절반이 날아갑니다.</strong> 어느 쪽 답이 오든 똑같습니다.
          </p>
          <p className="algo-chain">
            100 → 50 → 25 → 13 → 7 → 4 → 2 → <b>1</b>
            <span>일곱 번. 운이 나빠도 일곱 번.</span>
          </p>
          <p>
            매번 절반씩 버리는 방법 = <strong>이분 탐색</strong>
          </p>
        </GameReveal>

        {/* ③ 조건 짚기 */}
        <h2>이분 탐색은 정렬된 줄에서만 쓸 수 있다</h2>
        <ul className="algo-keys">
          <li>
            <b>버릴 수 있던 이유</b> — 왼쪽이 전부 더 작다고 알기 때문
          </li>
          <li>
            <b>섞여 있으면</b> — 가운데가 작아도 왼쪽에 큰 수가 있다. 못 버린다
          </li>
          <li>
            <b>신호</b> — 문제에 &ldquo;오름차순으로 주어진다&rdquo;
          </li>
        </ul>

        {/* ④ 코드와 플레이어 */}
        <h2>코드는 방금 한 게임을 그대로 옮긴 것이다</h2>
        <p>게임 막대와 코드의 이름이 이렇게 겹칩니다. 먼저 읽어 두세요.</p>
        <ul className="algo-keys">
          <li>
            <b>
              <code>left</code> <code>right</code>
            </b>{" "}
            — 아까 막대의 왼쪽 끝과 오른쪽 끝. 둘 사이가 &ldquo;남은 후보&rdquo;다
          </li>
          <li>
            <b>
              <code>mid</code>
            </b>{" "}
            — 여러분이 부른 수. 막대의 가운데
          </li>
        </ul>
        <p>
          찾는 값을 골라 <strong>다음</strong>을 눌러 보세요. 중간에 한 번 물어봅니다.
        </p>

        <SearchPlayer values={VALUES} targets={TARGETS} tapes={tapes} pauses={pauses} />

        {/* ⑤ 확인 문제 — 오답은 같은 코드가 다른 입력에서 실제로 하는 행동이다 */}
        <Quiz
          question="42 대신 12를 찾는다면, 첫 질문 뒤에 어느 쪽이 버려질까요?"
          options={[
            { label: "오른쪽 — 31과 그 뒤쪽이 버려진다", correct: true },
            { label: "왼쪽 — 31과 그 앞쪽이 버려진다. 42를 찾을 때 일어난 일" },
            { label: "아무것도 안 버린다 — 31은 12가 아니니까" },
          ]}
          why={
            <>
              가운데 31이 12보다 큽니다. 31과 그 오른쪽이 전부 날아가고 왼쪽만 남습니다.
              42를 찾을 때와 방향이 반대입니다. 어느 쪽이든 한 번 물을 때마다 후보는 절반쯤
              줄어듭니다.
            </>
          }
        />

        {/* ⑥ 틀리는 자리 */}
        <h2>이분 탐색은 경계에서 틀린다</h2>
        <ul className="algo-keys">
          <li>
            <b>
              <code>&lt;=</code> 에서 등호를 빼면
            </b>{" "}
            — 한 칸 남았을 때 그 칸을 안 본다. 있어도 &ldquo;없다&rdquo;
          </li>
          <li>
            <b>
              <code>mid + 1</code> 에서 <code>+1</code> 을 빼면
            </b>{" "}
            — 범위가 안 줄어든다. 무한 루프
          </li>
        </ul>
        <p>
          위 플레이어에서 <strong>90</strong>을 고르고 <strong>등호를 뺀 코드</strong>를 눌러 돌려 보세요.
          90은 배열 맨 끝에 있는데도 마지막에 <code>-1</code>이 나옵니다. 후보가 한 칸 남는 순간을 안
          보고 끝내서입니다.
        </p>

        {/* ⑦ 꺼내라는 신호 */}
        <h2>왜 이걸 꺼내나 — N이 클수록 차이가 벌어진다</h2>
        <p>줄의 길이를 <strong>N</strong>이라고 합니다. 맨 앞부터 하나씩 찾을 때와 이분 탐색의 최대 횟수를 견줘 봅니다.</p>
        <Counter
          rows={[
            { label: "맨 앞부터", n: 100, unit: "번" },
            { label: "이분 탐색", n: worstCaseGuesses(100), unit: "번" },
          ]}
          caption="N = 100"
        />
        <Counter
          rows={[
            { label: "맨 앞부터", n: 1000, unit: "번" },
            { label: "이분 탐색", n: worstCaseGuesses(1000), unit: "번" },
          ]}
          caption="N = 1,000"
        />
        <Counter
          rows={[
            { label: "맨 앞부터", n: 1_000_000, unit: "번" },
            { label: "이분 탐색", n: worstCaseGuesses(1_000_000), unit: "번" },
          ]}
          caption="N = 1,000,000. 게임에서 겪은 7번은 N 이 만 배가 되어도 20번까지만 늡니다."
        />

        <h2>이분 탐색을 꺼내라는 세 가지 신호</h2>
        <div className="algo-signals">
          <b>정렬돼 있다</b>
          <b>값 하나를 찾는다</b>
          <b>N이 100만 이상이다</b>
        </div>
        <p>
          줄이 정렬돼 있지 않아도 쓰는 때가 있습니다. 답이 커질수록 &ldquo;된다 / 안 된다&rdquo;가 한 번만
          바뀌는 문제입니다(최소 시간 구하기 같은 것). 답을 이분 탐색하는 이 방법은 뒤쪽 장에서 봅니다.
        </p>
        <p className="algo-next">
          다음 장에서는 같은 값이 여러 개일 때 그중 첫 번째를 어떻게 찾는지 봅니다.
        </p>
    </main>
  );
}
