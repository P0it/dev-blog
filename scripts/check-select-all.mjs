// posts 를 select("*") 로 읽는 질의를 막는다. 본문(body_md)이 글 한 편에 평균 37KB 라,
// 목록·관련 글·시리즈를 select("*") 로 읽으면 빌드 한 번에 수백 MB 가 Supabase egress 로 나간다
// (2026-10 무료 한도 초과 → 배포 실패의 원인).
//
// 본문이 정말 필요한 질의(상세·에디터·검색 스니펫)는 질의 안에 `// body-ok: 이유` 를 적어 통과시킨다.
// 목록은 src/lib/queries.ts 의 POST_CARD_COLUMNS 를 쓴다.
//
//   npm run check:select     (npm run build 앞에서도 자동으로 돈다 — prebuild)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src", "scripts"];
const EXT = /\.(ts|tsx|mjs|js)$/;
const SELF = "check-select-all.mjs";
// select("*") · select('*') · select(`*`) · select()  — 컬럼을 안 고르면 전부 온다
const SELECT_ALL = /\.select\(\s*(?:["'`]\*["'`])?\s*\)/;
// 쓰기 질의의 .select() 는 방금 쓴 행을 돌려받는 용도라 대상이 아니다
const WRITE = /\.(insert|update|upsert|delete)\(/;

function* files(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (EXT.test(name) && name !== SELF) yield p;
  }
}

const bad = [];
for (const root of ROOTS) {
  for (const file of files(root)) {
    const src = readFileSync(file, "utf8");
    const re = /from\(\s*["'`]posts["'`]\s*\)/g;
    for (let m; (m = re.exec(src)); ) {
      // 이 from() 부터 문장이 끝나는 ; 까지가 한 질의다
      const end = src.indexOf(";", m.index);
      const chain = src.slice(m.index, end === -1 ? undefined : end);
      if (!SELECT_ALL.test(chain) || WRITE.test(chain) || chain.includes("body-ok")) continue;
      const line = src.slice(0, m.index).split("\n").length;
      bad.push(`${file}:${line}`);
    }
  }
}

if (bad.length) {
  console.error(`✗ posts 를 select("*") 로 읽는 질의 ${bad.length}곳 — 본문(body_md)까지 따라와 Supabase egress 를 먹는다:`);
  for (const b of bad) console.error(`  ${b}`);
  console.error(`  목록·카드는 POST_CARD_COLUMNS(src/lib/queries.ts) 를 쓴다.`);
  console.error(`  본문이 꼭 필요하면 질의 안에 \`// body-ok: 이유\` 를 적는다.`);
  process.exit(1);
}
console.log("✓ posts select(\"*\") 없음");
