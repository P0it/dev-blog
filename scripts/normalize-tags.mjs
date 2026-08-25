// 태그 표기 통합.
//
// "AI"/"ai", "Claude Code"/"claude-code" 처럼 같은 걸 가리키는 표기가 여러 개면
// 태그 페이지가 그만큼 갈라져 중복 콘텐츠가 된다. 같은 키(tagKey)를 공유하는 표기를
// 대표 하나(pickCanonical)로 모은다. 표기를 슬러그로 강제하지는 않는다.
//
// 사용:
//   npm run tags:normalize            # 무엇이 바뀌는지만 출력
//   npm run tags:normalize -- --apply # 실제 반영

import { createClient } from "@supabase/supabase-js";
import { tagKey, pickCanonical } from "./lib/tags.mjs";

const apply = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 가 필요합니다.");
  process.exit(1);
}
const sb = createClient(url, key);

// draft 도 함께 고친다. 나중에 공개될 때 옛 표기가 되살아나면 안 된다.
const { data, error } = await sb.from("posts").select("slug,title,status,tags");
if (error) {
  console.error(error);
  process.exit(1);
}
const posts = data ?? [];

// 표기별 사용 횟수 → 키별 그룹
const counts = new Map();
for (const p of posts) {
  for (const t of p.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
}
const groups = new Map();
for (const [tag, count] of counts) {
  const k = tagKey(tag);
  if (!k) continue;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push({ tag, count });
}

// 표기가 둘 이상인 그룹만 통합 대상
const canonicalOf = new Map();
const merges = [];
for (const [k, variants] of groups) {
  const canonical = pickCanonical(variants);
  canonicalOf.set(k, canonical);
  if (variants.length > 1) {
    merges.push({ canonical, variants: variants.filter((v) => v.tag !== canonical) });
  }
}

if (merges.length === 0) {
  console.log("통합할 표기가 없습니다.");
  process.exit(0);
}

console.log(`표기 ${counts.size}개 → 통합 후 ${groups.size}개\n`);
for (const m of merges) {
  const from = m.variants.map((v) => `"${v.tag}"(${v.count})`).join(", ");
  console.log(`  ${from} → "${m.canonical}"`);
}

// 글별로 실제 바뀌는 것만 추린다
const updates = [];
for (const p of posts) {
  const before = p.tags ?? [];
  const seen = new Set();
  const after = [];
  for (const t of before) {
    const k = tagKey(t);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    after.push(canonicalOf.get(k) ?? t);
  }
  if (before.length !== after.length || before.some((t, i) => t !== after[i])) {
    updates.push({ slug: p.slug, title: p.title, before, after });
  }
}

console.log(`\n바뀌는 글 ${updates.length}편`);
for (const u of updates) {
  console.log(`  ${u.slug}`);
  console.log(`    ${JSON.stringify(u.before)}`);
  console.log(` -> ${JSON.stringify(u.after)}`);
}

if (!apply) {
  console.log("\n(dry-run) 반영하려면: npm run tags:normalize -- --apply");
  process.exit(0);
}

for (const u of updates) {
  const { error: upErr } = await sb.from("posts").update({ tags: u.after }).eq("slug", u.slug);
  if (upErr) {
    console.error(`실패 ${u.slug}`, upErr);
    process.exit(1);
  }
}
console.log(`\n반영 완료. ${updates.length}편 갱신.`);
