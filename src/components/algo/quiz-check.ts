export type QuizOption = { label: string; correct?: boolean };

/**
 * 확인 문제의 선택지를 검사한다.
 *
 * 두 선택지가 같은 뜻이면 오답이 오답이 아니다 — 초안에서 실제로 났던 결함이라
 * 글자가 같은 경우만이라도 여기서 막는다.
 */
export function assertOneCorrect(options: QuizOption[]): void {
  const n = options.filter((o) => o.correct).length;
  if (n !== 1) throw new Error(`정답은 정확히 하나여야 합니다 (지금 ${n}개)`);

  const seen = new Set<string>();
  for (const o of options) {
    const key = o.label.replace(/\s+/g, "");
    if (seen.has(key)) throw new Error(`같은 말을 하는 선택지가 있습니다: ${o.label}`);
    seen.add(key);
  }
}
