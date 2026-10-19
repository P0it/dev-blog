import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { PsortPlayer } from "@/components/algo/PsortPlayer";
import { PsortReveal } from "@/components/algo/PsortReveal";
import { Quiz } from "@/components/algo/Quiz";
import { keyTape, CARDS } from "@/lib/algo/python-sort";

export const metadata: Metadata = {
  title: "Python sort 와 key",
  description: "실전에서는 이 한 줄이면 된다",
};

/** 플레이어가 멈춰 묻는 스텝 — 두 번째 카드(lee)의 key 를 만드는 줄. 첫 카드의 key 를 본 뒤라 규칙을 짐작할 수 있다. */
const ASK_AT = 5;

export default async function PythonSortPage() {
  const tape = await highlightTape(keyTape(CARDS));

  return (
    <main className="algo-page">
      <p className="algo-crumb">정렬</p>
      <h1 className="algo-title">Python sort 와 key</h1>
      <p className="algo-lede">실전에서는 이 한 줄이면 된다</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <PsortReveal>
        <ul className="algo-keys">
          <li>
            <b>기준을 묶어 한 줄로</b> — <code>sorted(cards, key=lambda c: (-c[1], c[0]))</code>
          </li>
          <li>
            <b>
              <code>key</code>
            </b>{" "}
            — 카드마다 정렬용 값을 한 번씩 만들어 그 값으로 줄 세우는 함수. <code>lambda c: …</code> 는 카드 <code>c</code> 를 받아 값을 돌려주는 이름 없는 한 줄 함수
          </li>
          <li>
            <b>같은 값은 원래 순서를 지킨다</b> = <strong>안정 정렬</strong>. 이름순이 점수순 뒤에도 살아남은 이유
          </li>
        </ul>
        <p>
          이 정렬 도구가 <code>sorted</code> 입니다. 리스트에는 같은 일을 제자리에서 하는 <code>sort()</code> 도 있습니다.
        </p>
      </PsortReveal>

      {/* ③ 조건 짚기 */}
      <h2>방향이 다른 기준은 부호로 맞춘다</h2>
      <ul className="algo-keys">
        <li>
          <b>점수는 높은 순, 이름은 abc순</b> — 방향이 서로 다르다. 점수의 부호를 바꾸면 높은 점수가 작은 값이 되어 앞에 선다
        </li>
        <li>
          <b>
            <code>reverse=True</code> 는 key 전체를 뒤집는다
          </b>{" "}
          — 이름까지 거꾸로 선다. 80점끼리 <code>zed → kim → amy</code>
        </li>
        <li>
          <b>문자열에는 부호가 없다</b> — <code>-&apos;kim&apos;</code> 은 <code>TypeError</code>. 이름만 거꾸로 하고 싶으면 이름을 거꾸로 먼저 정렬하고 점수순을 나중에 정렬한다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 key 를 만들고, key 로 줄 세운다</h2>
      <p>
        <code>sorted(key=…)</code> 가 안에서 하는 일을 풀어 쓴 코드입니다. 줄 세우는 알고리즘은 앞 장에서 본 정렬들과 비슷한 방법이고 여기서는 보이지 않습니다. ①과 같은 카드 여섯 장으로{" "}
        <strong>다음</strong>을 눌러 key 가 한 장씩 만들어지는 걸 보세요.
      </p>

      <PsortPlayer
        tape={tape}
        title="카드마다 key 를 만들고 key 로 줄 세우는 모습"
        pause={{
          at: ASK_AT,
          ask: (
            <>
              lee 카드의 점수는 90 입니다. 다음 줄에서 만드는 key 는 무엇일까요?
            </>
          ),
          options: [
            { label: "(90, 'lee')" },
            { label: "('lee', -90)" },
            { label: "(-90, 'lee')", correct: true },
          ],
          why: (
            <>
              kim 의 key 가 <code>(-80, &apos;kim&apos;)</code> 이었습니다. 점수의 부호를 바꿔 <strong>첫째 값</strong>에 두고, 이름을 둘째 값에 둡니다. 첫째 값이 같을
              때만 둘째 값을 봅니다.
            </>
          ),
        }}
      />

      <ul className="algo-keys">
        <li>
          <b>
            <code>key = (-score, name)</code>
          </b>{" "}
          — 점수는 부호를 바꿔 첫째 값에, 이름은 둘째 값에 둔다
        </li>
        <li>
          <b>
            <code>keyed.sort()</code>
          </b>{" "}
          — 튜플은 첫째 값부터 견주고, 같으면 다음 값을 본다
        </li>
        <li>
          <b>끝나면</b> — lee 와 tom(90점)이 앞, 80점 amy·kim·zed, 마지막이 bob(70점)
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            점수만 보고 낮은 순으로 한 번 정렬합니다. <code>sorted(cards, key=lambda c: c[1])</code>. 원래 줄은 <code>kim → lee → amy → bob → tom → zed</code> 입니다. 80점 세 사람은
            어떤 순서로 설까요?
          </>
        }
        options={[
          { label: "amy → kim → zed (이름순)" },
          { label: "zed → amy → kim (원래 줄의 거꾸로)" },
          { label: "kim → amy → zed (원래 줄 순서)", correct: true },
        ]}
        why={
          <>
            key 가 같으면 <strong>원래 순서를 지킵니다</strong>. 원래 줄이 kim, amy, zed 순이라 그대로 나옵니다. 이름은 key 에 없으니 이름순으로 서려면 이름도
            key 에 넣어야 합니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>sort() 와 문자열 숫자에서 틀린다</h2>
      <ul className="algo-keys">
        <li>
          <b>
            <code>a = a.sort()</code>
          </b>{" "}
          — <code>sort()</code> 는 제자리에서 정렬하고 <code>None</code> 을 돌려준다. 이렇게 쓰면 <code>a</code> 가 <code>None</code> 이 된다. 새 리스트가 필요하면 <code>sorted(a)</code>
        </li>
        <li>
          <b>숫자 모양 문자열</b> — <code>sorted([&apos;10&apos;, &apos;9&apos;, &apos;2&apos;])</code> 는 <code>[&apos;10&apos;, &apos;2&apos;, &apos;9&apos;]</code>. 글자 순서로 견주기 때문이다.{" "}
          <code>key=int</code> 를 주면 <code>[&apos;2&apos;, &apos;9&apos;, &apos;10&apos;]</code>
        </li>
        <li>
          <b>숫자와 문자열을 섞으면</b> — <code>sorted([3, &apos;a&apos;])</code> 는 <code>TypeError</code>. 견줄 수 없는 두 값이 만나서다
        </li>
        <li>
          <b>정렬이 느리지 않다</b> — 이 컴퓨터에서 10만 장을 key 로 정렬하는 데 약 0.03초였다. 컴퓨터마다 다르다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>여러 기준으로 정렬</b>
        <b>정렬 기준을 직접 정한다</b>
        <b>N log N 이면 충분한 정렬</b>
      </div>
      <p>
        원리를 보려고 직접 짠 앞의 정렬들과 달리 실전에서는 <code>sorted()</code> 한 줄이면 됩니다. 파이썬의 정렬은 병합 정렬과 삽입 정렬을 섞은 방식(Timsort)이라 N log N 입니다. 이미 정렬된
        입력에는 훨씬 빠릅니다 — 이 컴퓨터에서 정렬된 10만 개가 약 0.0003초였습니다.
      </p>
      <p className="algo-next">다음 장에서는 앞에서부터 하나씩 찾는 선형 탐색을 봅니다.</p>
    </main>
  );
}
