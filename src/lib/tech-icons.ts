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
