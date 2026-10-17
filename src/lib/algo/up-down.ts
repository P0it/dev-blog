/**
 * up-down 게임 — 페이지 맨 위에서 독자가 직접 하는 것.
 *
 * 설명을 읽기 전에 "절반씩 날아간다"를 몸으로 먼저 겪게 하는 게 목적이다.
 * 화면과 떼어 두어 테스트가 가능하다.
 */

export type Range = { lo: number; hi: number };
export type Verdict = "higher" | "lower" | "hit";

export function respond(secret: number, guess: number, range: Range): { verdict: Verdict; range: Range } {
  if (guess === secret) return { verdict: "hit", range: { lo: secret, hi: secret } };

  // 이미 좁혀진 범위를 넓히지 않는다 — 독자가 범위 밖을 불러도 남은 후보는 그대로다
  if (guess < secret) {
    return { verdict: "higher", range: { lo: Math.max(range.lo, guess + 1), hi: range.hi } };
  }
  return { verdict: "lower", range: { lo: range.lo, hi: Math.min(range.hi, guess - 1) } };
}

/** 매번 가운데만 부를 때 최악이어도 이만큼이면 끝난다. 100개면 7번. */
export function worstCaseGuesses(candidates: number): number {
  if (candidates <= 0) return 0;
  return Math.ceil(Math.log2(candidates + 1));
}

export function sizeOf(range: Range): number {
  return Math.max(0, range.hi - range.lo + 1);
}
