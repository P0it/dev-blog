import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { GapPlayer } from "@/components/algo/GapPlayer";
import { LineReveal } from "@/components/algo/LineReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { insertFrontTape, LINE_PEOPLE, NEW_PERSON } from "@/lib/algo/array-list";

const BIG = 1_000_000;

export const metadata: Metadata = {
  title: "배열과 리스트",
  description: "왜 맨 앞에 끼우면 느릴까",
};

export default async function ArrayListPage() {
  const tape = await highlightTape(insertFrontTape(LINE_PEOPLE, NEW_PERSON));

  // 처음 한 칸을 밀기 직전에 한 번 묻는다
  const pause: PlayerPause = {
    at: tape.steps.findIndex((s) => s.line === 5),
    ask: <>누르기 전에 맞혀 보세요. 빈자리는 {LINE_PEOPLE.length}번 칸입니다. 다음에 한 칸 뒤로 가는 사람은 누구일까요?</>,
    options: [
      { label: `${LINE_PEOPLE.length - 1}번 칸 사람 — 빈자리 바로 앞`, correct: true },
      { label: "0번 칸 사람 — 줄 맨 앞" },
      { label: `${LINE_PEOPLE.length}명 모두 한꺼번에` },
    ],
    why: (
      <>
        빈자리 <strong>바로 앞</strong> 사람이 먼저 갑니다. 앞쪽 사람부터 밀면 바로 뒤에 선 사람 자리를 덮어씁니다.
      </>
    ),
  };

  return (
    <main className="algo-page">
      <p className="algo-crumb">자료구조</p>
      <h1 className="algo-title">배열과 리스트</h1>
      <p className="algo-lede">왜 맨 앞에 끼우면 느릴까</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <LineReveal>
        <p className="algo-chain">
          맨 앞 = {LINE_PEOPLE.length}번 · 맨 뒤 = 0번
          <span>맨 앞에 끼우면 줄 선 사람이 전부 한 칸씩 움직입니다.</span>
        </p>
        <Counter
          rows={[
            { label: `맨 앞에 끼우기 · 줄 ${(BIG / 10_000).toLocaleString("ko-KR")}만 명`, n: BIG, unit: "번 밉니다" },
            { label: `맨 뒤에 붙이기 · 줄 ${(BIG / 10_000).toLocaleString("ko-KR")}만 명`, n: 0, unit: "번 밉니다" },
          ]}
          caption="줄이 길수록 맨 앞에 끼울 때 밀 사람이 그만큼 늘어납니다. 맨 뒤는 길이와 상관없습니다."
        />
        <ul className="algo-keys">
          <li>
            <b>칸이 번호 순서로 딱 붙은 줄 = 배열</b> — 파이썬에서는 <code>list</code>
          </li>
          <li>
            <b>
              <code>arr.insert(0, x)</code>
            </b>{" "}
            — 맨 앞에 끼우기. 줄 길이 N 만큼 민다. <strong>O(N)</strong>
          </li>
          <li>
            <b>
              <code>arr.append(x)</code>
            </b>{" "}
            — 맨 뒤에 붙이기. 밀기 0번. <strong>O(1)</strong>
          </li>
        </ul>
      </LineReveal>

      {/* ③ 조건 짚기 */}
      <h2>왜 밀어야 할까</h2>
      <ul className="algo-keys">
        <li>
          <b>칸이 딱 붙어 있다</b> — 중간에 빈칸이 없다. 끼우려면 뒤 사람을 전부 밀어야 한다
        </li>
        <li>
          <b>맨 뒤는 비어 있다</b> — 밀 사람이 없으니 그냥 붙이면 된다
        </li>
        <li>
          <b>그 대신 번호로 바로 간다</b> — 3번 칸은 번호만 알면 줄을 세지 않고 곧장 찾아간다
        </li>
      </ul>
      <p>
        가끔은 <code>append</code> 도 오래 걸립니다. 칸이 꽉 차면 더 큰 자리로 줄 전체를 옮겨 가기 때문입니다. 파이썬은 그때 조금
        넉넉하게 더 잡아 둡니다. 그래서 평균하면 <code>append</code> 한 번이 칸 하나 옮기는 일 정도입니다.
      </p>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 뒤에서부터 한 칸씩 민다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 빈자리가 맨 앞으로 오는 걸 보세요.
      </p>

      <GapPlayer tape={tape} values={[...LINE_PEOPLE, 0]} title="줄 맨 앞에 끼우려고 뒤에서부터 한 칸씩 미는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>arr.append(None)</code>
          </b>{" "}
          — 줄 맨 뒤에 빈자리를 하나 만든다
        </li>
        <li>
          <b>
            <code>range(len(arr) - 1, 0, -1)</code>
          </b>{" "}
          — 뒤에서 앞으로 센다. 앞에서부터 밀면 뒤 사람을 덮어쓴다
        </li>
        <li>
          <b>
            <code>moved</code>
          </b>{" "}
          — 한 칸 밀 때마다 1 오른다. 끝나면 줄 길이와 같다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            줄이 {BIG.toLocaleString("ko-KR")}명인 리스트에 <code>arr.insert(0, x)</code> 를 한 번 하면 몇 명이 움직일까요?
          </>
        }
        options={[
          { label: "1명 — 맨 앞 칸만 바꾸면 되니까" },
          { label: "약 20명 — 반씩 줄여 가며 자리를 찾으니까" },
          { label: `약 ${BIG.toLocaleString("ko-KR")}명 — 전부 한 칸씩`, correct: true },
        ]}
        why={
          <>
            칸이 딱 붙어 있어서 <strong>전부</strong> 뒤로 한 칸씩 갑니다. 맨 앞 칸 하나만 바꾸는 일은 <code>arr[0] = x</code> 입니다. 그건 끼우는 게
            아니라 원래 있던 사람을 덮어쓰는 일입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>한 줄이어도 한 번이 아니다</h2>
      <p>아래 시간은 Python 3.14 에서 직접 잰 값입니다. 컴퓨터마다 달라서 비율만 보세요.</p>
      <ul className="algo-keys">
        <li>
          <b>
            <code>arr.pop(0)</code>
          </b>{" "}
          — 맨 앞을 빼면 나머지를 한 칸씩 당긴다. 10만 칸에서 5만 번 하면 0.58초. <code>arr.pop()</code> 은 0.0015초
        </li>
        <li>
          <b>
            <code>arr.insert(0, x)</code>
          </b>{" "}
          — 맨 앞 끼우기를 10만 번 하면 1.6초. <code>append</code> 10만 번은 0.002초
        </li>
        <li>
          <b>
            <code>x in arr</code>
          </b>{" "}
          — 앞에서부터 하나씩 본다. 100만 칸에서 맨 끝 값을 찾는 데 약 0.005초. 반복문 안에서 1,000번 쓰면 약 5초
        </li>
        <li>
          <b>
            <code>arr[1:]</code>
          </b>{" "}
          — 줄을 통째로 복사한 새 리스트다. 반복문 안에서 <code>arr = arr[1:]</code> 을 하면 칸 수만큼 복사가 되풀이된다
        </li>
      </ul>
      <p>
        줄 서기(맨 앞에서 빼고 맨 뒤에 넣기)를 리스트로 흉내 내면 <code>pop(0)</code> 이 계속 나옵니다. 다음 쪽의 <code>deque</code> 는 같은 일을 한
        번에 1번으로 합니다.
      </p>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>맨 앞에서 넣고 뺀다</b>
        <b>줄(큐)을 리스트로 짠다</b>
        <b>반복문 안에서 in 을 쓴다</b>
      </div>
      <p className="algo-next">다음 장에서는 한쪽 끝에서만 넣고 빼는 스택을 봅니다.</p>
    </main>
  );
}
