// 배포 서버 직접 생성 — 다이애나 후(YC) 영상으로 포스팅 글 작성.
// 실행: VISUAL_BASE_URL=https://hyun-blog-ten.vercel.app node --env-file=.env.local scripts/_gen-post.mjs
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

const SLUG = "ai-native-company";
const BASE_URL = process.env.VISUAL_BASE_URL ?? "http://localhost:3000";

// ```visual / ```illustration 블록을 escape 없이 만드는 헬퍼
const visual = (obj) => "```visual\n" + JSON.stringify(obj, null, 2) + "\n```";
const illustration = (svg) => "```illustration\n" + svg.trim() + "\n```";

// --- 시각자료 ----------------------------------------------------------

const calloutOS = visual({
  pattern: "callout-card",
  alt: "AI는 회사가 돌아가는 운영체제다",
  accent: "primary",
  icon: "cpu",
  heading: "AI는 도구가 아니라, 회사를 돌리는 운영체제다",
  body: "모든 워크플로·결정·프로세스가 끊임없이 학습하고 개선되는 지능 계층을 통과해야 합니다.",
});

const loopSvg = `<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>회사가 닫힌 루프로 도는 구조 — 실행, 포착, 개선이 순환한다</title>
  <defs>
    <marker id="ah" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" style="fill: var(--fg-neutral)" />
    </marker>
  </defs>
  <path d="M498 104 Q686 156 654 296"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" stroke-linecap="round" marker-end="url(#ah)" />
  <path d="M540 352 Q400 430 276 352"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" stroke-linecap="round" marker-end="url(#ah)" />
  <path d="M150 296 Q92 150 306 100"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" stroke-linecap="round" marker-end="url(#ah)" />
  <rect x="312" y="48" width="176" height="74" rx="18"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="400" y="92" text-anchor="middle"
    style="fill: var(--fg-strong); font: 700 19px var(--font-sans)">프로세스 실행</text>
  <rect x="548" y="300" width="208" height="74" rx="18"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="652" y="344" text-anchor="middle"
    style="fill: var(--fg-strong); font: 700 19px var(--font-sans)">산출물·결과 포착</text>
  <rect x="44" y="300" width="232" height="74" rx="18"
    style="fill: var(--diag-purple-fill); stroke: var(--diag-purple-stroke); stroke-width: 2.5" />
  <text x="160" y="344" text-anchor="middle"
    style="fill: var(--fg-strong); font: 700 19px var(--font-sans)">지능 계층 학습·개선</text>
</svg>`;
const calloutLoop = illustration(loopSvg);

const statSprint = visual({
  pattern: "stat-card",
  alt: "닫힌 루프를 도입한 팀의 스프린트 성과",
  accent: "primary",
  stats: [
    { value: "절반", label: "스프린트 소요 시간", caption: "닫힌 루프 도입 팀", icon: "timer", accent: "primary" },
    { value: "약 10배", label: "같은 기간 산출량", caption: "출시·개선 결과 기준", icon: "trending-up", accent: "success" },
  ],
});

const stepFactory = visual({
  pattern: "step-card",
  alt: "소프트웨어 팩토리의 작동 흐름 4단계",
  eyebrow: "SOFTWARE FACTORY",
  title: "소프트웨어 팩토리의 작동 방식",
  accent: "primary",
  steps: [
    { label: "명세·테스트 작성", sublabel: "사람", icon: "file-text" },
    { label: "구현 생성", sublabel: "에이전트", icon: "code" },
    { label: "테스트까지 반복", sublabel: "에이전트", icon: "rotate-cw" },
    { label: "결과 판정", sublabel: "사람", icon: "check-check" },
  ],
});

const stepRoles = visual({
  pattern: "step-card",
  alt: "AI 네이티브 회사의 세 가지 직원 유형",
  eyebrow: "THREE ROLES",
  title: "미래 회사의 세 가지 직원 유형",
  accent: "accent",
  steps: [
    { label: "빌더-오퍼레이터", sublabel: "IC · 직접 만들고 운영", icon: "wrench" },
    { label: "직접 책임자", sublabel: "DRI · 전략·고객 성과", icon: "target" },
    { label: "AI 파운더", sublabel: "맨 앞에서 본보기로", icon: "rocket" },
  ],
});

// --- 본문 --------------------------------------------------------------

