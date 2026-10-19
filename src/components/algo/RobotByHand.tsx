"use client";

import { useState } from "react";
import {
  ROOM,
  ROOM_COLS,
  START,
  COMMANDS,
  ARROWS,
  DIR_NAMES,
  DIR_OBJ,
  stepCommand,
  finalCell,
  unblockedCell,
  distance,
  type Pose,
} from "@/lib/algo/simulation";

export type RobotResult = { guess: number; predicted: boolean; wrong: number; end: { r: number; c: number } };

const CMDS = [...COMMANDS];
const WALLS = ROOM.flat().map((v) => v === 1);
const END = finalCell(ROOM, START, COMMANDS);
const ACTUAL = distance(START, END);
const FREE = distance(START, unblockedCell(START, COMMANDS));
const START_CELL = START.r * ROOM_COLS + START.c;

/** 처음 막히는 F 의 번호 — 그 명령 앞에서 "어떻게 될까"를 한 번 묻는다. */
const MINI_AT = (() => {
  let pose: Pose = { ...START, d: 0 };
  for (let i = 0; i < CMDS.length; i++) {
    const s = stepCommand(ROOM, pose, CMDS[i]);
    if (s.block) return i;
    pose = s.pose;
  }
  return -1;
})();

/** 처음 칸에서 몇 칸 떨어져 서게 될까. 정답은 세 번째 — 막히는 명령이 있어서 "다 따랐을 때(6칸)"와 다르다. */
const PREDICT = [
  { label: `${FREE}칸 — 명령을 전부 그대로 따랐을 때`, value: FREE },
  { label: "0칸 — 제자리로 돌아온다", value: 0 },
  { label: `${ACTUAL}칸`, value: ACTUAL },
];

/** 막히는 F 앞에서 묻는 보기. 정답은 첫 번째. */
const MINI = [
  { label: "제자리에 서 있는다", correct: true },
  { label: "한 칸 앞으로 간다" },
  { label: "벽을 넘어 두 칸 간다" },
];

/**
 * ① 직접 해 보기 — 로봇에게 내린 명령 여덟 개를 **한 글자씩 대신 실행**한다.
 *
 * 알고리즘 용어가 없다. 타이핑도 없다. F 는 로봇이 갈 칸을 누르고, R·L 은 새 방향을 누른다. 여기서 허용하는 동작이 곧
 * 시뮬레이션의 동작이라(명령을 시키는 대로, 막히면 제자리) ② 되짚기가 ① 을 반증하지 않는다. 막히는 규칙은 미리 알려 주지 않는다 —
 * 첫 막힘 앞에서 예측 한 번을 하고 겪는다. ④ 플레이어와 같은 방·같은 명령을 쓴다.
 * 모두 하면 `onDone`, 처음부터를 누르면 `onReset`.
 */
