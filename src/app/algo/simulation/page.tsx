import type { Metadata } from "next";
import { highlightTape } from "@/lib/algo/highlight";
import { RobotPlayer } from "@/components/algo/RobotPlayer";
import { RobotReveal } from "@/components/algo/RobotReveal";
import { Quiz } from "@/components/algo/Quiz";
import type { PlayerPause } from "@/components/algo/TapePlayer";
import {
  robotTape,
  firstBlockedIndex,
  ROOM,
  START,
  COMMANDS,
  finalCell,
  endOfVariant,
} from "@/lib/algo/simulation";

const END = finalCell(ROOM, START, COMMANDS);
/** 확인 문제 — 가운데 L 을 R 로 바꾼 명령 */
const SWAPPED = "FFRFFRFF";
const SWAPPED_END = finalCell(ROOM, START, SWAPPED);
const OPEN_ROOM = ROOM.map((row) => row.map(() => 0));
const OPEN_END = finalCell(OPEN_ROOM, START, SWAPPED);
const NO_EDGE = endOfVariant(ROOM, START, COMMANDS, { edgeCheck: false });
const SWAPPED_DIRS = endOfVariant(ROOM, START, COMMANDS, { dc: [0, -1, 0, 1] });
const cell = (p: { r: number; c: number }) => `(${p.r}, ${p.c})`;

export const metadata: Metadata = {
  title: "시뮬레이션",
  description: "시키는 대로 그대로 하기",
};

