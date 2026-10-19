import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { PrefixPlayer } from "@/components/algo/PrefixPlayer";
import { RangeReveal } from "@/components/algo/RangeReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { timeLabel } from "@/lib/algo/big-o";
import {
  prefixTape,
  prefixOf,
  rangeSum,
  rangeSumWithoutZero,
  bulkOps,
  handClicks,
  VISITS,
  QUESTIONS,
} from "@/lib/algo/prefix-sum";

const [LEFT, RIGHT] = QUESTIONS[0];
const CELLS = 1_000_000;
const ASKS = 1000;

// ⑤ 확인 문제의 작은 입력
const QUIZ_ARR = [3, 1, 4];
const QUIZ_PREFIX = prefixOf(QUIZ_ARR);

export const metadata: Metadata = {
  title: "누적합",
  description: "구간의 합을 한 번 빼기로",
};

export default async function PrefixSumPage() {
  const tape = await highlightTape(prefixTape(VISITS, LEFT, RIGHT));

  const big = bulkOps(CELLS, ASKS);
  const handAll = QUESTIONS.reduce((a, [l, r]) => a + handClicks(l, r), 0);
  const one = bulkOps(VISITS.length, 1);
  const three = bulkOps(VISITS.length, QUESTIONS.length);

  return (
    <main className="algo-page">
      <p className="algo-crumb">기초 개념</p>
      <h1 className="algo-title">누적합</h1>
      <p className="algo-lede">구간의 합을 한 번 빼기로</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <RangeReveal>
        <Counter
          rows={[
            { label: "방법 A · 칸을 하나씩 더하기", n: handAll, unit: "번" },
            { label: "방법 B · 두 칸만 빼기", n: QUESTIONS.length * 2, unit: "번" },
          ]}
          caption="같은 세 질문. 질문이 늘수록 이 차이가 벌어집니다."
        />
        <p>칸이 100만 개이고 질문이 1000개라면 이렇습니다.</p>
        <Counter
          rows={[
            { label: "방법 A · 질문마다 칸 전부 더하기", n: big.naive, unit: "번" },
            { label: "방법 B · 한 번 깔고 질문마다 두 칸", n: big.prefix, unit: "번" },
          ]}
          caption={`A 는 컴퓨터로 ${timeLabel(Math.log10(big.naive))}, B 는 ${timeLabel(Math.log10(big.prefix))}입니다.`}
        />
        <p>
          줄을 한 번 깔아 두고 구간의 합을 뺄셈 한 번으로 구하는 방법 = <strong>누적합</strong> (<code>prefix sum</code>)
        </p>
        <ul className="algo-keys">
          <li>
            <b>깔아 둔 줄</b> — 앞에서 k칸을 더한 값. 맨 앞은 앞에서 0칸이라 0
          </li>
          <li>
            <b>구간의 합</b> — (끝 칸까지의 합) − (시작 칸 앞까지의 합)
          </li>
        </ul>
      </RangeReveal>

      {/* ③ 조건 짚기 */}
      <h2>질문이 여러 번일 때 이긴다</h2>
      <p>
        방법 B 도 공짜는 아닙니다. 줄을 깔 때 칸 수만큼 일합니다. 10칸에서 세어 보면 이렇습니다.
      </p>
      <Counter
        rows={[
          { label: "질문 1개 · 칸을 하나씩 더하기", n: handClicks(LEFT, RIGHT), unit: "번" },
          { label: "질문 1개 · 깔고 빼기", n: one.prefix, unit: "번" },
          { label: "질문 3개 · 칸을 하나씩 더하기", n: handAll, unit: "번" },
          { label: "질문 3개 · 깔고 빼기", n: three.prefix, unit: "번" },
        ]}
        caption="질문이 하나면 깔 값이 더 듭니다. 셋부터 뒤집힙니다."
      />
      <ul className="algo-keys">
        <li>
          <b>질문이 여러 번</b> — 한 번 깐 줄을 계속 쓴다
        </li>
        <li>
          <b>값이 안 바뀐다</b> — 한 칸이 바뀌면 그 뒤 줄이 전부 틀어진다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 줄을 깔고 두 칸을 읽는다</h2>
      <p>
        방문자 수는 ①과 같은 10칸입니다. {LEFT}번 칸부터 {RIGHT}번 칸까지의 합을 구합니다. <strong>다음</strong>을 눌러 아래 줄이 한 칸씩 깔리는 걸 보세요.
      </p>

      <PrefixPlayer tape={tape} values={VISITS} title="줄을 깔고 구간의 합을 빼는 모습" />

      <ul className="algo-keys">
        <li>
          <b>
            <code>prefix = [0]</code>
          </b>{" "}
          — 앞에서 0칸을 더한 값 0 에서 시작한다
        </li>
        <li>
          <b>
            <code>prefix[i] + arr[i]</code>
          </b>{" "}
          — 앞에서 i칸 합에 i번 칸을 더하면 앞에서 i+1칸 합
        </li>
        <li>
          <b>
            <code>prefix[right + 1] - prefix[left]</code>
          </b>{" "}
          — 끝 칸까지의 합에서 시작 칸 앞까지의 합을 뺀다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            방문자 수가 <code>[3, 1, 4]</code> 이고 깔아 둔 줄이 <code>[0, 3, 4, 8]</code> 입니다. 1번 칸부터 2번 칸까지의 합은?
          </>
        }
        options={[
          { label: `${QUIZ_PREFIX[2] - QUIZ_PREFIX[1]} — prefix[2] − prefix[1]` },
          { label: `${QUIZ_PREFIX[3] - QUIZ_PREFIX[2]} — prefix[3] − prefix[2]` },
          { label: `${rangeSum(QUIZ_PREFIX, 1, 2)} — prefix[3] − prefix[1]`, correct: true },
        ]}
        why={
          <>
            1번 칸과 2번 칸을 더하면 1 + 4 = <strong>{rangeSum(QUIZ_PREFIX, 1, 2)}</strong>. 끝 칸을 넣으려면 <code>right + 1</code>, 시작 칸을 빼지 않으려면
            <code> left</code> 를 씁니다. 첫째 줄은 끝 칸을, 둘째 줄은 시작 칸을 빠뜨린 식입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>맨 앞 0 과 +1 에서 틀린다</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>prefix = [0]</code> 를 빼먹으면
          </b>{" "}
          — 0번 칸부터인 질문에서 틀린다. <code>[3, 1, 4]</code> 의 0번~1번 합은 4 인데 {rangeSumWithoutZero(QUIZ_ARR, 0, 1)} 이 나온다. 오류도 안 난다. 파이썬은 <code>-1</code> 번 칸을 맨 뒤 칸으로 읽는다
        </li>
        <li>
          <b>
            <code>right + 1</code> 을 <code>right</code> 로 쓰면
          </b>{" "}
          — 끝 칸 하나가 빠진다. 깔아 둔 줄의 k 번 칸은 앞에서 k칸이라서 한 칸 밀려 있다
        </li>
        <li>
          <b>값이 중간에 바뀌면</b> — 그 칸 뒤의 줄이 전부 틀어진다. 다시 깔아야 하니 질문 사이에 값이 바뀌는 문제에는 안 맞는다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>구간의 합을 여러 번</b>
        <b>값은 안 바뀐다</b>
        <b>칸 수와 질문 수가 둘 다 크다</b>
      </div>
      <p className="algo-next">
        다음 장부터는 자료구조를 봅니다. 먼저 배열과 리스트입니다.
      </p>
    </main>
  );
}