export function RobotByHand({ onDone, onReset }: { onDone?: (r: RobotResult) => void; onReset?: () => void }) {
  const [guess, setGuess] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [pose, setPose] = useState<Pose>({ ...START, d: 0 });
  const [trail, setTrail] = useState<number[]>([START_CELL]);
  const [mini, setMini] = useState<number | null>(null);
  const [wrong, setWrong] = useState(0);
  const [notice, setNotice] = useState("");

  const finished = idx >= CMDS.length;
  const cmd = finished ? null : CMDS[idx];
  const asking = guess !== null && !finished && idx === MINI_AT && mini === null;
  const here = pose.r * ROOM_COLS + pose.c;

  /** 명령 하나를 따라 한 결과를 반영한다. 맞게 눌렀을 때만 부른다. */
  const apply = (msg: string) => {
    const s = stepCommand(ROOM, pose, cmd!);
    const next = idx + 1;
    setPose(s.pose);
    if (cmd === "F" && !s.block) setTrail((t) => [...t, s.pose.r * ROOM_COLS + s.pose.c]);
    setIdx(next);
    setNotice(msg);
    if (next >= CMDS.length) {
      onDone?.({ guess: guess ?? 0, predicted: guess === ACTUAL, wrong, end: { r: s.pose.r, c: s.pose.c } });
    }
  };

  const clickCell = (i: number) => {
    if (guess === null) return setNotice("먼저 로봇이 몇 칸 떨어져 서게 될지 골라 주세요.");
    if (finished) return;
    if (asking) return setNotice("먼저 이 F 가 어떻게 될지 골라 주세요.");
    if (cmd !== "F") return setNotice(`이번 명령은 ${cmd}이에요. 칸이 아니라 아래 방향 버튼에서 새 방향을 눌러 주세요.`);

    const s = stepCommand(ROOM, pose, "F");
    const target = s.pose.r * ROOM_COLS + s.pose.c;
    if (i === target) {
      return apply(
        s.block
          ? `${s.block === "wall" ? "앞 칸이 벽" : "앞이 방 바깥"}이라 로봇은 제자리에 서 있었어요.`
          : `로봇이 ${DIR_OBJ[pose.d]} 향해 한 칸 갔어요.`,
      );
    }
    setWrong((w) => w + 1);
    if (s.block) {
      setNotice(
        `${s.block === "wall" ? "앞 칸은 벽" : "앞은 방 바깥"}이라 못 가요. 막히면 로봇은 제자리에 서요. 로봇이 있는 칸을 눌러 주세요.`,
      );
    } else if (i === here) {
      setNotice(`F 는 앞으로 한 칸 가는 명령이에요. 로봇은 ${DIR_OBJ[pose.d]} 보고 있으니 그쪽 앞 칸을 눌러 주세요.`);
    } else {
      setNotice(`F 는 보고 있는 쪽(${ARROWS[pose.d]})으로 딱 한 칸만 가요.`);
    }
  };

  const clickDir = (d: number) => {
    if (guess === null) return setNotice("먼저 로봇이 몇 칸 떨어져 서게 될지 골라 주세요.");
    if (finished) return;
    if (asking) return setNotice("먼저 이 F 가 어떻게 될지 골라 주세요.");
    if (cmd === "F") return setNotice("이번 명령은 F 예요. 로봇이 갈 칸을 눌러 주세요.");
    const s = stepCommand(ROOM, pose, cmd!);
    if (d === s.pose.d) {
      return apply(`${cmd === "R" ? "오른쪽(시계 방향)" : "왼쪽(반시계 방향)"}으로 90도 돌아서 이제 ${DIR_OBJ[d]} 봐요. 칸은 그대로예요.`);
    }
    setWrong((w) => w + 1);
    setNotice(
      `${cmd}은 ${cmd === "R" ? "오른쪽(시계 방향)" : "왼쪽(반시계 방향)"}으로 90도예요. ${ARROWS[pose.d]} ${DIR_OBJ[pose.d]} 보고 있으니 ${ARROWS[s.pose.d]} 쪽이 돼요.`,
    );
  };

  const reset = () => {
    setGuess(null);
    setIdx(0);
    setPose({ ...START, d: 0 });
    setTrail([START_CELL]);
    setMini(null);
    setWrong(0);
    setNotice("");
    onReset?.();
  };

  const ask =
    guess === null
      ? "방에 로봇(▲)이 서 있어요. 명령 줄을 한 글자씩 따라 해요. F 는 앞으로 한 칸 가고, R 은 오른쪽으로, L 은 왼쪽으로 90도 돌아요. 명령 8개를 다 하고 나면 로봇은 처음 칸에서 몇 칸 떨어져 있을까요?"
      : finished
        ? `내 예상 ${guess}칸, 실제 ${ACTUAL}칸 — ${guess === ACTUAL ? "맞았습니다" : "달랐습니다"}`
        : asking
          ? `${idx + 1}번째 명령은 F 예요. 앞 칸은 벽(어두운 칸)이에요. 로봇은 어떻게 될까요?`
          : cmd === "F"
            ? `목표: 명령을 다 하고 난 뒤 로봇이 서 있는 칸 찾기. ${idx + 1}번째 명령 F — 로봇이 이 명령 뒤에 설 칸을 눌러 주세요`
            : `목표: 명령을 다 하고 난 뒤 로봇이 서 있는 칸 찾기. ${idx + 1}번째 명령 ${cmd} — 로봇이 이 명령 뒤에 볼 방향을 눌러 주세요`;

  return (
    <section className="algo-byhand" aria-label="로봇 명령 따라 하기">
      <p className="algo-byhand-ask">{ask}</p>

      {guess === null && (
        <div className="algo-guess" role="group" aria-label="로봇은 처음 칸에서 몇 칸 떨어져 서게 될까요?">
          {PREDICT.map((o) => (
            <button key={o.label} type="button" aria-pressed={guess === o.value} onClick={() => setGuess(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      <p className="algo-sim-cmds" aria-label={`명령 ${CMDS.join(" ")}`}>
        {CMDS.map((c, i) => (
          <span key={i} className="algo-sim-cmd" data-s={i === idx && !finished ? "now" : i < idx ? "done" : "todo"}>
            {c}
          </span>
        ))}
      </p>

      {asking && (
        <div className="algo-guess" role="group" aria-label="이 F 는 어떻게 될까요?">
          {MINI.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => {
                setMini(MINI.indexOf(o));
                setNotice(
                  o.correct
                    ? "맞아요. 벽이라서 못 가요. 막히면 로봇은 제자리에 서요."
                    : "벽은 지나갈 수 없어요. 막히면 로봇은 제자리에 서요.",
                );
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="algo-grid" style={{ gridTemplateColumns: `repeat(${ROOM_COLS}, minmax(0, 36px))` }}>
        {WALLS.map((wall, i) => (
          <button
            key={i}
            type="button"
            className="algo-gcell algo-sim-cell"
            data-kind={wall ? "wall" : "floor"}
            data-robot={i === here ? "" : undefined}
            data-trail={trail.includes(i) && i !== here ? "" : undefined}
            onClick={() => clickCell(i)}
            aria-label={
              i === here
                ? `로봇이 ${DIR_OBJ[pose.d]} 보고 서 있는 칸`
                : wall
                  ? "벽"
                  : `${Math.floor(i / ROOM_COLS)}행 ${i % ROOM_COLS}열`
            }
          >
            {i === here ? ARROWS[pose.d] : wall ? "벽" : trail.includes(i) ? "·" : ""}
          </button>
        ))}
      </div>

      <div className="algo-sim-pad" role="group" aria-label="방향 고르기">
        {ARROWS.map((a, d) => (
          <button key={d} type="button" onClick={() => clickDir(d)} aria-label={DIR_NAMES[d]}>
            <b>{a}</b> {DIR_NAMES[d]}
          </button>
        ))}
      </div>

      <p className="algo-notice" role="status">
        {notice || " "}
      </p>

      <div className="algo-byhand-foot">
        <span>
          끝낸 명령 <b>{idx}</b> / {CMDS.length}
        </span>
        <button type="button" onClick={reset}>
          처음부터
        </button>
      </div>
    </section>
  );
}