export default async function SimulationPage() {
  const raw = robotTape(COMMANDS, ROOM, START.r, START.c);
  const tape = await highlightTape(raw);

  // 처음 막히는 F 의 9번 줄(조건 검사) 앞에서 묻는다 — 8번 줄에서 앞 칸이 막 정해진 자리다
  const at = firstBlockedIndex(raw);
  const there = raw.steps[at];
  const pause: PlayerPause = {
    at,
    ask: (
      <>
        8번 줄에서 앞 칸이 ({there.vars.nr}, {there.vars.nc}) 로 정해졌습니다. 그 칸은 벽(어두운 칸)입니다. 이 F 는 움직일까요, 막힐까요?
      </>
    ),
    options: [
      { label: "움직인다 — 10번 줄로 가서 벽 칸으로 들어간다" },
      { label: "한 칸을 더 가서 벽 너머로 간다" },
      { label: "막힌다 — 10번 줄을 건너뛰고 제자리에 선다", correct: true },
    ],
    why: (
      <>
        9번 줄 조건에 <code>grid[nr][nc] == 0</code> 이 있습니다. 벽 칸은 1이라 조건이 거짓이 되고, <code>r, c = nr, nc</code> 는
        실행되지 않습니다. 로봇은 제자리에 섭니다.
      </>
    ),
  };

  return (
    <main className="algo-page">
      <p className="algo-crumb">백트래킹·구현</p>
      <h1 className="algo-title">시뮬레이션</h1>
      <p className="algo-lede">시키는 대로 그대로 하기</p>

      {/* ① 직접 해 보기 → ② 되짚기 */}
      <p>
        로봇에게 명령 줄이 주어졌습니다. <strong>다 하고 나면 어디에 설지 먼저 고르고</strong> 명령을 한 글자씩 대신
        실행해 보세요.
      </p>

      <RobotReveal>
        <ul className="algo-keys">
          <li>
            <b>한 글자씩 그대로</b> — 명령이 시키는 일을 규칙대로 하나씩 따라 했다
          </li>
          <li>
            <b>막히면</b> — 앞 칸이 벽이든 방 바깥이든 로봇은 제자리에 섰다
          </li>
          <li>
            <b>돌기는</b> — 칸은 그대로고 방향만 바뀌었다
          </li>
        </ul>
        <p>
          규칙을 한 단계씩 그대로 따라 하며 결과를 구하는 방법 = <strong>시뮬레이션(simulation)</strong>
        </p>
        <p>
          방향 네 개를 숫자 두 줄(<code>dr</code>, <code>dc</code>)로 두면 앞 칸은 <code>r + dr[d]</code>, 돌기는{" "}
          <code>d = (d + 1) % 4</code> 한 줄입니다. 이 숫자 두 줄 = <strong>델타 배열</strong>
        </p>
      </RobotReveal>

      {/* ③ 조건 짚기 */}
      <h2>앞 칸이 막혔는지는 움직이기 전에 본다</h2>
      <ul className="algo-keys">
        <li>
          <b>방금 겪은 막힘</b> — 5번째 명령은 벽에, 8번째 명령은 방 바깥에 막혔다. 둘 다 제자리였다
        </li>
        <li>
          <b>순서</b> — 앞 칸을 먼저 계산하고, 갈 수 있는 칸인지 보고, 그다음에 움직인다
        </li>
        <li>
          <b>움직인 뒤에 보면</b> — 로봇이 벽 안에 들어가 있다. 벽은 지나갈 수 없다
        </li>
      </ul>

      {/* ④ 코드와 플레이어 */}
      <h2>코드는 규칙을 한 줄씩 그대로 옮긴 것이다</h2>
      <p>
        위에서 한 것과 <strong>같은 방, 같은 명령</strong>입니다. (r, c) 는 위에서 r번째 줄, 왼쪽에서 c번째 칸이고 0부터
        셉니다. d 는 방향이고 0 위, 1 오른쪽, 2 아래, 3 왼쪽입니다.
      </p>
      <p>
        <strong>다음</strong>을 눌러 한 줄씩 넘기며 명령 줄과 로봇을 보세요.
      </p>

      <RobotPlayer tape={tape} title="명령을 한 글자씩 따라 하는 모습" pause={pause} />

      <ul className="algo-keys">
        <li>
          <b>
            <code>dr</code>·<code>dc</code>
          </b>{" "}
          — d 방향으로 한 칸 갈 때 행·열이 얼마나 바뀌는지. 위(0)는 행이 −1이다
        </li>
        <li>
          <b>
            <code>0 &lt;= nr &lt; rows …</code>
          </b>{" "}
          — 앞 칸이 방 안이고 빈 칸일 때만 참이다. 거짓이면 10번 줄을 건너뛴다
        </li>
        <li>
          <b>
            <code>d = (d + 1) % 4</code>
          </b>{" "}
          — 오른쪽으로 돌기. 3 다음은 다시 0이 된다
        </li>
      </ul>

      {/* ⑤ 확인 문제 */}
      <Quiz
        question={
          <>
            명령 <code>F F R F F L F F</code> 에서 가운데 <code>L</code> 을 <code>R</code> 로 바꾸면 로봇은 어느 칸에 설까요?
          </>
        }
        options={[
          { label: `${cell(SWAPPED_END)} 칸`, correct: true },
          { label: `${cell(END)} 칸 — L 일 때와 같다` },
          { label: `${cell(OPEN_END)} 칸 — 벽이 없는 방이라면 가는 칸` },
        ]}
        why={
          <>
            R 이면 {cell({ r: 1, c: 1 })} 에서 아래를 봅니다. F 한 번에 {cell(SWAPPED_END)} 로 가고, 다음 F 는 {cell({ r: 3, c: 1 })} 이
            벽이라 막혀 제자리입니다. 같은 명령도 방의 벽에 따라 끝 칸이 달라집니다.
          </>
        }
      />

      {/* ⑥ 틀리는 자리 */}
      <h2>시뮬레이션에서 틀리는 자리</h2>
      <ul className="algo-keys">
        <li>
          <b>(행, 열)과 (x, y)를 섞는다</b> — 위로 가면 <b>행이 줄어든다</b>(<code>dr[0] = -1</code>). x, y 로 생각하면 위아래가
          뒤집힌다
        </li>
        <li>
          <b>경계 검사를 빼면</b> — 위·왼쪽 바깥은 에러 없이 <code>grid[-1]</code> 로 반대편 줄을 읽는다. 이 방에서 {cell(END)} 대신{" "}
          {typeof NO_EDGE === "string" ? NO_EDGE : cell(NO_EDGE)} 에 섰다. 오른쪽·아래 바깥은{" "}
          <code>IndexError: list index out of range</code> 가 난다
        </li>
        <li>
          <b>방향 순서를 문제와 맞춘다</b> — 위, 오른쪽, 아래, 왼쪽이 시계 방향이다. 왼쪽과 오른쪽 자리를 바꾸면 같은 명령이{" "}
          {typeof SWAPPED_DIRS === "string" ? SWAPPED_DIRS : cell(SWAPPED_DIRS)} 에서 끝났다
        </li>
        <li>
          <b>
            <code>(d - 1) % 4</code> 는
          </b>{" "}
          — 파이썬은 3이 나온다. 다른 언어는 -1 이 나온다. 그래서 <code>(d + 3) % 4</code> 로 쓰기도 한다
        </li>
        <li>
          <b>
            <code>[[0] * 5] * 5</code> 로 방을 만들면
          </b>{" "}
          — 행이 전부 같은 리스트다. 한 칸에 벽을 세우면 모든 줄의 같은 열이 벽이 된다. <code>[[0] * 5 for _ in range(5)]</code> 로
          만든다
        </li>
      </ul>

      {/* ⑦ 꺼내라는 신호 */}
      <h2>문제에서 이 말이 보이면</h2>
      <div className="algo-signals">
        <b>규칙이 길게 주어진다</b>
        <b>격자 위에서 이동한다</b>
        <b>시키는 대로 구현</b>
      </div>
      <p className="algo-next">다음 장에서는 뒤집어도 같은 말인지 확인하는 문자열과 회문을 봅니다.</p>
    </main>
  );
}
