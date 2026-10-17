"use client";

import { useState, type ReactNode } from "react";
import { UpDownGame } from "./UpDownGame";

/**
 * 해 보기 → 되짚기. 맞히기 전에는 뒤 설명이 숨어 있다.
 *
 * 사양 1절 핵심 규칙이다 — 독자가 자기 횟수를 본 **뒤에** 일곱 번이라는 숫자를 듣게 한다.
 * 숨긴 글은 DOM 에 두되 `hidden` 으로 가린다. 스크립트가 꺼지면 전부 보인다.
 */
export function GameReveal({ children }: { children: ReactNode }) {
  const [won, setWon] = useState(false);

  return (
    <>
      <UpDownGame onWin={() => setWon(true)} />
      <div className="algo-reveal" data-shown={won}>
        {children}
      </div>
    </>
  );
}
