import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { InsertPlayer } from "@/components/algo/InsertPlayer";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { InsertReveal } from "@/components/algo/InsertReveal";
import { InsertInputs } from "@/components/algo/InsertInputs";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import {
  insertionSortTape,
  countInsertionOps,
  insertionLabels,
  insertionWithoutPlace,
  INSERT_CARDS,
} from "@/lib/algo/insertion-sort";
import { countSelectionOps } from "@/lib/algo/selection-sort";

export const metadata: Metadata = {
  title: "삽입 정렬",
  description: "카드를 한 장씩 끼워 넣기",
};

export default async function InsertionSortPage() {
  const tape = await highlightTape(insertionSortTape(INSERT_CARDS));
  const ins = countInsertionOps(INSERT_CARDS);
  const sel = countSelectionOps(INSERT_CARDS);

  // 예측 한 번 — 7 을 받아 9 를 민 뒤, 다음에 견줄 5 가 밀릴지
  const stop = tape.steps.findIndex((s) => s.line === 5 && s.vars.key === 7 && s.vars.j === 2);
  const pause: PlayerPause = {
    at: stop,
    ask: <>9 를 한 칸 밀었습니다. 다음에 견줄 카드는 5 입니다. 손에 든 7 과 견주면 어떻게 될까요?</>,
    options: [
      { label: "5 도 7 보다 커서 한 칸 밀린다" },
      { label: "5 와 7 의 자리를 서로 바꾼다" },
      { label: "5 는 7 보다 크지 않아서 여기서 멈춘다 — 7 이 빈자리에 놓인다", correct: true },
    ],
    why: (
      <>
        <code>arr[j] &gt; key</code> 가 거짓이 되면 반복이 끝납니다. 5 는 7 보다 크지 않습니다. 그래서 다음 줄{" "}
        <code>arr[j + 1] = key</code> 로 7 이 빈자리에 놓입니다.
      </>
    ),
  };

  const pairs: [number, string][] = [
    [2, "a"],
    [2, "b"],
    [1, "c"],
  ];
  const sortedPairs: [number, string][] = [
    [1, "a"],
    [1, "b"],
    [2, "c"],
  ];

  return (
    <main className="algo-page">
      <p className="algo-crumb">정렬</p>
      <h1 className="algo-title">삽입 정렬</h1>
      <p className="algo-lede">카드를 한 장씩 끼워 넣기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        카드 여섯 장을 작은 수부터 왼쪽에 늘어놓아 보세요. 한 장씩 받아서 왼쪽에 모인 카드 사이에 끼워 넣을 자리를 찾습니다.
      </p>

      <InsertReveal>
        <p className="algo-chain">
          집는다 → 큰 카드를 민다 → 놓는다
          <span>카드 한 장마다 이 세 동작을 했습니다.</span>
        </p>
        <Counter
          rows={[
            { label: "선택 정렬 · 견준 횟수", n: sel.compares, unit: "번" },
            { label: "삽입 정렬 · 견준 횟수", n: ins.compares, unit: "번" },
          ]}
          caption={`같은 카드를 정렬합니다. 밀기 ${ins.shifts}번은 순서가 거꾸로 선 쌍의 수이고, 버블 정렬이 바꾼 ${ins.shifts}번과 같습니다.`}
        />
        <p>
          손패를 늘 정렬해 둔 채 카드를 한 장씩 끼워 넣는 방법 = <strong>삽입 정렬</strong>
        </p>
      </InsertReveal>

      {/* ③ 조건 짚기 */}
      <h2>제자리에 가까울수록 적게 견준다</h2>
      <p>카드 모양을 바꿔 가며 눌러 보세요. 견주는 횟수가 달라집니다.</p>
      <InsertInputs />
      <ul className="algo-keys">
        <li>
          <b>손패는 늘 정렬돼 있다</b> — 아까도 손패는 한 번도 흐트러지지 않았다. 새 카드는 정렬된 줄에 끼우기만 하면 된다
        </li>
        <li>
          <b>이미 정렬된 카드</b> — 카드마다 한 번만 견주고 끝난다. 카드가 n장이면 n−1번이다
        </li>
        <li>
          <b>거꾸로 선 카드</b> — 모든 카드를 맨 앞까지 민다. n(n−1)/2번으로 선택 정렬과 같아진다
        </li>
      </ul>
      <p>
        거꾸로 선 1만 장은 약 5천만 번 견주고, 직접 재 보니 Python 3.14 에서 1.5초 걸렸습니다. 이미 정렬된 1만 장은 0.0004초였습니다.
        컴퓨터마다 다릅니다.
      </p>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 빈자리를 왼쪽으로 옮기는 것이 전부다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 빈자리가 왼쪽으로 옮겨 오는 걸 보세요. <code>j -= 1</code> 줄은 켜지지 않습니다.
        바로 다음 줄에 새 <code>j</code> 가 이미 보입니다.
      </p>

      <InsertPlayer tape={tape} values={INSERT_CARDS} title="카드를 집어 큰 카드를 밀고 빈자리에 놓는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>key</code>
          </b>{" "}
          — 손에 든 카드. 줄 위쪽에 서 있다
        </li>
        <li>
          <b>
            <code>j</code>
          </b>{" "}
          — 지금 견주는 칸. 빈자리 바로 왼쪽이다
        </li>
        <li>
          <b>
            <code>j &gt;= 0 and arr[j] &gt; key</code>
          </b>{" "}
          — 맨 앞이 아니고 그 카드가 더 크면 민다. 아니면 멈춘다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            이미 정렬된 카드 <code>1 2 3 4 5</code> 를 삽입 정렬하면 카드끼리 몇 번 견줄까요?
          </>
        }
        options={[
          { label: `${countInsertionOps([5, 4, 3, 2, 1]).compares}번 — 거꾸로 선 줄이면` },
          { label: `${countInsertionOps([1, 2, 4, 3, 5]).compares}번 — 한 쌍만 어긋난 줄이면` },
          { label: `${countInsertionOps([1, 2, 3, 4, 5]).compares}번`, correct: true },
        ]}
        why={
          <>
            카드마다 왼쪽 카드와 <strong>한 번만</strong> 견주면 끝납니다. 손에 든 카드가 이미 그 자리에 있어서 밀 일이
            없습니다. {countInsertionOps([5, 4, 3, 2, 1]).compares}번은 <code>5 4 3 2 1</code> 처럼 거꾸로 선 줄에서,{" "}
            {countInsertionOps([1, 2, 4, 3, 5]).compares}번은 <code>1 2 4 3 5</code> 처럼 하나가 어긋난 줄에서 나옵니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>삽입 정렬에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>j &gt;= 0</code> 을 빼면
          </b>{" "}
          — 가장 작은 카드가 맨 앞까지 오면 <code>j</code> 가 −1 이 되어 <code>arr[-1]</code>(맨 끝 카드)과 견준다. 곧{" "}
          <code>IndexError: list index out of range</code> 가 난다. 맨 앞까지 가는 카드가 없는 <code>1 2 3</code> 은 그대로 맞게
          나온다
        </li>
        <li>
          <b>
            <code>&gt;</code> 대신 <code>&gt;=</code>
          </b>{" "}
          — 같은 값도 넘어간다. 이미 정렬된 <code>1a 1b 2c</code> 가 {insertionLabels(sortedPairs, ">=").join(" ")} 로 뒤집힌다.{" "}
          <code>&gt;</code> 로 쓰면 <code>2a 2b 1c</code> 가 {insertionLabels(pairs, ">").join(" ")} 로 원래 순서가 지켜진다(안정 정렬).
          선택 정렬은 같은 값의 순서를 지키지 못한다
        </li>
        <li>
          <b>
            마지막 <code>arr[j + 1] = key</code> 를 빼면
          </b>{" "}
          — 손에 든 카드가 어디에도 놓이지 않는다. <code>5 2 9</code> 가 {insertionWithoutPlace([5, 2, 9]).join(" ")} 가 되어 2 가
          사라진다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>이럴 때 꺼낸다</h2>
      <div className="algo-signals">
        <b>거의 정렬돼 있다</b>
        <b>n 이 작다</b>
        <b>하나씩 들어오는 데이터를 바로 정렬해 둔다</b>
      </div>
      <p>
        실전에서 정렬이 필요할 때는 <code>sorted()</code> 한 줄이면 됩니다. 파이썬의 정렬(Timsort)도 짧은 구간은 삽입 정렬 계열로
        정리합니다.
      </p>
      <p className="algo-next">다음 장에서는 반으로 쪼갰다가 정렬된 두 묶음을 합치는 병합 정렬을 봅니다.</p>
    </main>
  );
}
