// 이 레포의 skills/ 를 유저 스코프(~/.claude/skills)로 심볼릭 링크한다.
// 규약 원본은 레포에 남고(수정 이력이 git 에 쌓인다), 호출은 어느 레포에서든 된다.
//
// 실행: npm run setup:skills

import { symlinkSync, mkdirSync, existsSync, lstatSync, readlinkSync, unlinkSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const SKILLS = ["portfolio"];
const src = resolve(process.cwd(), "skills");
const dstDir = join(homedir(), ".claude", "skills");

mkdirSync(dstDir, { recursive: true });

for (const name of SKILLS) {
  const from = join(src, name);
  const to = join(dstDir, name);

  if (!existsSync(from)) {
    console.error(`✗ 원본이 없다: ${from}`);
    process.exitCode = 1;
    continue;
  }

  const st = lstatSync(to, { throwIfNoEntry: false });
  if (st) {
    if (st.isSymbolicLink()) {
      if (readlinkSync(to) === from) {
        console.log(`✓ ${name} — 이미 연결됨`);
        continue;
      }
      unlinkSync(to);
    } else {
      console.error(`✗ ${to} 가 실제 디렉터리다. 직접 옮기고 다시 실행해라.`);
      process.exitCode = 1;
      continue;
    }
  }

  symlinkSync(from, to, "dir");
  console.log(`✓ ${name} → ${to}`);
}

// 글 작성 파이프라인이 기대는 플러그인. 레포의 .claude/settings.json 이 설치를 권하지만,
// 권유를 넘겼거나 다른 도구로 열었으면 여기서 알아챈다.
const PLUGINS = [
  ["humanize-korean@im-not-ai", "/plugin marketplace add epoko77-ai/im-not-ai → /plugin install humanize-korean@im-not-ai"],
];
const installed = join(homedir(), ".claude", "plugins", "installed_plugins.json");
const have = existsSync(installed) ? readFileSync(installed, "utf8") : "";
for (const [id, how] of PLUGINS) {
  if (have.includes(`"${id}"`)) console.log(`✓ 플러그인 ${id}`);
  else console.warn(`⚠ 플러그인 ${id} 가 없다 — Claude Code 에서: ${how}`);
}
