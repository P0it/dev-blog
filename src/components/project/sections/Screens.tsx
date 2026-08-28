"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { LabModal } from "../LabModal";
import type { ProjectPlatform } from "@/lib/types";

export type Shot = { title: string; src: string; caption: string };

const VIDEO = /\.(mp4|webm|mov)(\?|$)/i;

// 판은 프로젝트가 무엇으로 찍혔느냐로 갈린다 — 폰 실기기(390×844)냐 브라우저 창(16:10)이냐.
// 그림 비율만 보고 고르면 데스크탑 전체 페이지 캡처(세로로 긴)가 "폰의 긴 캡처"와
// 겹쳐서 폰 판에 우겨넣어진다. 그래서 판은 원고의 platform 이 정한다.
//
// 폰 판에 들어오는 그림은 셋 중 하나다.
//  - 가로로 넓은 화면: 폰 판에 넣으면 좌우가 잘려 안 읽힌다 → 두 칸을 쓰고 제 비율로 선다
//  - 폰 한 화면: 판 비율 그대로 들어간다
//  - 스크롤까지 담은 긴 캡처: 위만 보이고 나머지가 잘린다 → 판 안에서 천천히 훑어 내린다
//
// 브라우저 판은 늘 두 칸이라 넓다. 여기서는 가로 판정이 필요 없고, 전체 페이지를
// 담은 긴 캡처만 훑어 내리면 된다.
const PHONE_AR = 390 / 844;
const BROWSER_AR = 16 / 10;
const LANDSCAPE = 1.1;
// 판보다 15% 넘게 길면 "한 화면이 아니라 스크롤"로 본다. 살짝 긴 건 그냥 잘라도 티가 안 난다.
const TALL_RATIO = 0.85;
// 붙박이 머리말이 덮는 높이. 본문 제목들의 scroll-margin-top 과 같은 값이라
// 접었을 때 세우는 자리도 링크로 뛰었을 때와 같은 높이에 선다.
const RESTING_TOP = 96;

// 갤러리 안의 영상. 화면에 들어왔을 때 **처음부터** 튼다.
//
// 예전에는 autoPlay·loop 만 걸어 두었다. 그러면 원고 위쪽에 있는 영상이 독자가
// 거기까지 내려오기도 전에 이미 몇 바퀴를 돌아, 도착했을 때는 늘 중간부터 보인다.
// 화면 한 장을 담은 짧은 고리라면 상관없지만, 첫 화면부터 결과까지의 여정을 담은
// 영상은 시작을 놓치면 이야기가 안 된다. 그래서 들어올 때 currentTime 을 0 으로
// 되감고, 나가면 세운다. 보이지도 않는 영상이 계속 도는 것도 함께 없앤다.
function ShotVideo({ src, onRatio }: { src: string; onRatio: (r: number) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          // 되감기는 멈춰 있을 때만 한다. 판이 경계에 걸쳐 관찰자가 여러 번
          // 울리는 일이 있는데, 그때마다 되감으면 영상이 첫 장면에서 못 벗어난다.
          if (el.paused) el.currentTime = 0;
          void el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      onLoadedMetadata={(e) => {
        const v = e.currentTarget;
        if (v.videoHeight) onRatio(v.videoWidth / v.videoHeight);
      }}
    />
  );
}

