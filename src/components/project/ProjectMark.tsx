"use client";

import { useCallback, useState } from "react";
import type { Project } from "@/lib/types";

// 카드·히어로의 로고 자리.
// 로고 이미지가 있으면 그걸 쓰고, 없으면 이름 첫 글자를 큼직하게 놓는다.
// 이모지는 쓰지 않는다 — 프로젝트마다 톤이 제각각으로 튀고 OS 마다 다르게 그려진다.
export function projectInitial(name: string): string {
  const c = name.trim()[0] ?? "?";
  return c.toUpperCase();
}

// 로고는 두 종류가 들어온다.
//
//  - **앱 아이콘** — 제 배경과 안전 여백을 안에 품은 정사각. 판 안에 또 여백을 두고
//    줄여 넣으면 정작 마크가 손톱만 해지므로, 판을 가득 채우고 아이콘 규격의 안전
//    여백만큼 다시 밀어 올린다. 넘치는 가장자리는 아이콘 제 배경이라 안 보인다.
//  - **워드마크** — 이름을 가로로 쓴 로고. 판을 채우면 가운데 두어 글자만 남고 양끝이
//    잘린다. 판 안에 통째로 앉혀야 이름이 읽힌다.
//
// 한때는 확장자로 갈랐다(png=아이콘, svg=워드마크). 접었다. 가로로 긴 png 워드마크가
// 들어오는 순간 목록에서 이름 가운데 두 글자만 보였기 때문이다. 확장자는 로고의 모양을
// 말해 주지 않는다. 지금은 **그림을 받아 보고 가로세로 비를 잰다** — 정사각에 가까우면
// 아이콘, 아니면 워드마크다. 대표 화면 비율을 재는 `CardShot` 과 같은 이유로 이 조각만
// 클라이언트로 뗐다.
//
// 재기 전(서버가 그린 첫 판)에는 워드마크 쪽으로 둔다. 아이콘이 18% 덜 확대돼 보였다가
// 제자리를 찾는 건 눈에 잘 안 띄지만, 반대로 두면 워드마크가 한 번 잘렸다 펴진다.
const SQUARISH_MIN = 0.8;
const SQUARISH_MAX = 1.25;

function isSquarish(img: HTMLImageElement): boolean {
  if (!img.naturalWidth || !img.naturalHeight) return false;
  const ar = img.naturalWidth / img.naturalHeight;
  return ar >= SQUARISH_MIN && ar <= SQUARISH_MAX;
}

// SVG 로고는 마크만 그려 두고 배경(`logo_bg`)을 판에 맡긴다. 안쪽에 앉히는 게 맞고,
// 비를 재 봐야 뷰박스 비율이라 아이콘인지 아닌지를 말해 주지 않는다. 그냥 지금처럼 둔다.
function isVector(url: string): boolean {
  return /\.svg(\?|#|$)/i.test(url);
}

export function ProjectMark({ p, variant }: { p: Project; variant: "card" | "hero" }) {
  const [icon, setIcon] = useState(false);

  // 캐시에서 바로 뜬 그림은 onLoad 가 안 온다. ref 가 붙는 순간 complete 를 같이 본다.
  const measure = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete) setIcon(isSquarish(el));
  }, []);

  if (p.logoUrl) {
    const vector = isVector(p.logoUrl);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={p.logoUrl}
        alt=""
        ref={vector ? undefined : measure}
        onLoad={vector ? undefined : (e) => setIcon(isSquarish(e.currentTarget))}
        className={vector ? undefined : icon ? "is-icon" : "is-wordmark"}
      />
    );
  }
  return (
    <span className={variant === "card" ? "lab-card-mono" : undefined}>
      {projectInitial(p.name)}
    </span>
  );
}
