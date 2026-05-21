// Mock 데이터를 Supabase에 1회성으로 밀어넣는 seed 스크립트.
// 실행: npm run seed
//
// 멱등성: categories는 upsert, posts/projects는 slug/name 기준 upsert.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("환경변수 누락: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// --- categories ---------------------------------------------------------
const categoryGroups = [
  { slug: "tech", label: "Tech", children: [
    { slug: "claude", label: "Claude" },
    { slug: "infra", label: "Infra" },
    { slug: "ai", label: "AI" },
  ]},
  { slug: "business", label: "Business", children: [
    { slug: "insights", label: "Insights" },
  ]},
  { slug: "design", label: "Design", children: [] },
];

// 라벨 → slug 매핑 (posts.ts의 category 필드를 슬러그로 변환).
// rawPosts의 옛 한글 카테고리는 매핑에 없으므로 category_slug=null(미분류)이 된다.
const labelToSlug = new Map();
const categoryRows = [];
let order = 0;
for (const g of categoryGroups) {
  categoryRows.push({ slug: g.slug, label: g.label, parent_slug: null, sort_order: order++ });
  labelToSlug.set(g.label, g.slug);
  for (const c of g.children) {
    categoryRows.push({ slug: c.slug, label: c.label, parent_slug: g.slug, sort_order: order++ });
    labelToSlug.set(c.label, c.slug);
  }
}

// --- posts --------------------------------------------------------------
// posts.ts의 "2026.05.04" → ISO
const toIso = (d) => new Date(d.replace(/\./g, "-") + "T09:00:00+09:00").toISOString();

const rawPosts = [
  { slug: "claude-code-subprocess", title: "Claude Code subprocess 패턴 — 워커 없이 AI를 호출하는 가장 단순한 방법", excerpt: "로컬 어드민에서 직접 CLI를 띄우면 launchd, websocket, 큐 전부 사라진다.", category: "에이전트", tags: ["claude-code","subprocess","에이전트"], date: "2026.05.04", readingMin: "12분", thumbKind: "a", isFeatured: true, featuredChips: [{variant:"blue",label:"에이전트"},{variant:"default",label:"deep dive"}] },
  { slug: "mcp-ecosystem", title: "MCP가 바꾸고 있는 개발자 도구 생태계", excerpt: "도구 발견, 권한, 그리고 작은 프로토콜이 어디까지 갈 수 있는지.", category: "MCP", tags: ["mcp","도구"], date: "2026.04.28", readingMin: "8분", thumbKind: "b", isFeatured: true, featuredChips: [{variant:"purple",label:"MCP"}] },
  { slug: "news-briefing-system", title: "News Briefing System — 매일 06:00의 카카오톡 봇", excerpt: "Claude Max + macOS launchd 만으로 만든 1인용 뉴스레터 시스템.", category: "실험", tags: ["launchd","kakaotalk","1인용"], date: "2026.04.20", readingMin: "6분", thumbKind: "c", isFeatured: true, featuredChips: [{variant:"green",label:"실험"}] },
  { slug: "routines-verification", title: "Routines로 무엇이 되고 무엇이 안 되는지 — 직접 검증 노트", excerpt: "문서와 실제 동작이 다른 지점들. 토큰 한도, 백그라운드 큐, 에러 핸들링까지.", category: "에이전트", tags: ["claude-code","subprocess","개발기"], date: "2026.05.10", readingMin: "7분", thumbKind: "d" },
  { slug: "how-i-built-this-blog", title: "이 블로그를 만든 이야기 — 로컬 어드민 + Vercel 독자 사이트", excerpt: "왜 worker를 안 쓰고 Mac에서만 글을 쓰기로 했는가. 다기기 셋업 5분.", category: "개발자 도구", tags: ["next.js","supabase","개발기"], date: "2026.05.05", readingMin: "9분", thumbKind: "e" },
  { slug: "ai-draft-lessons", title: "AI 자동 초안 기능을 만들면서 배운 것", excerpt: "YouTube 자막 + Readability + Claude subprocess. 30~60초 만에 검토 가능한 초안이 나온다.", category: "트렌드", tags: ["claude-code","ai","draft"], date: "2026.04.30", readingMin: "5분", thumbKind: "f" },
  { slug: "claude-code-context", title: "Claude Code 컨텍스트 관리 — 무엇을 잊고 무엇을 들고 있는가", category: "에이전트", date: "2026.04.18" },
  { slug: "tool-calling-observations", title: "AI 에이전트의 tool calling — 6개월간의 관찰", category: "에이전트", date: "2026.04.10" },
  { slug: "year-in-review-2025", title: "올해 만든 것들 — 1인 개발 회고", category: "회고", date: "2025.12.22" },
  { slug: "server-actions-patterns", title: "Next.js App Router에서의 Server Actions 패턴", category: "웹 인프라", date: "2025.11.30" },
  { slug: "supabase-rls-month", title: "Supabase RLS 한 달 운영기", category: "웹 인프라", date: "2025.10.14" },
];

