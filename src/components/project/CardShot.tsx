"use client";

import { useState } from "react";
import type { ProjectPlatform } from "@/lib/types";

// 판은 상세 갤러리와 같은 비율로 선다.
//  - 폰: 실기기(390×844). 근사치로 두면 캡처 밑동(탭 바)이 잘린다
//  - 웹: 브라우저 창(16:10). 데스크탑 캡처를 폰 판에 넣으면 좌우가 잘려 안 읽힌다
const PHONE_AR = 390 / 844;
const BROWSER_AR = 16 / 10;
// 판보다 15% 넘게 길면 "한 화면이 아니라 스크롤을 담은 캡처"로 본다.
// 사우나우·도돌이처럼 홈 화면이 한 장에 다 들어오는 그림은 여기 안 걸려 그냥 선다.
const TALL_RATIO = 0.85;

// 목록 카드의 대표 화면. 긴 캡처는 판 안에서 훑어 내린다 — 잘라 놓으면 맨 위
// 한 뼘만 보여서 무슨 물건인지 목록에서 알 수가 없다.
// 상세 갤러리는 같은 판이 여러 장 깔려 손을 얹은 것만 움직이지만, 목록은
// 프로젝트당 한 장이라 그냥 돈다. 카드를 열기 전에 뭐가 들었는지 보이는 편이 낫다.
export function CardShot({
  src,
  platform = "mobile",
}: {
  src: string;
  platform?: ProjectPlatform;
}) {
  const [ratio, setRatio] = useState<number | null>(null);
  const frameAr = platform === "web" ? BROWSER_AR : PHONE_AR;
  const tall = ratio !== null && ratio < frameAr * TALL_RATIO;

  // 훑어 내릴 거리는 그림 높이 기준 비율이다. 판이 덮는 만큼을 빼면 남는 게 잘린 부분.
  // 시간은 길이에 비례시킨다 — 짧은 그림이 기어가거나 긴 그림이 휙 지나가지 않게.
  const shift = tall && ratio ? (1 - ratio / frameAr) * 100 : 0;
  const duration = tall && ratio ? Math.min(26, Math.max(7, (frameAr / ratio) * 4.5)) : 0;

  const style = {
    // 판 비율은 폰이냐 브라우저냐로 갈린다. CSS 한 곳에서 못박으면 웹 프로젝트가
    // 폰 판에 갇히므로, 렌더러가 값을 넣어 준다.
    ["--shot-ar"]: String(frameAr),
    ...(tall
      ? {
          ["--shot-shift"]: `-${shift.toFixed(2)}%`,
          ["--shot-dur"]: `${duration.toFixed(1)}s`,
        }
      : {}),
  } as React.CSSProperties;

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
