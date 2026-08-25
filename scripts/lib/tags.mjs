// src/lib/tags.ts 와 같은 로직의 스크립트용 사본. 한쪽을 고치면 다른 쪽도 고친다.
// src/lib/tags.test.ts 가 두 구현이 같은 답을 내는지 대조한다.

/** 두 표기가 같은 태그인지 판정하는 키. 대소문자·공백·언더스코어 차이를 지운다. */
export function tagKey(tag) {
  return tag.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

/** 소문자·하이픈만으로 된 표기인가. 통합 대상이 동률일 때 이쪽을 우선한다. */
export function isSlugForm(tag) {
  return tag === tag.toLowerCase() && !/[\s_]/.test(tag);
}

/** 같은 키를 공유하는 표기들 중 대표 하나. 많이 쓰인 표기 > 슬러그형 > 사전순. */
export function pickCanonical(variants) {
  return [...variants].sort(
    (a, b) =>
      b.count - a.count ||
      Number(isSlugForm(b.tag)) - Number(isSlugForm(a.tag)) ||
      a.tag.localeCompare(b.tag),
  )[0].tag;
}

/** 입력 태그를 이미 쓰이는 표기에 맞춘다. 빈 값과 중복은 떨어뜨린다. */
export function canonicalizeTags(input, existing) {
  const byKey = new Map();
  for (const t of existing) {
    const k = tagKey(t);
    if (k && !byKey.has(k)) byKey.set(k, t);
  }

  const out = [];
  const seen = new Set();
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
