import type { ThumbKind } from "./types";

// 카드 썸네일 패턴(a~l) 공용 메타.
// 서버(에디터 액션의 슬러그 해시 폴백)와 클라이언트(패턴 피커)가 같은 목록을 본다.

export const THUMB_KINDS = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l",
] as const satisfies readonly ThumbKind[];

// 패턴 한글 이름 — 어드민 썸네일 피커 라벨.
export const THUMB_LABELS: Record<ThumbKind, string> = {
  a: "흐름",
  b: "교집합",
  c: "막대",
  d: "추이",
  e: "문서",
  f: "프로필",
  g: "네트워크",
  h: "스택",
  i: "타깃",
  j: "그리드",
  k: "트리",
  l: "궤도",
};

// 슬러그를 12개 패턴으로 결정적 매핑(미지정 시 카드 단조로움 방지).
export function thumbKindFromSlug(slug: string): ThumbKind {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return THUMB_KINDS[h % THUMB_KINDS.length];
}
