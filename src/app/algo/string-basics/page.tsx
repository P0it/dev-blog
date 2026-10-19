import type { Metadata } from "next";
import Link from "next/link";
import { highlightTape } from "@/lib/algo/highlight";
import { PalPlayer } from "@/components/algo/PalPlayer";
import { PalReveal } from "@/components/algo/PalReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { palTape, PAL_WORDS } from "@/lib/algo/string-basics";
import type { Tape } from "@/lib/algo/types";

export const metadata: Metadata = {
  title: "문자열과 회문",
  description: "뒤집어도 같은 말",
};

/** 단어마다 첫 쌍을 견주기 전에 한 번 묻는다. 정답은 늘 세 번째 보기. */
function pauseFor(word: string, tape: Tape): PlayerPause {
  const cs = Array.from(word);
  const at = tape.steps.findIndex((s) => s.line === 4);
  const same = cs[0] === cs[cs.length - 1];
  const keep = { label: "같다 — 그러면 안쪽 한 쌍으로 간다" };
  const stop = { label: "다르다 — 그러면 여기서 끝난다" };
  const unknown = { label: "알 수 없다 — 끝까지 봐야 안다" };
  return {
    at,
    ask: (
      <>
        누르기 전에 맞혀 보세요. 맨 앞 글자는 「{cs[0]}」, 맨 뒤 글자는 「{cs[cs.length - 1]}」입니다. 두 글자는 같을까요?
      </>
    ),
    options: same ? [stop, unknown, { ...keep, correct: true }] : [keep, unknown, { ...stop, correct: true }],
    why: same ? (
      <>같은 글자입니다. 이 쌍은 통과해서 left 와 right 가 한 칸씩 안쪽으로 갑니다.</>
    ) : (
      <>
        다른 글자입니다. 5번 줄 <code>return False</code> 로 바로 끝납니다. 나머지 글자는 볼 필요가 없습니다.
      </>
    ),
  };
}

