import { TECH_ICONS, TECH_ALIASES, type TechIcon } from "./tech-icons.generated";

export type { TechIcon };

// 원고에 적힌 이름은 표기가 제각각이다. "Next.js" "nextjs" "Next JS" 를 한 키로 모은다.
export function normalizeTechName(name: string): string {
  return name.toLowerCase().replace(/[.\s_/-]+/g, "").trim();
}

// 아이콘이 없는 이름은 첫 글자 타일로 떨어진다. 이름마다 색이 고정되도록 해시를 쓴다.
// 같은 프로젝트를 다시 열어도 색이 바뀌지 않아야 눈에 익는다.
function hueOf(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) % 360;
  return h;
}

export type TechChip = {
  name: string;
  icon: TechIcon | null;
  /** 아이콘이 없을 때 타일에 넣을 한 글자 */
  letter: string;
  light: string;
  dark: string;
};

export function resolveTech(name: string): TechChip {
  const key = normalizeTechName(name);
  const icon = TECH_ICONS[TECH_ALIASES[key] ?? key] ?? null;
  if (icon) {
    return { name, icon, letter: "", light: icon.light, dark: icon.dark };
  }
  const hue = hueOf(key);
  return {
    name,
    icon: null,
    // 한글·기호로 시작해도 한 글자는 나온다. 영문이면 대문자로.
    letter: [...name.trim()][0]?.toUpperCase() ?? "?",
    light: `hsl(${hue} 42% 38%)`,
    dark: `hsl(${hue} 52% 72%)`,
  };
}

export function resolveStack(stack: string[]): TechChip[] {
  return stack.map((s) => s.trim()).filter(Boolean).map(resolveTech);
}

// 데이터·API 항목의 이름은 기술 스택처럼 딱 떨어지지 않는다.
// "네이버 검색 Open API (블로그 후기)" 같은 제목에서 브랜드만 건져 아이콘을 찾는다.
// 원고가 `**아이콘** Naver` 로 직접 지목하면 그걸 먼저 본다.
export function resolveBrand(name: string, hint?: string | null): TechChip {
  const tries: string[] = [];
  if (hint) tries.push(hint);

  // 괄호 안 설명과 구분 기호를 떼고 단어만 남긴다.
  const bare = name.replace(/[(（][^)）]*[)）]/g, " ").replace(/[·–—-]/g, " ");
  const words = bare.split(/\s+/).filter(Boolean);
  tries.push(bare);
  // 긴 조합부터 본다 — "Google Cloud" 가 "Google" 보다 먼저 맞아야 한다.
  for (let n = Math.min(3, words.length); n >= 1; n--) {
    for (let i = 0; i + n <= words.length; i++) tries.push(words.slice(i, i + n).join(" "));
  }

  for (const t of tries) {
    const key = normalizeTechName(t);
    if (!key) continue;
    const icon = TECH_ICONS[TECH_ALIASES[key] ?? key];
    if (icon) return { name, icon, letter: "", light: icon.light, dark: icon.dark };
  }
  // 못 찾으면 이름 첫 글자 타일. 색은 이름 해시라 다시 열어도 그대로다.
  return { ...resolveTech(name), name };
}