const postRows = rawPosts.map((p) => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt ?? null,
  body_md: null,
  category_slug: labelToSlug.get(p.category) ?? null,
  tags: p.tags ?? [],
  thumb_kind: p.thumbKind ?? "a",
  reading_min: p.readingMin ?? null,
  is_featured: p.isFeatured ?? false,
  featured_chips: p.featuredChips ?? [],
  status: "published",
  published_at: toIso(p.date),
}));

// --- projects -----------------------------------------------------------
const projectRows = [
  { name: "News Briefing", year: "2025", description: "매일 06:00 KST에 카카오톡으로 받는 1인용 뉴스레터. 시사·경제·테크 8개 섹션을 Claude가 정리해서 보내준다.", plan: "정보 과잉의 반대 — 매일 같은 시간, 한 메시지로 끝내는 브리핑. 읽는 데 5분.", build_note: "macOS launchd 크론 → Claude Max로 섹션별 요약 → KakaoTalk 알림톡 API로 전송.", stack: ["Next.js","Claude Max","launchd","KakaoTalk API"], thumb_kind: "c", url: "news-briefing.vercel.app", host: "vercel", sort_order: 1 },
  { name: "hyunwoo.blog", year: "2026", description: "지금 보고 있는 이 블로그. 로컬 어드민 + Vercel 독자 사이트 구조. AI 자동 초안과 영어 자동 번역이 붙어 있다.", plan: "쓰기는 Mac에서만, 읽기는 어디서나. 워커·큐 없이 가장 단순한 1인 블로그.", build_note: "Next.js + Supabase, Claude Code subprocess로 초안 생성. Vercel에 정적 + ISR 배포.", stack: ["Next.js","Supabase","Claude Code","Vercel"], thumb_kind: "a", url: "hyunwoo-blog.vercel.app", host: "vercel", sort_order: 2 },
  { name: "MCP Probe", year: "2026", description: "MCP 서버를 붙여보고 어떤 도구가 노출되는지, 어떤 호출이 실패하는지 보여주는 디버그 콘솔.", plan: "MCP 스펙을 읽으면서 직접 만져보는 도구. 한 화면에서 connect → list → call → 응답.", build_note: "Cloudflare Workers로 MCP 서버 프록시, 브라우저에서 stdio·sse 두 전송 모두 시뮬레이션.", stack: ["TypeScript","Cloudflare Workers","MCP SDK"], thumb_kind: "b", url: "mcp-probe.pages.dev", host: "cloudflare", sort_order: 3 },
  { name: "Routines Notebook", year: "2026", description: "Claude Routines로 무엇이 되고 무엇이 안 되는지 직접 테스트해보는 노트북. 검증한 패턴은 글로 정리한다.", plan: "스펙 문서와 실제 동작의 차이를 빠르게 확인하는 작업장. 통과한 케이스만 글로.", build_note: "Anthropic API를 호출하는 셀 기반 노트북. 케이스별 결과를 markdown으로 export.", stack: ["Anthropic API","TypeScript","Cloudflare Pages"], thumb_kind: "e", url: "routines-notebook.pages.dev", host: "cloudflare", sort_order: 4 },
];

// --- 실행 ---------------------------------------------------------------
async function run() {
  console.log(`→ categories upsert (${categoryRows.length})`);
  // parent_slug FK 때문에 부모 먼저 / 자식 나중에 두 번 나눠서 insert
  const parents = categoryRows.filter((c) => c.parent_slug === null);
  const children = categoryRows.filter((c) => c.parent_slug !== null);
  let r = await sb.from("categories").upsert(parents, { onConflict: "slug" });
  if (r.error) throw r.error;
  r = await sb.from("categories").upsert(children, { onConflict: "slug" });
  if (r.error) throw r.error;

  console.log(`→ posts upsert (${postRows.length})`);
  r = await sb.from("posts").upsert(postRows, { onConflict: "slug" });
  if (r.error) throw r.error;

  console.log(`→ projects upsert (${projectRows.length})`);
  // projects는 unique key가 name이 아니므로 먼저 비우고 새로 넣음
  r = await sb.from("projects").delete().neq("name", "");
  if (r.error) throw r.error;
  r = await sb.from("projects").insert(projectRows);
  if (r.error) throw r.error;

  console.log("✅ done");
}

run().catch((e) => { console.error("❌", e); process.exit(1); });