const bodyMd = `> Y Combinator 파트너 다이애나 후는 AI를 '생산성 도구'로 보는 시각이 지금의 변화를 놓치고 있다고 말합니다. AI는 회사가 쓰는 도구가 아니라 회사가 그 위에서 돌아가는 운영체제여야 하며, 조직의 역할과 구조까지 처음부터 다시 설계해야 한다는 것입니다.

다이애나 후(Diana Hu)는 Y Combinator의 그룹 파트너입니다. YC는 에어비앤비·레딧·트위치·도어대시를 초기에 키워 낸, 세계에서 가장 영향력 있는 스타트업 액셀러레이터입니다. YC 파트너는 매년 수백 개 스타트업이 어떻게 성공하고 실패하는지를 가장 가까이서 지켜보는 자리인 만큼, 후의 이야기는 최근 빠르게 성장하는 회사들에서 실제로 관찰되는 패턴이라는 점에서 무게가 있습니다.

## AI는 회사가 쓰는 도구가 아니라, 회사를 돌리는 운영체제다

지금 대부분은 AI를 생산성의 언어로 이야기합니다. 엔지니어를 더 생산적으로 만든다거나, 기존 워크플로에 코파일럿을 붙여 기능을 더 많이 내보낸다는 식입니다. 다이애나 후(Diana Hu)는 이 프레임이 지금 벌어지는 변화의 핵심을 놓치고 있다고 봅니다.

진짜 변화는 생산성이 조금 오르는 게 아닙니다. **이전에는 아예 불가능했던 새로운 능력**이 생기는 것입니다. 적합한 사람 한 명이 AI 도구를 손에 쥐면, 예전에는 팀 전체가 달라붙어야 했거나 만들 수조차 없던 기능을 혼자 만들어 냅니다.

그래서 후는 AI를 보는 시각을 통째로 바꿔야 한다고 말합니다. AI는 회사가 가끔 꺼내 쓰는 도구가 아닙니다. 회사 전체가 그 위에서 돌아가는 운영체제여야 합니다. 모든 워크플로와 결정과 프로세스가, 끊임없이 학습하고 개선되는 하나의 '지능 계층'을 통과한다는 뜻입니다.

${calloutOS}

## 모든 프로세스를 닫힌 루프로 감싸야 한다

회사를 운영체제로 만든다는 건 구체적으로 무엇일까요. 후는 회사의 모든 중요한 프로세스를 **지능형 닫힌 루프(closed loop)**로 감싸라고 말합니다.

제어공학을 공부해 봤다면 열린 루프와 닫힌 루프의 차이가 익숙할 것입니다. 열린 루프는 피드백이 없는 시스템입니다. 과거의 회사는 대체로 열린 루프로 돌아갔습니다. 결정을 내리고 실행은 하지만, 그 결과를 체계적으로 측정해 프로세스에 되먹이는 일은 잘 하지 않았습니다. 그래서 열린 루프는 본질적으로 정보가 새어 나갑니다.

닫힌 루프는 다릅니다. 스스로를 조절합니다. 출력을 계속 관찰하고, 정해진 목표에 더 잘 맞도록 프로세스를 조정합니다. 스스로 개선하는 에이전트를 쓰면 회사도 이렇게 닫힌 루프로 돌릴 수 있습니다.

${calloutLoop}

그러려면 회사 전체를 **질의 가능한(queryable)** 상태로 만들어야 합니다. 조직 전체가 AI가 읽을 수 있는 형태여야 한다는 뜻입니다. 모든 중요한 행동은 회사 중심의 지능이 학습하고 활용할 산출물을 남겨야 합니다. 회의는 AI 노트테이커로 기록하고, DM과 이메일은 줄이고, 모든 채널에 에이전트를 심고, 매출·영업·엔지니어링·채용·운영까지 회사의 모든 것을 담은 대시보드를 만드는 식입니다.

## 스프린트 계획부터 회사가 달라진다

추상적으로 들린다면 엔지니어링 스프린트 계획을 예로 들어 보겠습니다. 에이전트가 Linear 티켓, Slack의 엔지니어링 채널, 이메일이나 Pylon·GitHub에 쌓인 고객 피드백, Notion·Google 문서의 상위 계획, 영업 통화와 데일리 스탠드업 녹음에 모두 접근할 수 있다고 합시다.

그러면 에이전트는 지난 스프린트에 실제로 무엇이 출시됐고 그것이 고객의 요구를 얼마나 충족했는지 분석할 수 있습니다. 한 걸음 더 나아가, 무엇이 출시됐고 무엇이 통했고 무엇이 통하지 않았는지를 모두 본 상태에서 훨씬 예측 가능하고 정확한 다음 스프린트 계획을 제안합니다. 정보가 잔뜩 새어 나가던 관리자 보고는 사라집니다.

후는 직접 엔지니어링 팀을 이끌어 봤고 여러 YC 회사에서 이 변화를 지켜봤다며, 이것을 게임체인저라고 표현합니다. 끊임없는 조율이 필요하던 일이 기본값으로 읽고 질의할 수 있게 됩니다.

${statSprint}

원칙은 하나로 모입니다. 모델에게는 직원에게 줄 만큼의 컨텍스트를 줘야 그 능력이 온전히 나옵니다. 그렇게 할 때 회사는 정보가 흩어지고 사람이 일일이 해석하던 열린 루프에서, 상태와 결정과 결과가 끊임없이 지능 계층으로 되먹여지는 닫힌 루프로 바뀝니다.

## 사람은 명세를 쓰고, 코드는 에이전트가 짓는다

가장 속도가 빠른 회사들에서는 제품을 만드는 방식 자체에 새로운 패러다임이 나타나고 있습니다. 후는 이를 **소프트웨어 팩토리(software factory)**라고 부릅니다. 테스트 주도 개발(TDD)에 익숙하다면, 그 다음 진화라고 보면 됩니다.

소프트웨어 팩토리에서 사람은 무엇을 만들지 정의하는 명세와, 성공을 정의하는 테스트를 작성합니다. 그러면 AI 에이전트가 구현을 생성하고, 테스트가 통과할 때까지 코드를 고쳐 나갑니다. 사람은 무엇을 만들지 정하고 결과를 판정하며, 실제 코드 작성은 에이전트의 몫입니다.

${stepFactory}

어떤 회사들은 이것을 끝까지 밀어붙였습니다. 저장소에 사람이 손으로 쓴 코드가 한 줄도 없이, 명세와 테스트 하네스만 남은 수준입니다. 명세와 시나리오 기반 검증이 에이전트를 움직여, 정해진 만족 기준을 넘을 때까지 테스트를 쓰고 코드를 고치게 합니다. 그리고 그것이 실제로 작동합니다.

후는 이것이 흔히 말하는 '1000배 엔지니어'를 실현하는 길이라고 말합니다. 엔지니어 한 명을, 그가 예전이라면 결코 만들 수 없었을 것을 만들게 해 주는 에이전트 시스템으로 둘러싸는 것입니다. 1000배, 심지어 1만 배 엔지니어의 시대가 이미 왔다는 것입니다.

## 관리 계층은 사라지고 세 가지 직원 유형이 남는다

AI 루프가 곳곳에 깔리고, 질의 가능한 조직과 소프트웨어 팩토리가 자리잡으면, 고전적인 관리 계층은 더 이상 말이 되지 않습니다. 과거에는 정보를 조직의 위아래로 비효율적으로 실어 나르는 중간 관리자와 조율자가 필요했습니다. 이제는 지능 계층이 그 역할을 합니다.

회사가 질의 가능하고 산출물이 풍부하며 AI가 읽을 수 있다면, 사람이 중간에서 정보를 중계하는 일은 거의 사라져야 합니다. 회사의 속도는 결국 정보 흐름의 속도만큼입니다. 사람이 중계하던 계층을 한 겹씩 걷어낼 때마다, 그만큼이 그대로 속도가 됩니다.

블록(Block)의 잭 도시는 도구를 깊이 파고든 끝에 같은 결론에 이르렀습니다. 조직도와 관리 구조를 그대로 둔 채라면 이 변화를 통째로 놓친 것이라고요. 회사 자체를 지능 계층으로 다시 지어야 하며, 사람은 정보를 통과시키는 중계자가 아니라 가장자리에서 그 계층을 이끄는 존재여야 합니다. 도시는 앞으로 모든 회사가 세 가지 직원 유형을 갖게 될 것이라고 말합니다.

${stepRoles}

첫째는 **빌더-오퍼레이터**, 곧 개인 기여자(IC)입니다. AI 네이티브 회사에서 직접 무언가를 만들고 운영하는 사람으로, 엔지니어에 한정되지 않습니다. 운영도 지원도 영업도 모두 직접 만듭니다. 모두가 회의에 피치덱이 아니라 작동하는 프로토타입을 들고 옵니다.

둘째는 **직접 책임자(DRI)**입니다. 전략과 고객 성과에 집중하는 사람으로, 고전적인 관리자가 아니라 결과에 명확한 책임을 지는 사람입니다. 한 사람, 하나의 성과, 숨을 곳은 없습니다.

셋째는 **AI 파운더 유형**입니다. 여전히 직접 만들고, 코칭하고, 본보기로 이끕니다. 창업자라면 이게 바로 당신이어야 합니다. AI 전략을 남에게 위임하지 말고, 맨 앞에서 거대한 능력 도약이 어떤 것인지 직접 보여줘야 합니다.

## 헤드카운트가 아니라 토큰을 최대화하는 회사가 이긴다

이 구조에서 회사는 훨씬 작은 팀으로 큰 결과를 냅니다. 후는 결정적인 전환이 헤드카운트가 아니라 토큰 사용량을 최대화하는 것이라고 말합니다. 가장 뛰어난 회사는 '토큰 맥싱'을 하는 회사가 될 것입니다.

AI 도구를 쓰는 한 사람이, AI 이전 회사에서 큰 엔지니어링 팀이 하던 일을 해낼 수 있습니다. 그만큼 엔지니어링·디자인·인사·관리 팀이 극적으로 가벼워진다는 뜻입니다. 그래서 불편할 만큼 높은 API 비용도 감수해야 합니다. 그 비용은 훨씬 비싸고 비대한 헤드카운트를 대신하는 것이기 때문입니다.

다만 후는 이 모든 걸 자기 말만 믿지 말라고 덧붙입니다. 이 도구들의 힘에 대한 확신은 남에게 외주 줄 수 없습니다. 직접 코딩 에이전트 앞에 앉아, 무엇이 이제 가능한지에 대한 자기 자신의 고정관념이 깨질 때까지 써 봐야 합니다.

## 지금이 스타트업이 거인을 앞지를 기회다

초기 단계 창업자는 이 흐름에서 앞서 나갈 큰 이점이 있습니다. 다시 훈련시킬 레거시 시스템도, 수천 명의 사람도 없습니다. 첫날부터 회사를 올바르게 지을 만큼 작습니다.

기존 회사는 정반대 처지입니다. 살아 있는 제품을 유지하고 키우면서, 동시에 수년간 쌓인 표준 운영 절차와 소프트웨어를 만드는 방식에 대한 핵심 가정을 풀어내야 합니다. 일부는 핵심 사업과 분리된 작은 스컹크웍스 팀을 띄워 AI 네이티브 시스템을 처음부터 만드는 식으로 해냅니다. 하지만 대부분은 핵심 프로세스를 바꿀 때마다 이미 잘 돌아가던 무언가가 깨질 위험을 안습니다.

그래서 거대 기업은 본질적으로 AI 네이티브로 가기가 훨씬 어렵습니다. 스타트업에는 그 제약이 없고, 그것이 결정적인 우위입니다. 시스템과 워크플로와 문화를 처음부터 AI를 중심으로 설계할 수 있고, 그 결과 기존 강자보다 훨씬 빠르게 움직일 수 있습니다.

## 참고 자료

- 원문: [How To Build A Company With AI From The Ground Up — Y Combinator](https://www.youtube.com/watch?v=EN7frwQIbKc)

> 이 글은 Y Combinator의 영상(다이애나 후, YC 파트너)을 번역·정리한 것입니다. 원저작권은 Y Combinator에 있습니다.`;

// --- 생성 -------------------------------------------------------------

function thumbKindFromSlug(slug) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return "abcdef"[h % 6];
}
function deriveExcerpt(md) {
  const line = md.split("\n").find((l) => l.startsWith("> "));
  return line ? line.slice(2).trim() : null;
}

async function main() {
  // 네이티브 렌더 — body_md에 ```visual / ```illustration 블록을 그대로 둔다.
  const row = {
    slug: SLUG,
    title: "AI 네이티브 회사 만들기 — YC 다이애나 후가 말하는 조직 재설계",
    excerpt: deriveExcerpt(bodyMd),
    body_md: bodyMd,
    category_slug: null,
    tags: ["AI", "스타트업", "AI 네이티브", "조직"],
    reading_min: "8분",
    status: "draft",
    thumb_kind: thumbKindFromSlug(SLUG),
    is_featured: false,
  };

  await sb.from("posts").delete().eq("slug", SLUG);
  const { error } = await sb.from("posts").insert(row);
  if (error) throw error;

  console.log(`✓ draft 글 생성 완료 — /admin/editor?slug=${SLUG}`);
}

main().catch((e) => {
  console.error("실패:", e?.message ?? e);
  process.exit(1);
});
