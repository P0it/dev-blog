"use client";

import { useCallback, useEffect, useState } from "react";
import { Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import { LabModal } from "../LabModal";

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

function ShotFigure({
  shot,
  index,
  onOpen,
}: {
  shot: Shot;
  index: number;
  onOpen: () => void;
}) {
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
        {/* 판 위에 눌러 여는 자리를 덮는다. 그리드의 판은 실제 화면보다 훨씬 작아
            글씨가 안 읽힌다 — 원본을 크게 보는 길이 없으면 목업 전시로 끝난다. */}
        <button type="button" className="lab-shot-open" onClick={onOpen} aria-label={`${shot.title || `화면 ${index + 1}`} 크게 보기`}>
          <Maximize2 size={15} />
        </button>
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
  // null 이면 닫힘. 열려 있으면 몇 번째 화면을 보고 있는지다.
  const [at, setAt] = useState<number | null>(null);
  // 확대 창에 걸린 그림의 비율. 세로 캡처를 판 폭까지 늘리면 안 되므로 재 둔다.
  const [ratio, setRatio] = useState<number | null>(null);

  const step = useCallback(
    (d: number) => {
      setRatio(null);
      setAt((v) => (v === null ? v : (v + d + shots.length) % shots.length));
    },
    [shots.length],
  );

  // 갤러리는 한 장만 크게 보려고 여는 게 아니다. 창을 닫았다 다시 여는 대신
  // 좌우 키로 넘긴다. Escape 는 LabModal 이 맡는다.
  useEffect(() => {
    if (at === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [at, step]);

  const cur = at === null ? null : shots[at];
  // 폰 캡처는 2·3배 밀도로 찍혀 있다(780×1688 = 390pt 화면의 두 배). 판 폭에 맞춰
  // 늘리면 글씨가 실제 기기의 세 배로 부풀어, 확대가 아니라 뭉개짐이 된다.
  // 세로로 긴 그림은 실기기 폭 언저리에 세우고 넘치는 길이는 스크롤로 받는다.
  const portrait = ratio !== null && ratio < 0.9;

  return (
    <>
      <div className="lab-screens lab-stagger">
        {shots.map((s, i) => (
          <ShotFigure
            key={i}
            shot={s}
            index={i}
            onOpen={() => {
              setRatio(null);
              setAt(i);
            }}
          />
        ))}
      </div>

      <LabModal
        open={cur !== null}
        onClose={() => setAt(null)}
        label={cur?.title || "화면 크게 보기"}
        className="lab-shot-modal"
      >
        {cur && (
          <>
            {/* 판 안에 우겨넣지 않는다. 원본 비율 그대로 두고, 긴 캡처는 스크롤로 훑는다. */}
            <div className={`lab-shot-modal-stage${portrait ? " is-portrait" : ""}`}>
              {VIDEO.test(cur.src) ? (
                <video
                  src={cur.src}
                  controls
                  autoPlay
                  loop
                  playsInline
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
                  }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cur.src}
                  alt={cur.title}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
                  }}
                />
              )}
            </div>

            <div className="lab-shot-modal-bar">
              {shots.length > 1 && (
                <button type="button" onClick={() => step(-1)} aria-label="이전 화면">
                  <ChevronLeft size={17} />
                </button>
              )}
              <div className="lab-shot-modal-cap">
                <b>
                  <span className="num">{String((at ?? 0) + 1).padStart(2, "0")}</span>
                  {cur.title}
                </b>
                {cur.caption && <p>{cur.caption}</p>}
              </div>
              {shots.length > 1 && (
                <button type="button" onClick={() => step(1)} aria-label="다음 화면">
                  <ChevronRight size={17} />
                </button>
              )}
            </div>
          </>
        )}
      </LabModal>
    </>
  );
}
