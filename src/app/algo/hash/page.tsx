import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { HashPlayer } from "@/components/algo/HashPlayer";
import { HashReveal } from "@/components/algo/HashReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { hashTape, firstScanStep, HASH_NAMES, HASH_TARGET } from "@/lib/algo/hash";

const BIG = 1_000_000;

export const metadata: Metadata = {
  title: "해시",
  description: "사물함을 번호 대신 이름으로 찾기",
};

export default async function HashPage() {
  const tape = await highlightTape(hashTape(HASH_NAMES, HASH_TARGET));
  const askAt = firstScanStep(tape);

  return (
    <main className="algo-page">
      <p className="algo-crumb">자료구조</p>
      <h1 className="algo-title">해시</h1>
      <p className="algo-lede">사물함을 번호 대신 이름으로 찾기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <HashReveal>
        <ul className="algo-keys">
          <li>
            <b>이름을 번호로 바꿔 칸을 바로 찾아가는 방법</b> = <strong>해시(hash)</strong>
          </li>
          <li>
            <b>이름을 번호로 바꾸는 규칙</b> = <strong>해시 함수</strong>
          </li>
          <li>
            <b>두 이름이 같은 칸을 가리키는 일</b> = <strong>충돌</strong>
          </li>
        </ul>
        <p>
          파이썬의 <code>dict</code> 와 <code>set</code> 이 이 방법을 씁니다. 리스트의 <code>x in arr</code> 은 칸을 처음부터 N 번 훑습니다. <code>set</code> 은 칸 번호를
          계산해 바로 엽니다.
        </p>
        <Counter
          rows={[
            { label: `리스트에서 in · ${BIG.toLocaleString("ko-KR")}칸`, n: BIG, unit: "칸" },
            { label: `set 에서 in · ${BIG.toLocaleString("ko-KR")}개`, n: 1, unit: "칸" },
          ]}
          caption="맨 끝 값을 찾을 때 열어 보는 칸 수(set 은 평균 한두 칸). 이 컴퓨터에서 직접 재 보니 리스트 약 0.005초, set 약 0.000002초였습니다. 컴퓨터마다 다릅니다."
        />
      </HashReveal>

      {/* ③ 조건 짚기 */}
      <h2>같은 이름은 언제나 같은 칸이다</h2>
      <ul className="algo-keys">
        <li>
          <b>규칙이 고정이다</b> — <code>kim</code> 은 언제 넣어도 1번 칸이다. 그래서 찾을 때도 같은 계산 한 번이면 칸이 나온다
        </li>
        <li>
          <b>칸 안만 훑는다</b> — <code>zed</code> 를 찾으려면 3번 칸 하나만 열면 된다. 8칸 전부를 볼 일이 없다
        </li>
        <li>
          <b>칸 번호가 곧 순서가 아니다</b> — 먼저 넣었다고 앞 칸에 가지 않는다. <code>kim</code> 은 1번, <code>tom</code> 은 0번이었다
        </li>
        <li>
          <b>한 칸에 몰리면 느려진다</b> — 이어 붙은 줄이 길수록 칸 안을 오래 훑는다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 칸을 계산하는 한 줄이 중심이다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘겨 보세요. 이름표가 칸에 들어가고, 찾을 때는 칸 안만 훑습니다. 위 ① 의 이름표 여섯 개와 같습니다.
      </p>

      <HashPlayer
        tape={tape}
        title="사물함 8칸에 이름표를 넣고 하나를 찾는 모습"
        pause={{
          at: askAt,
          ask: (
            <>
              찾는 이름 <code>zed</code> 는 3번 칸입니다. 이 칸 안에서 이름표를 몇 개나 꺼내 보게 될까요?
            </>
          ),
          options: [
            { label: "8개 — 사물함 전부" },
            { label: "1개" },
            { label: "2개 — 3번 칸에 든 bob 과 zed", correct: true },
          ],
          why: (
            <>
              계산으로 칸이 정해지니 <strong>3번 칸만</strong> 엽니다. 거기에는 bob, zed 둘이 이어 붙어 있어 차례로 봅니다. 8칸을 다 열
              일은 없습니다.
            </>
          ),
        }}
      />

      <ul className="algo-keys">
        <li>
          <b>
            <code>sum(ord(c) for c in name) % 8</code>
          </b>{" "}
          — 글자 번호를 모두 더해 8로 나눈 나머지 = 칸 번호. <code>ord(&quot;a&quot;)</code> 는 97
        </li>
        <li>
          <b>
            <code>buckets[slot].append(name)</code>
          </b>{" "}
          — 그 칸에 이름표를 이어 붙인다
        </li>
        <li>
          <b>
            <code>for who in buckets[slot]</code>
          </b>{" "}
          — 찾을 때는 그 칸 안만 훑는다
        </li>
      </ul>
      <p>진짜 <code>dict</code> 는 글자 합이 아니라 더 잘 섞는 계산을 쓰고, 칸 수도 알아서 늘립니다. 원리는 같습니다.</p>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            <code>tom</code> 이 0번 칸에 들어 있습니다. 글자 순서만 다른 <code>mot</code> 을 넣으면 어느 칸으로 갈까요? (m=109, o=111, t=116)
          </>
        }
        options={[
          { label: "1번 칸 — kim 이 있는 칸" },
          { label: "6번 칸 — lee 가 있는 칸" },
          { label: "0번 칸 — tom 과 같은 칸", correct: true },
        ]}
        why={
          <>
            글자 번호를 더하는 계산은 순서를 보지 않습니다. <code>mot</code> 의 합도 336이고 8로 나눈 나머지가 0이라, 이름이 달라도 <code>tom</code> 과 같은 0번 칸입니다. 진짜 파이썬의 해시는 글자
            순서까지 섞어서 이런 일이 훨씬 드뭅니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>해시에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>x in 리스트</code> 를 반복문 안에서
          </b>{" "}
          — 10만 개에서 맨 끝 값을 2천 번 찾아 보니 리스트 약 1.2초, set 약 0.00007초였다. 반복문 안의 <code>in</code> 은 set 으로 바꾼다
        </li>
        <li>
          <b>리스트는 키가 못 된다</b> — <code>{"{[1, 2]: 1}"}</code> 은 <code>TypeError</code>(<code>unhashable type: &apos;list&apos;</code>)가 난다. 안의 값이 바뀌면 칸 번호가 달라지기 때문이다. 튜플{" "}
          <code>(1, 2)</code> 는 된다
        </li>
        <li>
          <b>칸 번호는 믿지 않는다</b> — 진짜 <code>hash(&quot;kim&quot;) % 8</code> 을 두 번 실행해 보니 5 와 3 이 나왔다. 실행할 때마다 값이 다르다
        </li>
        <li>
          <b>
            <code>dict</code> 순서는 넣은 순서다
          </b>{" "}
          — 파이썬 3.7 부터 그렇다. 칸 번호 순서가 아니다
        </li>
        <li>
          <b>모두 한 칸에 몰리면</b> — 해시가 전부 0이 되게 만든 키 3천 개를 넣어 보니 약 0.14초, 정상이면 약 0.0004초였다. 평균 한 번이 N 번이 된다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>있는지 빨리 확인</b>
        <b>몇 번 나왔는지 세기</b>
        <b>두 수의 합</b>
      </div>
      <p>
        두 수의 합은 &ldquo;짝이 이미 나왔나&rdquo;를 <code>set</code> 한 번으로 확인합니다. 반복문 안에 <code>in 리스트</code> 가 있으면 set 으로 바꿀 자리입니다.
      </p>
      <p className="algo-next">다음 장에서는 가장 급한 것부터 꺼내는 힙을 봅니다.</p>
    </main>
  );
}
