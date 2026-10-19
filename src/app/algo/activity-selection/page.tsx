import type { Metadata } from "next";
import Link from "next/link";
import { highlightTape } from "@/lib/algo/highlight";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import { MeetPlayer } from "@/components/algo/MeetPlayer";
import { MeetReveal } from "@/components/algo/MeetReveal";
import { Counter } from "@/components/algo/Counter";
import { Quiz } from "@/components/algo/Quiz";
import { meetTape, MEETINGS, NAMES, greedyPick, maxMeetings, runVariant } from "@/lib/algo/activity-selection";
import { ops, timeLabel } from "@/lib/algo/big-o";

const N = 100_000;

export const metadata: Metadata = {
  title: "회의실 배정",
  description: "끝나는 시간이 빠른 것부터",
};

/** "B 회의(10~11시)" 꼴. */
const mt = (i: number) => `${NAMES[i]}(${MEETINGS[i][0]}~${MEETINGS[i][1]}시)`;
const idx = (name: string) => NAMES.indexOf(name);

export default async function ActivitySelectionPage() {
  const tape = await highlightTape(meetTape());

  const start = greedyPick(MEETINGS, "start");
  const short = greedyPick(MEETINGS, "short");
  const end = greedyPick(MEETINGS, "end");

  // 끝나는 시간 순으로 줄 세운 뒤 세 번째 회의(A)를 보기 직전 — 지금 끝은 15시다
  const rows = tape.steps[0].stage.timeline!.rows;
  const ifStep = tape.steps.map((s, i) => (s.line === 6 ? i : -1)).filter((i) => i >= 0);
  const third = rows[2];
  const nowEnd = rows[1].e;
  const pause: PlayerPause = {
    at: ifStep[2],
    ask: (
      <>
        이제 {third.name}({third.s}~{third.e}시)를 봅니다. 지금까지 고른 회의의 끝은 {nowEnd}시입니다. 6번 줄에서 이 회의는 어떻게
        될까요?
      </>
    ),
    options: [
      { label: `건너뛴다 — ${third.s}시에 시작해서 지금 끝 ${nowEnd}시보다 앞이라 겹친다`, correct: true },
      { label: "고른다 — 가장 긴 회의라 가장 좋다" },
      { label: `고른다 — 끝이 ${third.e}시라서 ${nowEnd}시 이후다` },
    ],
    why: (
      <>
        6번 줄은 <strong>시작</strong>을 지금 끝과 비교합니다. {third.name}는 {third.s}시에 시작해서 {nowEnd}시보다 앞이라 이미 고른 회의와 겹칩니다. 건너뜁니다.
      </>
    ),
  };

  // ⑤ 확인 문제 — C 를 지우면
  const rest = MEETINGS.filter((_, i) => i !== idx("C"));
  const afterC = maxMeetings(rest);
  const restPicked = greedyPick(rest, "end").map((k) => NAMES[MEETINGS.indexOf(rest[k])]);

  // ⑥ 코드를 바꿔 돌려 본 값(실제 Python 으로도 같은 값을 확인했다)
  const byStart = runVariant(MEETINGS, { key: "start" });
  const noSort = runVariant(MEETINGS, { key: "none" });
  const touching: [number, number][] = [
    [1, 2],
    [2, 3],
  ];
  const strict = runVariant(touching, { key: "end", strict: true });
  const loose = runVariant(touching, { key: "end" });
  const zero: [number, number][] = [
    [3, 3],
    [1, 3],
  ];
  const endOnly = runVariant(zero, { key: "end_only" });
  const withTie = runVariant(zero, { key: "end" });

  const sortTime = timeLabel(Math.log10(ops("nlogn", N)));

  return (
    <main className="algo-page">
      <p className="algo-crumb">그리디</p>
      <h1 className="algo-title">회의실 배정</h1>
      <p className="algo-lede">끝나는 시간이 빠른 것부터</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <MeetReveal>
        <Counter
          rows={[
            { label: "시작이 빠른 순", n: start.length, unit: "개" },
            { label: "짧은 순", n: short.length, unit: "개" },
            { label: "끝나는 시간 순", n: end.length, unit: "개" },
          ]}
          caption="같은 회의 여섯 개입니다. 고르는 기준만 다릅니다."
        />
        <ul className="algo-keys">
          <li>
            <b>고르는 방법</b> — 끝나는 시간이 가장 빠른 회의부터. 이미 고른 회의와 겹치지 않을 때만 고른다
          </li>
          <li>
            <b>이유</b> — 일찍 끝날수록 뒤에 남는 시간이 많다. 남는 시간이 많을수록 회의가 더 들어간다
          </li>
        </ul>
        <p>
          지금 가장 좋아 보이는 것을 고르고 되돌아보지 않는 방법 = <strong>그리디</strong>. <Link href="/algo/greedy-coins">거스름돈</Link>에서 큰 동전부터 주는 것과 같은 생각입니다.
        </p>
        <p>
          이 문제의 이름은 <strong>회의실 배정</strong>(활동 선택)입니다.
        </p>
      </MeetReveal>

      {/* ③ 조건 짚기 */}
      <h2>고르는 기준이 맞아야 가장 많이 잡힌다</h2>
      <ul className="algo-keys">
        <li>
          <b>시작이 빠른 순</b> — 가장 먼저 시작한 {mt(idx("A"))}가 긴 시간을 혼자 차지해 나머지를 막는다. {start.length}개
        </li>
        <li>
          <b>짧은 순</b> — 가장 짧은 {mt(idx("B"))} 다음에 {mt(idx("E"))}를 고르면 {mt(idx("C"))}와 {mt(idx("F"))}가 둘 다 겹친다. {short.length}개
        </li>
        <li>
          <b>끝나는 시간 순</b> — 어떤 입력에서도 가장 많이 잡힌다. 가장 먼저 끝나는 회의를 고르면 뒤에 남는 시간이 가장 길다. {end.length}개
        </li>
        <li>
          <b>① 에서 본 것</b> — 시작 순과 짧은 순이 진 자리가 바로 반례다. 기준을 바꾸면 결과가 달라진다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 끝나는 시간으로 줄 세운 뒤 한 번 훑는 것이 전부다</h2>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 노란 선(지금까지 고른 회의의 끝)이 오른쪽으로 가는 걸 보세요.
      </p>

      <MeetPlayer tape={tape} pause={pause} title="끝나는 시간이 빠른 회의부터 고르는 모습" />

      <p>
        {tape.steps.length}스텝입니다. 2번 줄에서 회의 순서가 곧바로 끝나는 시간 순으로 바뀝니다. 회의 이름(A~F)은 처음 순서이고, 그림의 줄 순서가 정렬된 순서입니다.
      </p>
      <ul className="algo-keys">
        <li>
          <b>
            <code>key=lambda m: (m[1], m[0])</code>
          </b>{" "}
          — 끝나는 시간으로 줄 세운다. 끝이 같으면 시작이 빠른 쪽이 먼저
        </li>
        <li>
          <b>
            <code>if s &gt;= end</code>
          </b>{" "}
          — 시작이 지금 끝 이후일 때만 고른다. 끝과 시작이 맞닿아도 고른다
        </li>
        <li>
          <b>
            <code>end = e</code>
          </b>{" "}
          — 고른 회의의 끝이 새 기준이 된다
        </li>
      </ul>
      <p>
        정렬이 일의 대부분입니다. 회의가 {N.toLocaleString("ko-KR")}개면 약 {ops("nlogn", N).toLocaleString("ko-KR")}번이고 {sortTime}에 끝납니다.
      </p>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            회의 {mt(idx("C"))}를 지우면, 같은 코드는 회의를 몇 개 잡을까요?
          </>
        }
        options={[
          { label: `${afterC}개 — ${restPicked.join(" 다음에 ")} 를 잡는다`, correct: true },
          { label: `${end.length}개 — ${NAMES[idx("C")]}가 없어도 처음과 같다` },
          { label: `${start.length}개 — ${NAMES[idx("A")]} 하나만 잡는다` },
        ]}
        why={
          <>
            끝이 빠른 순서는 {rows
              .filter((r) => r.name !== "C")
              .map((r) => r.name)
              .join(" → ")}입니다. B 를 고른 뒤 A 는 B 와 겹쳐 건너뛰고, E({MEETINGS[idx("E")][0]}시 시작)는 겹치지 않아 고릅니다. 그 뒤 D 와 F 는 E 의 끝{" "}
              {MEETINGS[idx("E")][1]}시보다 앞에 시작해 건너뜁니다. 회의 하나가 빠지면 잡히는 개수도 바뀝니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>회의실 배정에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>정렬 기준을 시작 시간으로 하면</b> — 이 회의들에서 코드가 {byStart}개만 잡는다(제대로는 {end.length}개). 일찍 시작한 긴 회의가 나머지를 막는다
        </li>
        <li>
          <b>정렬을 안 하면</b> — 입력 순서대로 훑어서 이 회의들에서는 {noSort}개가 나온다. 끝나는 시간 순으로 세워야 한다
        </li>
        <li>
          <b>
            <code>s &gt; end</code> 로 쓰면
          </b>{" "}
          — 끝과 시작이 맞닿은 회의를 놓친다. (1, 2)와 (2, 3)이면 {strict}개인데 제대로는 {loose}개다
        </li>
        <li>
          <b>끝이 같을 때 시작 순이 없으면</b> — 시작과 끝이 같은 0분 회의가 있는 문제에서 틀린다. (3, 3)과 (1, 3)이면 {endOnly}개인데 제대로는 {withTie}개다. 그래서 키가{" "}
          <code>(m[1], m[0])</code> 이다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>겹치지 않게 최대 개수</b>
        <b>회의실 배정·스케줄</b>
        <b>끝나는 시간 순으로 정렬</b>
      </div>
      <p className="algo-next">다음 장에서는 가능한 경우를 빠짐없이 만들어 보는 순열과 조합을 봅니다.</p>
    </main>
  );
}
