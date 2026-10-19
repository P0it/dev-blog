"use client";

import { useState, type ReactNode } from "react";
import { RobotByHand, type RobotResult } from "./RobotByHand";
import { ROOM, START, COMMANDS, posesOf, finalCell, unblockedCell, distance, stepCommand } from "@/lib/algo/simulation";

const POSES = posesOf(ROOM, START, COMMANDS);
const END = finalCell(ROOM, START, COMMANDS);
const ACTUAL = distance(START, END);
const FREE = distance(START, unblockedCell(START, COMMANDS));
/** 칸이 바뀐 자세만 이어 붙인 길 — 돌기와 막힘은 칸이 안 바뀌어 건너뛴다. */
const PATH = POSES.filter((p, i) => i === 0 || p.r !== POSES[i - 1].r || p.c !== POSES[i - 1].c).map((p) => `(${p.r}, ${p.c})`);
const BLOCKED = [...COMMANDS].filter((cmd, i) => cmd === "F" && stepCommand(ROOM, POSES[i], "F").block).length;

/**
 * 명령을 다 따라 하면 뒤 설명이 열린다. 「처음부터」를 누르면 다시 숨고 결과도 비운다.
 *
 * 내 예상과 실제는 이 컴포넌트가 직접 찍는다 — 서버에서 함수를 children 으로 넘길 수 없다.
 */
export function RobotReveal({ children }: { children: ReactNode }) {
  const [res, setRes] = useState<RobotResult | null>(null);

  return (
    <>
      <RobotByHand onDone={setRes} onReset={() => setRes(null)} />
      <div className="algo-reveal" data-shown={res !== null}>
        <p className="algo-island-verdict">
          내 예상 <b>{res?.guess ?? ""}칸</b> · 실제 <b>{ACTUAL}칸</b> → {res?.predicted ? "맞았어요" : "달랐어요"}
        </p>
        <p className="algo-chain">
          {PATH.join(" → ")}
          <span>
            명령 {COMMANDS.length}개 중 F {BLOCKED}번은 막혀서 제자리였습니다. 막히지 않았다면 {FREE}칸 떨어진 곳에 섰을 텐데, 실제로는{" "}
            {ACTUAL}칸입니다.
          </span>
        </p>
        {children}
      </div>
    </>
  );
}
