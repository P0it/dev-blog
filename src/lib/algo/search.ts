import type { AlgoEntry } from "@/content/algo/registry";

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/** 한글 음절에서 초성만 뽑는다. 한글이 아니면 소문자로 그대로 둔다. */
export function chosung(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code >= HANGUL_START && code <= HANGUL_END) {
      out += CHO[Math.floor((code - HANGUL_START) / 588)];
    } else if (ch.trim()) {
      out += ch.toLowerCase();
    }
  }
  return out;
}

/**
 * 사이드바 검색. 항목이 백 개 안쪽이라 전부 클라이언트에서 거른다.
 *
 * 제목·별칭·신호 칩까지 걸고, 한글 초성(`ㅇㅂㅌㅅ`)도 받는다.
 * 사람은 "이분 탐색"을 "이진 탐색"이나 "bisect"로도 기억한다.
 */
export function filterEntries(entries: AlgoEntry[], query: string): AlgoEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;

  const qCho = chosung(query);
  const isChoQuery = /^[ㄱ-ㅎ]+$/.test(query.replace(/\s/g, ""));

  return entries.filter((e) => {
    const hay = [e.title, e.lede, ...e.aliases, ...e.signals].join(" ").toLowerCase();
    if (hay.includes(q)) return true;
    if (isChoQuery && chosung(e.title).includes(qCho)) return true;
    return false;
  });
}