export default async function StringBasicsPage() {
  const tapes: Record<string, Tape> = {};
  for (const w of PAL_WORDS) tapes[w] = await highlightTape(palTape(w));
  const pauses: Record<string, PlayerPause> = {};
  for (const w of PAL_WORDS) pauses[w] = pauseFor(w, tapes[w]);

  return (
    <main className="algo-page">
      <p className="algo-crumb">문자열</p>
      <h1 className="algo-title">문자열과 회문</h1>
      <p className="algo-lede">뒤집어도 같은 말</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <PalReveal>
        <p className="algo-chain">
          기 ↔ 기 → 가운데 러
          <span>같은 한 쌍만 견주면 끝났습니다. 가운데 글자는 짝이 없어도 됩니다.</span>
        </p>
        <p>
          앞에서 읽으나 뒤에서 읽으나 같은 말 = <strong>회문</strong>(palindrome)
        </p>
        <ul className="algo-keys">
          <li>
            <b>
              <code>s[0]</code>
            </b>{" "}
            — 글자마다 0번부터 번호가 있다. 맨 앞 글자가 0번이다
          </li>
          <li>
            <b>
              <code>len(s)</code>
            </b>{" "}
            — 글자 수. 「기러기」 는 3이고 마지막 글자는 <code>s[len(s) - 1]</code> 또는 <code>s[-1]</code> 이다
          </li>
          <li>
            <b>한 줄 방법</b> — <code>s == s[::-1]</code> 은 글자를 거꾸로 뒤집은 새 문자열과 같은지 본다
          </li>
        </ul>
        <Counter
          rows={[
            { label: "한 쌍씩 견주기 · 모두 같은 100만 글자", n: 17.2, unit: "ms" },
            { label: "뒤집어 비교 · 모두 같은 100만 글자", n: 0.49, unit: "ms" },
            { label: "한 쌍씩 견주기 · 첫 글자부터 다른 100만 글자", n: 0.003, unit: "ms" },
            { label: "뒤집어 비교 · 첫 글자부터 다른 100만 글자", n: 0.41, unit: "ms" },
          ]}
          caption="Python 3.14 에서 직접 잰 값이고 컴퓨터마다 다릅니다. 한 줄 방법은 C 로 돌아서 회문일 때 더 빠르고, 한 쌍씩 견주는 쪽은 첫 쌍부터 다르면 바로 멈춥니다."
        />
        <p>
          한 쌍씩 안쪽으로 좁히는 방법은 앞 장의 <Link href="/algo/two-pointers">투 포인터</Link> 와 같습니다.
        </p>
      </PalReveal>

      {/* ③ 조건 짚기 */}
      <h2>짝은 앞에서 i번째와 뒤에서 i번째다</h2>
      <ul className="algo-keys">
        <li>
          <b>짝</b> — 맨 앞과 맨 뒤, 그다음 앞에서 둘째와 뒤에서 둘째. 바깥에서 안쪽으로 한 쌍씩 짝이 된다
        </li>
        <li>
          <b>가운데</b> — 두 끝이 만나면 끝난다. 글자 수가 홀수면 가운데 한 글자는 짝이 없어도 된다
        </li>
        <li>
          <b>하나라도 다르면</b> — 거기서 바로 멈춘다. 나머지 쌍은 볼 필요가 없다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 양끝 번호 둘이 전부다</h2>
      <p>
        단어를 골라 <strong>다음</strong>을 눌러 보세요. 짝이 같으면 두 끝이 안쪽으로 한 칸씩 가고, 다르면 5번 줄에서 끝납니다.
      </p>

      <PalPlayer words={PAL_WORDS} tapes={tapes} pauses={pauses} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>left</code> · <code>right</code>
          </b>{" "}
          — 지금 견주는 앞 글자와 뒤 글자의 번호
        </li>
        <li>
          <b>
            <code>s[left] != s[right]</code>
          </b>{" "}
          — 짝이 다르면 5번 줄에서 <code>False</code> 로 끝난다
        </li>
        <li>
          <b>
            <code>left &lt; right</code>
          </b>{" "}
          — 두 끝이 만나거나 엇갈리면 반복이 끝나고 <code>True</code>
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question="abca 에 같은 코드를 돌립니다. 몇 쌍을 견주고 끝날까요?"
        options={[
          { label: "1쌍 — 첫 쌍에서 끝난다" },
          { label: "2쌍 — 안쪽 b 와 c 에서 끝난다", correct: true },
          { label: "4쌍 — 글자를 하나씩 모두 견준다" },
        ]}
        why={
          <>
            첫 쌍 a 와 a 는 같아서 통과합니다. 안쪽 b 와 c 는 달라서 두 번째 쌍에서 <code>return False</code> 로 끝납니다. 4쌍을
            견주는 경우는 없습니다. 글자가 4개라도 쌍은 최대 2개입니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>문자열에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>문자열은 못 바꾼다</b> — <code>s[0] = &apos;a&apos;</code> 는 <code>TypeError: &apos;str&apos; object does not support item
          assignment</code>. 글자를 고치려면 새 문자열을 만든다
        </li>
        <li>
          <b>문장은 먼저 거른다</b> — <code>A man, a plan, a canal: Panama</code> 는 그대로 <code>False</code> 다. 대소문자와 공백,
          기호를 걸러 <code>amanaplanacanalpanama</code> 로 만들어야 <code>True</code> 다. <code>lower()</code> 와{" "}
          <code>isalnum()</code> 을 쓴다
        </li>
        <li>
          <b>
            <code>left &lt;= right</code>
          </b>{" "}
          — 써도 결과는 같다. a·b·c 로 만든 6글자 이하의 모든 문자열을 돌려 확인했다. 가운데 글자를 자기 자신과 한 번 더 견줄 뿐이다
        </li>
        <li>
          <b>빈 문자열과 한 글자</b> — 견줄 쌍이 없어서 둘 다 <code>True</code> 다. 반복문이 한 번도 돌지 않는다
        </li>
        <li>
          <b>한글의 길이</b> — <code>len(&apos;가&apos;)</code> 는 1이다. 자모로 풀어 쓴 문자열(NFD)에서는 <code>가</code> 가 2,{" "}
          <code>각</code> 이 3이 되어 길이가 달라진다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>앞뒤로 읽어도 같다</b>
        <b>양끝에서 안쪽으로 좁힌다</b>
        <b>문자열을 뒤집거나 잘라 비교한다</b>
      </div>
      <p className="algo-next">다음 장에서는 유클리드가 2300년 전에 푼 최대공약수를 봅니다.</p>
    </main>
  );
}