function ShotFigure({
  shot,
  index,
  platform,
  onOpen,
}: {
  shot: Shot;
  index: number;
  platform: ProjectPlatform;
  onOpen: () => void;
}) {
  const [ratio, setRatio] = useState<number | null>(null);
  const web = platform === "web";
  const frameAr = web ? BROWSER_AR : PHONE_AR;
  // 웹 판은 이미 두 칸을 쓰고 가로로 누워 있다. 여기서 또 가로 판정을 하면
  // 살짝 세로로 긴 캡처가 "넓다"와 "길다"에 동시에 걸려 판이 오락가락한다.
  const wide = !web && ratio !== null && ratio > LANDSCAPE;
  const tall = ratio !== null && ratio < frameAr * TALL_RATIO;

  // 훑어 내릴 거리는 그림 높이 기준 비율이다. 판이 덮는 만큼(ratio/frameAr)을 빼면 남는 게 잘린 부분.
  // 시간은 길이에 비례시킨다 — 짧은 그림이 느릿하게 기어가거나 긴 그림이 휙 지나가지 않게.
  const shift = tall && ratio ? (1 - ratio / frameAr) * 100 : 0;
  const duration = tall && ratio ? Math.min(26, Math.max(7, (frameAr / ratio) * 4.5)) : 0;

  const frameStyle = {
    aspectRatio: wide && ratio ? String(ratio) : String(frameAr),
    ...(tall
      ? {
          ["--shot-shift"]: `-${shift.toFixed(2)}%`,
          ["--shot-dur"]: `${duration.toFixed(1)}s`,
        }
      : {}),
  } as React.CSSProperties;

  const cls = ["lab-shot", web && "is-web", wide && "is-wide", tall && "is-tall"]
    .filter(Boolean)
    .join(" ");

  return (
    <figure className={cls}>
      <div className="lab-shot-frame" style={frameStyle}>
        {/* 판 위에 눌러 여는 자리를 덮는다. 그리드의 판은 실제 화면보다 훨씬 작아
            글씨가 안 읽힌다 — 원본을 크게 보는 길이 없으면 목업 전시로 끝난다. */}
        <button type="button" className="lab-shot-open" onClick={onOpen} aria-label={`${shot.title || `화면 ${index + 1}`} 크게 보기`}>
          <Maximize2 size={15} />
        </button>
        {VIDEO.test(shot.src) ? (
          <ShotVideo src={shot.src} onRatio={setRatio} />
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
export function Screens({
  shots,
  platform = "mobile",
}: {
  shots: Shot[];
  platform?: ProjectPlatform;
}) {
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

  // 화면이 여남은 장이면 그리드만으로 스크롤이 한참 길어져, 아래에 있는 개발 과정·
  // 시행착오까지 내려가는 사람이 없다. 그래서 첫 줄만 깔아 두고 나머지는 접는다.
  // 한 줄에 몇 칸이 서는지는 폭과 판 종류(웹은 줄을 통으로 쓴다)에 따라 달라지므로
  // 숫자로 못 박지 않고, 깔린 뒤 첫 줄의 아랫변을 재서 거기까지만 보여준다.
  const gridRef = useRef<HTMLDivElement>(null);
  const [firstRow, setFirstRow] = useState<{ height: number; hidden: number } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const measure = () => {
      const kids = Array.from(el.children) as HTMLElement[];
      if (kids.length < 2) return setFirstRow(null);
      const top = kids[0].offsetTop;
      const row = kids.filter((k) => k.offsetTop === top);
      if (row.length >= kids.length) return setFirstRow(null);
      const bottom = Math.max(...row.map((k) => k.offsetTop + k.offsetHeight));
      setFirstRow({ height: bottom - top, hidden: kids.length - row.length });
    };

    measure();
    // 그림이 실린 뒤에야 판 비율(넓다·길다)이 정해져 줄이 다시 짜인다.
    // 컨테이너만 보면 접힌 동안엔 높이가 고정돼 그 변화를 못 받으니 판도 같이 본다.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const k of Array.from(el.children)) ro.observe(k);
    return () => ro.disconnect();
  }, [shots]);

  const clamped = !open && firstRow !== null;

  // 접을 때 자리 지키기. 갤러리가 줄어든 만큼 아래 글이 통째로 위로 올라오는데,
  // 펼친 채 한참 훑어 내려온 사람은 그 순간 갤러리를 지나쳐 한참 아래 글에 떨어진다
  // — 정작 사용자는 화면 영역 안에서만 움직였는데도. 접힌 갤러리의 아랫변이 이미
  // 화면 위로 밀려날 자리면, 그 아랫변을 화면 맨 위에 세워 다음 섹션부터 보이게 한다.
  const moreRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (open && firstRow) {
      const grid = gridRef.current;
      const btn = moreRef.current;
      if (grid && btn) {
        const shrink = grid.getBoundingClientRect().height - firstRow.height;
        const bottom = btn.getBoundingClientRect().bottom - shrink;
        if (bottom < RESTING_TOP) window.scrollBy(0, bottom - RESTING_TOP);
      }
    }
    setOpen((v) => !v);
  };

  const cur = at === null ? null : shots[at];
  // 폰 캡처는 2·3배 밀도로 찍혀 있다(780×1688 = 390pt 화면의 두 배). 판 폭에 맞춰
  // 늘리면 글씨가 실제 기기의 세 배로 부풀어, 확대가 아니라 뭉개짐이 된다.
  // 세로로 긴 그림은 실기기 폭 언저리에 세우고 넘치는 길이는 스크롤로 받는다.
  // 웹 캡처는 데스크탑 창을 찍은 것이라 세로로 길어도 폭을 다 써야 읽힌다.
  // 실기기 폭으로 좁히는 건 폰 캡처에만 맞는 이야기다.
  const portrait = platform !== "web" && ratio !== null && ratio < 0.9;

  return (
    <>
      <div
        ref={gridRef}
        className={`lab-screens lab-stagger${clamped ? " is-clamped" : ""}`}
        style={clamped ? { maxHeight: firstRow!.height } : undefined}
      >
        {shots.map((s, i) => (
          <ShotFigure
            key={i}
            shot={s}
            index={i}
            platform={platform}
            onOpen={() => {
              setRatio(null);
              setAt(i);
            }}
          />
        ))}
      </div>

      {firstRow !== null && (
        <button
          type="button"
          className={`lab-screens-more${open ? " is-open" : ""}`}
          ref={moreRef}
          onClick={toggle}
          aria-expanded={open}
        >
          {open ? "접기" : `화면 ${firstRow.hidden}장 더보기`}
          <ChevronDown size={15} />
        </button>
      )}

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
