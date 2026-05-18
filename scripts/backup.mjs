// 콘텐츠 백업 — posts/categories/series/ai_jobs를 JSON 한 파일로 덤프.
// 실행: npm run backup
//
// 출력: $BACKUP_DIR/<YYYY-MM-DD>.json  (기본 BACKUP_DIR = 저장소/backups)
// BACKUP_DIR을 별도 비공개 git 레포 클론 경로로 지정하면, launchd 잡에서
// 덤프 후 그 레포에 commit+push 하면 오프사이트 백업이 된다(setup 문서 참고).
//
// 복원: 이 JSON을 읽어 기존 seed 패턴(upsert)으로 되돌리면 됨.

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BACKUP_DIR = process.env.BACKUP_DIR ?? join(ROOT, "backups");

async function dump(table) {
  const { data, error } = await sb.from(table).select("*");
  if (error) {
    console.warn(`! ${table} 스킵: ${error.message}`);
    return [];
  }
  return data ?? [];
}

async function run() {
  const tables = ["categories", "posts", "series", "ai_jobs"];
  const snapshot = { generatedAt: new Date().toISOString(), tables: {} };
  for (const t of tables) {
    const rows = await dump(t);
    snapshot.tables[t] = rows;
    console.log(`→ ${t}: ${rows.length}`);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const file = join(BACKUP_DIR, `${date}.json`);
  writeFileSync(file, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`✅ ${file}`);
}

run().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
