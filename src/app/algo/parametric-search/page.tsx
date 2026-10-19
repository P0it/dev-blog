import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { ParamPlayer } from "@/components/algo/ParamPlayer";
import { ParamReveal } from "@/components/algo/ParamReveal";
import { ParamLine } from "@/components/algo/ParamLine";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { PILES, LIMIT_HOURS, paramTape } from "@/lib/algo/parametric-search";
import { worstCaseGuesses } from "@/lib/algo/up-down";
import { timeLabel } from "@/lib/algo/big-o";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import type { Tape } from "@/lib/algo/types";

const BIG = 1_000_000_000;

/** 11번 줄(되는지 묻는 줄) 직후에 한 번 묻는다. 된 속도는 버리지 않고 hi 에 남긴다는 걸 짚는다. */
function pauseFor(tape: Tape): PlayerPause | undefined {
  const at = tape.steps.findIndex((s) => s.line === 11);
  if (at < 0) return undefined;
  const { mid, hours } = tape.steps[at].vars;
  const ok = hours <= LIMIT_HOURS;
  const hi = { label: `hi — ${mid} 도 답일 수 있으니 남기고, 더 빠른 속도만 버린다` };
  const lo = { label: `lo — ${mid} 은 됐으니 그보다 느린 속도를 버린다` };
  const none = { label: "둘 다 그대로 — 됐으니 여기서 끝이다" };
  return {
    at: at + 1,
    ask: `먼저 예상해 보세요. 속도가 ${mid}일 때 ${hours}시간이 걸립니다. ${LIMIT_HOURS}시간 ${ok ? "이하라 됩니다" : "을 넘어 안 됩니다"}. 다음에 움직이는 것은 무엇일까요?`,
    options: ok ? [{ ...hi, correct: true }, lo, none] : [{ label: `lo — ${mid} 이하는 전부 안 되니 버린다`, correct: true }, hi, none],
    why: ok
      ? `속도가 ${mid}일 때 되지만 더 느려도 되는 속도가 있을 수 있습니다. 그래서 ${mid} 은 답 후보로 남기고 hi 를 ${mid} 에 둡니다. 더 빠른 속도는 해 볼 필요 없이 되니 버립니다.`
      : `속도가 ${mid}일 때 안 되면 그보다 느린 속도도 전부 안 됩니다. 그래서 lo 를 ${mid} 바로 다음으로 옮깁니다.`,
  };
}

export const metadata: Metadata = {
  title: "답을 이분 탐색하기",
  description: "되는지 안 되는지만 물어보기",
};

