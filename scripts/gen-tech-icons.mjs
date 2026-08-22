// simple-icons 에서 우리가 쓰는 기술의 아이콘만 골라 src/lib/tech-icons.generated.ts 로 굽는다.
//
// 3,400 개를 런타임에 싣지 않으려는 것이다. simple-icons 는 devDependency 로만 남고,
// 배포 번들에는 여기서 뽑은 수십 개의 path 문자열만 들어간다.
//
// 대상은 두 곳에서 모은다.
//   1. 아래 CURATED — 웹 개발에서 흔히 쓰는 것들. 미리 깔아 둔다
//   2. projects/*.md 의 stack: 배열 — 실제로 쓴 것
//
// 실행: npm run gen:tech-icons

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getIconsData, slugToVariableName } from "simple-icons/sdk";
import * as siIcons from "simple-icons";

// 원고에 적는 이름 → simple-icons 공식 이름. 런타임에서도 써야 하므로 생성물에 함께 굽는다.
const ALIASES = Object.fromEntries(
  Object.entries(JSON.parse(readFileSync(join(process.cwd(), "scripts/tech-icon-aliases.json"), "utf8")))
    .filter(([k]) => k !== "_")
    .map(([from, to]) => [normalizeTechName(from), to]),
);

// "Next.js", "next js", "NextJS" 가 같은 키로 떨어지게 한다.
function normalizeTechName(name) {
  return name.toLowerCase().replace(/[.\s_/-]+/g, "").trim();
}

// 자주 쓰는 것들. 원고에 없어도 미리 넣어 둔다 — 새 프로젝트에서 바로 붙게.
const CURATED = [
  // 언어·런타임
  "TypeScript", "JavaScript", "Python", "Go", "Rust", "Node.js", "Deno", "Bun",
  "HTML5", "CSS", "Swift", "Kotlin", "Dart",
  // 프런트엔드
  "React", "Next.js", "Vue.js", "Nuxt", "Svelte", "Astro", "Vite", "Tailwind CSS",
  "Framer", "Three.js", "Expo", "Flutter", "Electron",
  // 백엔드·데이터
  "Supabase", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Prisma",
  "Firebase", "GraphQL", "tRPC", "Drizzle",
  // 인프라·배포 (AWS 등 일부 브랜드는 상표 정책으로 simple-icons 에서 빠졌다)
  "Vercel", "Cloudflare", "Cloudflare Workers", "Cloudflare Pages", "Netlify",
  "Docker", "Kubernetes", "GitHub", "GitHub Actions",
  "GitLab", "Railway", "Fly.io", "Render",
  // AI
  "Anthropic", "Claude", "Claude Code", "Hugging Face", "Ollama", "LangChain",
  // 도구·서비스
  "Git", "Figma", "Notion", "Discord", "Stripe", "Sentry",
  "Vitest", "Jest", "ESLint", "Prettier", "npm", "pnpm", "Bitbucket",
  // 국내
  "KakaoTalk", "Naver", "Kakao",
  // 기타 런타임
  "Apple", "Linux", "Ubuntu", "Raspberry Pi", "Nginx", "Elasticsearch",
];

