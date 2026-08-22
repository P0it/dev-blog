// 적재된 프로젝트 본문이 규약대로 갈리는지 확인한다 (raw 로 떨어지면 제목 오타).
// 실행: node --env-file=.env.local scripts/check-sections.mjs
import { createClient } from "@supabase/supabase-js";
import { parseProjectBody } from "../src/lib/project-sections.ts";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
const { data } = await sb.from("projects").select("slug,body_md").order("sort_order");
let raw = 0;
for (const r of data) {
  const secs = parseProjectBody(r.body_md ?? "");
  console.log(`\n${r.slug}`);
  for (const s of secs) {
    const extra =
      s.kind === "requirements" ? `${s.items.length}항목`
      : s.kind === "tech" ? `${s.rows.length}행`
      : s.kind === "architecture" ? `mermaid=${s.diagram ? "있음" : "없음"} 단계 ${s.steps.length}`
      : s.kind === "trials" ? `${s.cases.length}케이스`
      : "";
    if (s.kind === "raw") raw++;
    console.log(`  ${s.kind === "raw" ? "⚠ RAW" : "  ok "} ${s.title.padEnd(10)} ${s.kind.padEnd(13)} ${extra}`);
  }
}
console.log(`\nraw 섹션 ${raw}개`);