export default async function ParametricSearchPage() {
  const tape = await highlightTape(paramTape(PILES, LIMIT_HOURS));
  const values = Array.from({ length: Math.max(...PILES) }, (_, i) => i + 1);

  return (
    <main className="algo-page">
      <p className="algo-crumb">탐색</p>
      <h1 className="algo-title">답을 이분 탐색하기</h1>
      <p className="algo-lede">되는지 안 되는지만 물어보기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        바나나 더미 네 개(<strong>3 · 6 · 7 · 11개</strong>)를 <strong>{LIMIT_HOURS}시간</strong> 안에 다 먹어야 합니다.
        한 시간에 한 더미만 먹고, 남아도 그 시간은 끝납니다. 한 시간에 몇 개씩 먹으면 될지 속도를 골라 보세요.
      </p>

      <ParamReveal>
        <p className="algo-chain">
          값을 찾는 게 아니라 <b>되는지 안 되는지</b>만 묻기
          <span>안 됨 → 됨이 한 번 바뀌는 자리 = 답</span>
        </p>
        <p>
          이분 탐색을 정렬된 줄이 아니라 <strong>답이 될 수 있는 값</strong>(속도)에 쓴 것 = <strong>답을 이분 탐색하기</strong>
          (파라메트릭 서치)입니다. 속도 하나를 시험할 때마다 후보가 절반씩 줄었습니다.
        </p>
        <Counter
          rows={[
            { label: "속도를 하나씩 시험", n: BIG, unit: "번" },
            { label: "반씩 줄이며 시험", n: worstCaseGuesses(BIG), unit: "번" },
          ]}
          caption={`속도 후보가 10억 개일 때 시험하는 횟수. 하나씩 하면 Python 으로 약 ${timeLabel(Math.log10(BIG))}, 반씩이면 1초 안입니다.`}
        />
      </ParamReveal>

      {/* ③ 조건 짚기 */}
      <h2>안 됨 다음에 됨이 한 번만 바뀐다</h2>
      <ParamLine />
      <ul className="algo-keys">
        <li>
          <b>느린 속도에서 안 되면</b> — 더 느린 속도도 전부 안 된다
        </li>
        <li>
          <b>되는 속도에서는</b> — 더 빠른 속도도 전부 된다. 해 보지 않아도 칸이 칠해진 이유다
        </li>
        <li>
          <b>되다 안 되다 하면</b> — 반씩 버릴 수 없다. 한 번만 바뀌어야 쓴다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>되는지 묻는 함수 하나와 이분 탐색</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>can_finish</code>
          </b>{" "}
          — 속도 하나를 받아 걸리는 시간을 더해 {LIMIT_HOURS}시간 이하인지만 답한다. 문제마다 바뀌는 곳은 여기뿐이다
        </li>
        <li>
          <b>
            <code>(p + speed - 1) // speed</code>
          </b>{" "}
          — 남아도 그 시간은 끝나는 올림이다
        </li>
        <li>
          <b>
            <code>hi = mid</code>
          </b>{" "}
          — 되면 mid 도 답일 수 있어 버리지 않고 남긴다
        </li>
      </ul>
      <p>
        <strong>다음</strong>을 눌러 보세요. 중간에 한 번 물어봅니다. 흐리게 지워진 칸은 안 되는 속도로 확정, 초록 칸은 되는
        속도로 확정입니다. <code>can_finish</code> 안(2~5번 줄)은 한 스텝으로 묶었습니다.
      </p>

      <ParamPlayer tape={tape} values={values} pause={pauseFor(tape)} />

      {/* ⑤ 확인 문제 — 오답은 같은 코드가 다른 제한 시간에서 실제로 돌려주는 값이다 */}
      <Quiz
        question={`같은 코드로 제한 시간만 ${LIMIT_HOURS}시간에서 11시간으로 늘리면 가장 느린 속도는 얼마일까요?`}
        options={[
          { label: `4 — 시간이 늘어도 속도는 그대로` },
          { label: "2 — 시간이 늘었으니 속도가 확 줄어든다" },
          { label: "3", correct: true },
        ]}
        why={
          <>
            속도가 3일 때 1 + 2 + 3 + 4 = <strong>10시간</strong>이라 11시간 안에 됩니다. 속도가 2일 때는 15시간이라 안
            됩니다. 4는 {LIMIT_HOURS}시간 제한의 답이고, 2는 15시간 제한의 답입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 — 아래 값은 모두 실제 Python 3.14 에서 돌려 확인했다 */}
      <h2>답을 이분 탐색할 때 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>올림을 빼면</b> — <code>p // speed</code> 는 남은 바나나를 무시한다. 속도가 3일 때 8시간으로 나와 답이 3이
          되는데, 실제로는 10시간이 걸린다
        </li>
        <li>
          <b>
            <code>lo &lt;= hi</code> 와 <code>hi = mid</code> 를 섞으면
          </b>{" "}
          — lo 와 hi 가 4 로 만나도 mid 가 4 라서 hi 가 다시 4 가 된다. 끝나지 않는다
        </li>
        <li>
          <b>상한을 작게 잡으면</b> — <code>hi</code> 를 3 으로 시작하면 3 이 나오는데 3 으로는 10시간이 걸려 안 된다.
          상한은 반드시 되는 속도여야 한다
        </li>
        <li>
          <b>
            <code>hi = mid - 1</code> 로 쓰면
          </b>{" "}
          — 되는 mid 를 버려서 답을 놓친다. 제한이 6시간이면 답은 6인데 5가 나온다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>최댓값의 최솟값 · 최솟값의 최댓값</b>
        <b>~할 수 있는 가장 작은 값</b>
        <b>후보가 너무 많아 하나씩 해 볼 수 없다</b>
      </div>
      <p>
        되는지 판정하는 함수만 만들 수 있으면 됩니다. 판정이 한 번만 바뀌는 문제라면 이분 탐색이 나머지를 해 줍니다.
      </p>
      <p className="algo-next">다음 장에서는 한 걸음씩 번져 가며 최단 거리를 재는 격자 BFS 를 봅니다.</p>
    </main>
  );
}
