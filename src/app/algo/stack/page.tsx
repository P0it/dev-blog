import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import type { Tape } from "@/lib/algo/types";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { BracketPlayer } from "@/components/algo/BracketPlayer";
import { StackReveal } from "@/components/algo/StackReveal";
import { Quiz } from "@/components/algo/Quiz";
import { bracketTape, BRACKET_OK, BRACKET_BAD } from "@/lib/algo/stack";

export const metadata: Metadata = {
  title: "스택",
  description: "왜 Ctrl+Z 는 방금 한 것부터 되돌릴까",
};

/** 첫 닫는 괄호를 읽는 스텝 — 그 글자가 드러나기 전에 "넣을까 꺼낼까"를 묻는다. */
function firstCloseStep(t: Tape): number {
  return t.steps.findIndex((s) => {
    const i = s.stage.flags.i;
    return s.line === 4 && i !== undefined && ")]}".includes(s.stage.chars?.[i] ?? "");
  });
}

export default async function StackPage() {
  const [okTape, badTape] = await Promise.all([
    highlightTape(bracketTape(BRACKET_OK)),
    highlightTape(bracketTape(BRACKET_BAD)),
  ]);

  const pauses: Record<"ok" | "bad", PlayerPause> = {
    ok: {
      at: firstCloseStep(okTape),
      ask: (
        <>
          누르기 전에 맞혀 보세요. 다음 글자는 닫는 괄호 <code>{"}"}</code> 이고 스택 맨 위는 <code>{"{"}</code> 입니다. 어떻게 할까요?
        </>
      ),
      options: [
        { label: "맨 위 { 를 꺼낸다 — 짝이다", correct: true },
        { label: "} 를 스택에 올린다" },
        { label: "짝이 안 맞는다 — 여기서 끝낸다" },
      ],
      why: (
        <>
          <code>{"}"}</code> 의 짝은 <code>{"{"}</code> 이고 맨 위가 바로 <code>{"{"}</code> 라서 꺼냅니다. 맨 위만 볼 수 있으니 안쪽에서 열린 괄호부터 닫혀야 합니다.
        </>
      ),
    },
    bad: {
      at: firstCloseStep(badTape),
      ask: (
        <>
          누르기 전에 맞혀 보세요. 다음 글자는 닫는 괄호 <code>)</code> 이고 스택 맨 위는 <code>{"{"}</code> 입니다. 어떻게 할까요?
        </>
      ),
      options: [
        { label: "맨 위 { 를 꺼낸다" },
        { label: ") 를 스택에 올린다" },
        { label: "짝이 안 맞는다 — 여기서 끝낸다", correct: true },
      ],
      why: (
        <>
          <code>)</code> 의 짝은 <code>(</code> 인데 맨 위는 <code>{"{"}</code> 입니다. 가운데 깔린 <code>(</code> 는 꺼낼 수 없으니 이 문자열은 짝이 안 맞습니다.
        </>
      ),
    },
  };

  return (
    <main className="algo-page">
      <p className="algo-crumb">자료구조</p>
      <h1 className="algo-title">스택</h1>
      <p className="algo-lede">왜 Ctrl+Z 는 방금 한 것부터 되돌릴까</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <StackReveal>
        <p className="algo-chain">
          글자 굵게 → 그림 넣기 → 색 바꾸기
          <span>한 순서입니다. 되돌릴 때는 거꾸로 된 순서로 나갔습니다.</span>
        </p>
        <p>
          나중에 넣은 것이 먼저 나오는 더미 = <strong>스택</strong>
        </p>
      </StackReveal>

      {/* ③ 조건 짚기 */}
      <h2>왜 맨 위만 꺼낼 수 있을까</h2>
      <ul className="algo-keys">
        <li>
          <b>열린 쪽이 한 곳</b> — 넣을 때도 꺼낼 때도 맨 위다
        </li>
        <li>
          <b>가운데는 못 꺼낸다</b> — 위에서 가운데 일을 눌렀을 때 안 된다고 한 이유다
        </li>
        <li>
          <b>그래서</b> — 가장 나중에 들어온 것이 가장 먼저 나온다
        </li>
      </ul>
      <p>
        괄호도 같습니다. <code>{"( [ { } ] )"}</code> 에서 안쪽 <code>{"{ }"}</code> 가 가장 나중에 열려서 가장 먼저 닫힙니다.
      </p>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 쌓고 걷는 두 줄이 전부다</h2>
      <p>
        문자열을 고르고 <strong>다음</strong>을 눌러 한 줄씩 넘기세요. 여는 괄호는 쌓이고 닫는 괄호는 맨 위와 짝을 맞춘 뒤 걷힙니다.
      </p>

      <BracketPlayer tapes={{ ok: okTape, bad: badTape }} pauses={pauses} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>stack.append(c)</code>
          </b>{" "}
          — 여는 괄호를 맨 위에 올린다
        </li>
        <li>
          <b>
            <code>stack[-1]</code>
          </b>{" "}
          — 맨 위를 본다. 꺼내지 않고 보기만 한다
        </li>
        <li>
          <b>
            <code>stack.pop()</code>
          </b>{" "}
          — 맨 위를 꺼낸다. 짝이 맞을 때만 한다
        </li>
        <li>
          <b>
            <code>return not stack</code>
          </b>{" "}
          — 다 읽고 나서 스택이 비어 있어야 짝이 맞다
        </li>
      </ul>
      <p>
        파이썬에는 스택이 따로 없습니다. 리스트의 <strong>맨 뒤</strong>에서만 넣고 빼면 그게 스택입니다.
      </p>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            문자열 <code>{"( ( )"}</code> 을 끝까지 읽었습니다. 스택에는 무엇이 남을까요?
          </>
        }
        options={[
          { label: "비어 있다 — 짝이 다 맞았다" },
          { label: ") 하나가 남는다" },
          { label: "( 하나가 남는다 — 짝이 안 맞는다", correct: true },
        ]}
        why={
          <>
            <code>(</code> 두 개가 쌓이고 <code>)</code> 가 맨 위 <code>(</code> 하나를 꺼내서 <code>(</code> 하나가 남습니다. 스택이 비지 않았으니 <code>return not stack</code> 은 <code>False</code> 입니다. 닫는 괄호는 스택에 올리지 않아서 <code>)</code> 가 남는 일은 없습니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>비었는데 꺼내면 터진다</h2>
      <ul className="algo-keys">
        <li>
          <b>
            빈 스택에서 <code>pop()</code>
          </b>{" "}
          — <code>)</code> 하나만 있는 문자열에서 <code>IndexError</code> 가 난다. 먼저 <code>not stack</code> 으로 비었는지 본다
        </li>
        <li>
          <b>
            <code>stack[-1]</code> 도 같다
          </b>{" "}
          — 비었으면 <code>IndexError</code> 다. 코드 8번 줄이 <code>not stack or …</code> 로 먼저 거르는 이유다
        </li>
        <li>
          <b>다 읽었는데 남았다</b> — <code>{"( ( )"}</code> 는 닫는 괄호가 모자란 것이다. 마지막 줄을 <code>return True</code> 로 쓰면 틀린 문자열에 <code>True</code> 라고 답한다
        </li>
        <li>
          <b>
            <code>pop(0)</code>
          </b>{" "}
          — 맨 앞을 꺼내면 나머지를 한 칸씩 당긴다. 10만 개를 이렇게 다 꺼내면 칸을 약 50억 번 옮긴다. 꺼낼 때는 <code>pop()</code>
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>괄호</b>
        <b>되돌리기 · 가장 최근</b>
        <b>같은 쌍이 안쪽부터 끝난다</b>
      </div>
      <p className="algo-next">다음 장에서는 먼저 온 것부터 나가는 큐와 덱을 봅니다.</p>
    </main>
  );
}
