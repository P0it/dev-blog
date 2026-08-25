// tags.mjs 의 타입 선언. src/lib/tags.test.ts 가 두 구현을 대조할 때만 쓰인다.
export function tagKey(tag: string): string;
export function isSlugForm(tag: string): boolean;
export function pickCanonical(variants: { tag: string; count: number }[]): string;
export function canonicalizeTags(input: string[], existing: string[]): string[];