// #rrggbb 의 상대 휘도. 0(검정) ~ 1(흰색).
function luminance(hex) {
  const ch = (i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}

// 배경 쪽으로 묻히는 색을 반대편으로 끌어당긴다. amount 만큼 흰색/검정과 섞는다.
function mix(hex, toward, amount) {
  const out = [];
  for (let i = 0; i < 6; i += 2) {
    const v = parseInt(hex.slice(i, i + 2), 16);
    out.push(Math.round(v + (toward - v) * amount));
  }
  return out.map((v) => v.toString(16).padStart(2, "0")).join("");
}

// 라이트/다크 두 배경 모두에서 읽히는 색을 만든다.
// Next.js(#000000) 는 다크에서, GitHub(#181717) 도 마찬가지로 안 보인다.
function readable(hex) {
  const l = luminance(hex);
  // 라이트 배경(흰색) — 너무 밝으면 어둡게 당긴다
  const light = l > 0.62 ? mix(hex, 0, 0.45) : hex;
  // 다크 배경 — 너무 어두우면 밝게 당긴다
  const dark = l < 0.16 ? mix(hex, 255, 0.82) : l < 0.3 ? mix(hex, 255, 0.45) : hex;
  return { light: `#${light}`, dark: `#${dark}` };
}

const projectsDir = join(process.cwd(), "projects");
const fromProjects = [];
for (const f of readdirSync(projectsDir).filter((n) => n.endsWith(".md"))) {
  const md = readFileSync(join(projectsDir, f), "utf8");
  const m = /^stack:\s*\[(.*)\]\s*$/m.exec(md);
  if (!m) continue;
  for (const raw of m[1].split(",")) {
    const name = raw.trim().replace(/^["']|["']$/g, "");
    if (name) fromProjects.push(name);
  }
}

const wanted = [...new Set([...CURATED, ...fromProjects, ...Object.values(ALIASES)])];

const data = await getIconsData();
const bySlug = new Map(data.map((d) => [d.slug, d]));
const byNormTitle = new Map(data.map((d) => [normalizeTechName(d.title), d]));

const picked = new Map();
const missing = [];
for (const name of wanted) {
  const key = normalizeTechName(name);
  const aliased = ALIASES[key];
  const target = aliased ? normalizeTechName(aliased) : key;
  const icon = bySlug.get(target) ?? byNormTitle.get(target);
  if (!icon) {
    missing.push(name);
    continue;
  }
  picked.set(normalizeTechName(icon.title), icon);
  // 슬러그로도 찾을 수 있게 같은 아이콘을 한 번 더 건다 (nextdotjs 등).
  picked.set(icon.slug, icon);
}

// 별칭도 정규화한 채로 굽는다. 대상 아이콘이 없으면 굳이 남기지 않는다.
const aliasLines = Object.entries(ALIASES)
  .map(([from, to]) => [from, normalizeTechName(to)])
  .filter(([from, to]) => from !== to && picked.has(to))
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([from, to]) => `  ${JSON.stringify(from)}: ${JSON.stringify(to)},`);

const entries = [...picked.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
const lines = entries.map(([key, icon]) => {
  const c = readable(icon.hex);
  // 데이터 파일에는 path 가 없다. 패키지 본체의 아이콘 객체에서 가져온다.
  const path = siIcons[slugToVariableName(icon.slug)]?.path;
  if (!path) throw new Error(`path 를 못 찾았다: ${icon.slug}`);
  return `  ${JSON.stringify(key)}: { title: ${JSON.stringify(icon.title)}, light: ${JSON.stringify(c.light)}, dark: ${JSON.stringify(c.dark)}, path: ${JSON.stringify(path)} },`;
});

const out = `// 이 파일은 생성물이다. 직접 고치지 말고 \`npm run gen:tech-icons\` 를 돌린다.
// 원본: simple-icons ${JSON.parse(readFileSync(join(process.cwd(), "node_modules/simple-icons/package.json"), "utf8")).version} (CC0-1.0)

export type TechIcon = { title: string; light: string; dark: string; path: string };

export const TECH_ICONS: Record<string, TechIcon> = {
${lines.join("\n")}
};

// 원고에 적는 이름 → TECH_ICONS 의 키. 양쪽 모두 정규화된 값이다.
export const TECH_ALIASES: Record<string, string> = {
${aliasLines.join("\n")}
};
`;

writeFileSync(join(process.cwd(), "src/lib/tech-icons.generated.ts"), out);

console.log(`아이콘 ${entries.length} 개 기록 (고유 ${new Set([...picked.values()].map((i) => i.slug)).size} 종)`);
if (missing.length) {
  console.log(`\nsimple-icons 에 없어 글자 타일로 떨어지는 이름 ${missing.length} 개:`);
  for (const m of missing) console.log(`  - ${m}`);
  console.log(`\n별칭으로 붙일 수 있으면 scripts/tech-icon-aliases.json 에 추가한다.`);
}
