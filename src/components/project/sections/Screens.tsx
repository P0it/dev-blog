"use client";

import { useState } from "react";

export type Shot = { title: string; src: string; caption: string };

const VIDEO = /\.(mp4|webm|mov)(\?|$)/i;

// 판은 실기기 비율(390×844)로 서 있다. 들어오는 그림은 셋 중 하나다.
//  - 가로로 넓은 화면(데스크탑·웹): 폰 판에 넣으면 좌우가 잘려 안 읽힌다 → 두 칸을 쓰고 제 비율로 선다
//  - 폰 한 화면: 판 비율 그대로 들어간다
//  - 스크롤까지 담은 긴 캡처: 위만 보이고 나머지가 잘린다 → 판 안에서 천천히 훑어 내린다
const PHONE_AR = 390 / 844;
const LANDSCAPE = 1.1;
// 판보다 15% 넘게 길면 "한 화면이 아니라 스크롤"로 본다. 살짝 긴 건 그냥 잘라도 티가 안 난다.
const TALL = PHONE_AR * 0.85;

function ShotFigure({ shot, index }: { shot: Shot; index: number }) {
  const [ratio, setRatio] = useState<number | null>(null);
  const wide = ratio !== null && ratio > LANDSCAPE;
  const tall = ratio !== null && ratio < TALL;

  // 훑어 내릴 거리는 그림 높이 기준 비율이다. 판이 덮는 만큼(ratio/PHONE_AR)을 빼면 남는 게 잘린 부분.
  // 시간은 길이에 비례시킨다 — 짧은 그림이 느릿하게 기어가거나 긴 그림이 휙 지나가지 않게.
  const shift = tall && ratio ? (1 - ratio / PHONE_AR) * 100 : 0;
  const duration = tall && ratio ? Math.min(26, Math.max(7, (PHONE_AR / ratio) * 4.5)) : 0;

  const frameStyle = wide
    ? { aspectRatio: String(ratio) }
    : tall
      ? ({
          ["--shot-shift"]: `-${shift.toFixed(2)}%`,
          ["--shot-dur"]: `${duration.toFixed(1)}s`,
        } as React.CSSProperties)
      : undefined;

  const cls = ["lab-shot", wide && "is-wide", tall && "is-tall"].filter(Boolean).join(" ");

  return (
    <figure className={cls}>
      <div className="lab-shot-frame" style={frameStyle}>
        {VIDEO.test(shot.src) ? (
          <video
            src={shot.src}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shot.src}
            alt={shot.title}
            loading="lazy"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
            }}
          />
        )}
      </div>
      {(shot.title || shot.caption) && (
        <figcaption className="lab-shot-cap">
          <span className="num">{String(index + 1).padStart(2, "0")}</span>
          {shot.title}
          {shot.caption && <p className="lab-shot-desc">{shot.caption}</p>}
        </figcaption>
      )}
    </figure>
  );
}

// 화면 갤러리 — 폰 모양 판을 깔아 "이렇게 생겼다"를 먼저 보여준다.
// 판만 늘어놓으면 목업 전시가 되니, 이름표 아래에 그 화면이 무엇을 하는 자리인지
// 한 줄을 붙인다. 자세한 이야기는 여전히 `## 개발 과정` 이 맡는다.
export function Screens({ shots }: { shots: Shot[] }) {
  return (
    <div className="lab-screens lab-stagger">
      {shots.map((s, i) => (
        <ShotFigure key={i} shot={s} index={i} />
      ))}
    </div>
  );
}
