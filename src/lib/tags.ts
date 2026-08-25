// 태그 표기 정규화.
//
// 태그는 자유 입력이라 "AI"/"ai", "Claude Code"/"claude-code" 처럼 같은 걸 가리키는
// 표기가 여러 개 생긴다. 태그 페이지가 사이트맵에 올라간 뒤로는 이게 곧 중복 콘텐츠라
// 검색엔진이 둘 다 얇은 페이지로 본다.
//
// 표기 자체를 슬러그로 강제하지는 않는다(한글 태그가 어색해진다). 대신 "같은 것"의
// 판정 기준(tagKey)만 정해 두고, 이미 쓰이는 표기가 있으면 거기에 맞춘다.
//
// 스크립트(.mjs)에서 쓰는 같은 로직이 scripts/lib/tags.mjs 에 있다. 한쪽을 고치면
// 다른 쪽도 고쳐야 한다. src/lib/tags.test.ts 가 두 구현을 대조한다.

/** 두 표기가 같은 태그인지 판정하는 키. 대소문자·공백·언더스코어 차이를 지운다. */
export function tagKey(tag: string): string {
  return tag.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

/** 소문자·하이픈만으로 된 표기인가. 통합 대상이 동률일 때 이쪽을 우선한다. */
export function isSlugForm(tag: string): boolean {
  return tag === tag.toLowerCase() && !/[\s_]/.test(tag);
}

/**
 * 같은 키를 공유하는 표기들 중 대표 하나를 고른다.
 * 많이 쓰인 표기 > 슬러그형 > 사전순.
 */
export function pickCanonical(variants: { tag: string; count: number }[]): string {
  return [...variants].sort(
    (a, b) =>
      b.count - a.count ||
      Number(isSlugForm(b.tag)) - Number(isSlugForm(a.tag)) ||
      a.tag.localeCompare(b.tag),
  )[0].tag;
}

/**
 * 입력 태그를 이미 쓰이는 표기에 맞춘다. 빈 값과 중복은 떨어뜨린다.
 * existing 에 같은 키의 표기가 없으면 입력 표기를 그대로 살린다(새 태그).
 */
export function canonicalizeTags(input: string[], existing: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const t of existing) {
    const k = tagKey(t);
    if (k && !byKey.has(k)) byKey.set(k, t);
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const k = tagKey(trimmed);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(byKey.get(k) ?? trimmed);
  }
  return out;
}
