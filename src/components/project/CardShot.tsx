"use client";

import { useState } from "react";

// 판은 상세 갤러리와 같은 실기기 비율(390×844)로 선다.
const PHONE_AR = 390 / 844;
// 판보다 15% 넘게 길면 "한 화면이 아니라 스크롤을 담은 캡처"로 본다.
// 사우나우·도돌이처럼 홈 화면이 한 장에 다 들어오는 그림은 여기 안 걸려 그냥 선다.
const TALL = PHONE_AR * 0.85;

// 목록 카드의 대표 화면. 긴 캡처는 판 안에서 훑어 내린다 — 잘라 놓으면 맨 위
// 한 뼘만 보여서 무슨 물건인지 목록에서 알 수가 없다.
// 상세 갤러리는 같은 판이 여러 장 깔려 손을 얹은 것만 움직이지만, 목록은
// 프로젝트당 한 장이라 그냥 돈다. 카드를 열기 전에 뭐가 들었는지 보이는 편이 낫다.
export function CardShot({ src }: { src: string }) {
  const [ratio, setRatio] = useState<number | null>(null);
  const tall = ratio !== null && ratio < TALL;

  // 훑어 내릴 거리는 그림 높이 기준 비율이다. 판이 덮는 만큼을 빼면 남는 게 잘린 부분.
  // 시간은 길이에 비례시킨다 — 짧은 그림이 기어가거나 긴 그림이 휙 지나가지 않게.
  const shift = tall && ratio ? (1 - ratio / PHONE_AR) * 100 : 0;
  const duration = tall && ratio ? Math.min(26, Math.max(7, (PHONE_AR / ratio) * 4.5)) : 0;

  const style = tall
    ? ({
        ["--shot-shift"]: `-${shift.toFixed(2)}%`,
        ["--shot-dur"]: `${duration.toFixed(1)}s`,
      } as React.CSSProperties)
    : undefined;

  return (
    <div className={`lab-card-shot${tall ? " is-tall" : ""}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
        }}
      />
    </div>
  );
}
