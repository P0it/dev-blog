// Vercel Ignored Build Step. 종료 코드 0 = 빌드 생략, 1 = 빌드.
// 빌드 한 번이 Supabase 를 수십 MB 읽는다. 원고·문서 커밋은 화면 코드를 바꾸지 않고,
// 글 내용은 ISR(revalidate)로 반영되므로 빌드할 이유가 없다.
// [skip ci] 는 Vercel 이 무시한다. 판단이 안 서면 빌드한다(배포 누락이 더 나쁘다).
import { execFileSync } from "node:child_process";

const BUILD_PATHS = [
  "src",
  "public",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "tsconfig.json",
  "postcss.config.mjs",
  "vercel.json",
];

const base = process.env.VERCEL_GIT_PREVIOUS_SHA;
if (!base) {
  console.log("이전 성공 배포 SHA 없음 — 빌드");
  process.exit(1);
}

try {
  // 커밋 여러 개를 한 번에 푸시해도 놓치지 않게 직전 커밋이 아니라 마지막 성공 배포와 비교한다.
  const changed = execFileSync(
    "git",
    ["diff", "--name-only", base, "HEAD", "--", ...BUILD_PATHS],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
  if (changed) {
    console.log(`빌드 대상 변경 있음 — 빌드\n${changed}`);
    process.exit(1);
  }
  console.log("빌드 대상 변경 없음 — 생략");
  process.exit(0);
} catch {
  // 얕은 클론(depth 10)에 base 가 없으면 비교할 수 없다.
  console.log("비교 실패 — 빌드");
  process.exit(1);
}
