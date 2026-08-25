import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const { data, error } = await sb.from("posts").select("slug,status,tags");
if (error) { console.error(error); process.exit(1); }
const counts = new Map();
for (const r of data) for (const t of r.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
const groups = new Map();
for (const [t, c] of counts) {
  const k = t.toLowerCase().replace(/[\s_]+/g, "-");
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push([t, c]);
}
console.log("총 글", data.length, "/ 태그 표기", counts.size, "/ 정규화 후", groups.size);
console.log("\n=== 충돌 그룹 ===");
for (const [k, v] of groups) if (v.length > 1) console.log(k, JSON.stringify(v));
console.log("\n=== 전체 태그 ===");
console.log([...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([t,c])=>`${t}(${c})`).join(", "));
