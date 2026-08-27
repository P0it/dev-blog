import test from "node:test";
import assert from "node:assert/strict";
import { buildProjectSections, parseProjectBody, sectionAnchor } from "./project-sections.ts";

const FENCE = "```";

const FULL = `## 제품 소개

첫 문단이다.

두 번째 문단이다.

## 구상

- [x] 서버 주소만 넣으면 붙는다
- [ ] stdio 와 sse 를 함께 본다

## 기술 선정

| 후보 | 고른 것 | 이유 |
| --- | --- | --- |
| Vercel / CF Workers | CF Workers | 프록시가 필요했다 |

## 구조

${FENCE}mermaid
flowchart LR
  A --> B
${FENCE}

### 브라우저가 주소를 넘긴다

넘긴 주소로 연결을 연다.

### Worker 가 대신 던진다

initialize 를 대신 보낸다.

## 시행착오

### SSE 가 30초마다 끊겼다

**증상** 연결은 되는데 30초쯤에 죽었다.

**시도** 재연결 로직을 붙였다가 되돌렸다.

**결론** Worker 기본 타임아웃이었다.

## 남은 것

- 섹션을 그날그날 끄고 켜기
`;

test("여섯 섹션을 순서대로 분류한다", () => {
  const secs = parseProjectBody(FULL);
  assert.deepEqual(
    secs.map((s) => s.kind),
    ["intro", "requirements", "tech", "architecture", "trials", "remaining"],
  );
});

test("구상은 불릿을 그대로 뽑는다 — 옛 체크박스는 표시만 뗀다", () => {
  const s = parseProjectBody(FULL)[1];
  assert.equal(s.kind, "requirements");
  if (s.kind !== "requirements") return;
  assert.deepEqual(s.items, ["서버 주소만 넣으면 붙는다", "stdio 와 sse 를 함께 본다"]);
});

test("체크박스 없는 구상도 같은 렌더러로 간다", () => {
  const s = parseProjectBody("## 구상\n\n- 서버 주소만 넣으면 붙는다\n- stdio 와 sse 를 함께 본다\n")[0];
  assert.equal(s.kind, "requirements");
  if (s.kind !== "requirements") return;
  assert.deepEqual(s.items, ["서버 주소만 넣으면 붙는다", "stdio 와 sse 를 함께 본다"]);
});

test("옛 3열 표에서는 '고른 것' 열을 이름으로 쓴다", () => {
  const s = parseProjectBody(FULL)[2];
  assert.equal(s.kind, "tech");
  if (s.kind !== "tech") return;
  assert.deepEqual(s.items, ["CF Workers"]);
});

test("구조에서 mermaid 와 단계를 갈라낸다", () => {
  const s = parseProjectBody(FULL)[3];
  assert.equal(s.kind, "architecture");
  if (s.kind !== "architecture") return;
  assert.match(s.diagram ?? "", /flowchart LR/);
  assert.equal(s.steps.length, 2);
  assert.equal(s.steps[0].label, "브라우저가 주소를 넘긴다");
  assert.match(s.steps[0].md, /연결을 연다/);
});

test("시행착오 케이스를 증상·시도·결론으로 쪼갠다", () => {
  const s = parseProjectBody(FULL)[4];
  assert.equal(s.kind, "trials");
  if (s.kind !== "trials") return;
  assert.equal(s.cases.length, 1);
  assert.equal(s.cases[0].title, "SSE 가 30초마다 끊겼다");
  assert.match(s.cases[0].symptom, /30초쯤에 죽었다/);
  assert.match(s.cases[0].attempt, /되돌렸다/);
  assert.match(s.cases[0].result, /타임아웃/);
});

test("모르는 제목은 raw 로 떨어진다", () => {
  const secs = parseProjectBody("## 회고\n\n좋았다.\n");
  assert.equal(secs.length, 1);
  assert.equal(secs[0].kind, "raw");
  assert.equal(secs[0].title, "회고");
});

test("기술 스택은 불릿 목록도 받는다", () => {
  const secs = parseProjectBody("## 기술 스택\n\n- Next.js\n- **Supabase**\n- Vercel\n");
  assert.equal(secs[0].kind, "tech");
  if (secs[0].kind !== "tech") return;
  assert.deepEqual(secs[0].items, ["Next.js", "Supabase", "Vercel"]);
});

test("한 줄 쉼표 나열도 이름으로 쪼갠다", () => {
  const secs = parseProjectBody("## 기술 스택\n\nNext.js, React, TypeScript\n");
  assert.equal(secs[0].kind, "tech");
  if (secs[0].kind !== "tech") return;
  assert.deepEqual(secs[0].items, ["Next.js", "React", "TypeScript"]);
});

test("mermaid 가 없는 구조도 살아남는다", () => {
  const secs = parseProjectBody("## 구조\n\n### 한 단계\n\n설명.\n");
  assert.equal(secs[0].kind, "architecture");
  if (secs[0].kind !== "architecture") return;
  assert.equal(secs[0].diagram, null);
  assert.equal(secs[0].steps.length, 1);
});

test("증상·시도·결론이 없는 케이스는 빈 문자열로 채운다", () => {
  const secs = parseProjectBody("## 시행착오\n\n### 무너진 케이스\n\n그냥 서술.\n");
  assert.equal(secs[0].kind, "trials");
  if (secs[0].kind !== "trials") return;
  assert.equal(secs[0].cases[0].title, "무너진 케이스");
  assert.equal(secs[0].cases[0].symptom, "그냥 서술.");
  assert.equal(secs[0].cases[0].attempt, "");
  assert.equal(secs[0].cases[0].result, "");
});

test("빈 본문은 빈 배열이다", () => {
  assert.deepEqual(parseProjectBody(""), []);
  assert.deepEqual(parseProjectBody("   \n\n"), []);
});

test("## 앞의 머리말은 intro 로 흡수한다", () => {
  const secs = parseProjectBody("제목 없는 도입부.\n\n## 남은 것\n\n- 하나\n");
  const first = secs[0];
  assert.equal(first.kind, "intro");
  if (first.kind !== "intro") return;
  assert.match(first.md, /도입부/);
});

test("코드블록 안의 ## 은 섹션을 가르지 않는다", () => {
  const secs = parseProjectBody(
    `## 제품 소개\n\n${FENCE}md\n## 가짜 제목\n${FENCE}\n\n설명.\n`,
  );
  assert.equal(secs.length, 1);
  assert.equal(secs[0].kind, "intro");
});

test("앵커는 인덱스 기반으로 안정적이다", () => {
  assert.equal(sectionAnchor(0, "제품 소개"), "sec-1");
  assert.equal(sectionAnchor(4, "시행착오"), "sec-5");
});

const INTEG = `## 데이터와 API

### 기상청 단기예보

**용도** 동네 예보를 받아 매장 상세에 오늘 날씨를 붙인다
**링크** https://www.data.go.kr/data/15084084/openapi.do
**방식** REST · 한 시간 주기
**갱신** 자동
**주의** 하루 10,000 건 호출 제한

### 카카오 알림톡

**용도** 예약이 확정되면 손님에게 알림을 보낸다
**방식** 발송 시점에만 호출
`;

test("데이터와 API 는 용도·링크와 나머지 상세로 갈린다", () => {
  const s = parseProjectBody(INTEG)[0];
  assert.equal(s.kind, "integrations");
  if (s.kind !== "integrations") return;
  assert.equal(s.items.length, 2);
  const it = s.items[0];
  assert.equal(it.name, "기상청 단기예보");
  assert.equal(it.purpose, "동네 예보를 받아 매장 상세에 오늘 날씨를 붙인다");
  assert.equal(it.link, "https://www.data.go.kr/data/15084084/openapi.do");
  // 방식·갱신도 상세로 내려간다. 값이 한 문장 이상이라 칩에 넣으면 잘려 못 읽힌다.
  assert.deepEqual(it.details, [
    { label: "방식", value: "REST · 한 시간 주기" },
    { label: "갱신", value: "자동" },
    { label: "주의", value: "하루 10,000 건 호출 제한" },
  ]);
  assert.deepEqual(s.items[1].details, [{ label: "방식", value: "발송 시점에만 호출" }]);
});

const OLD_INTEG = `## 데이터와 API

### 기상청

**제공처** 공공데이터포털
**방식** REST
`;

test("용도가 없는 옛 원고는 첫 라벨을 용도 자리에 세운다", () => {
  const secs = parseProjectBody(OLD_INTEG);
  assert.equal(secs[0].kind, "integrations");
  if (secs[0].kind !== "integrations") return;
  assert.equal(secs[0].items[0].purpose, "공공데이터포털");
  assert.deepEqual(secs[0].items[0].details, [{ label: "방식", value: "REST" }]);
});

const HINT_INTEG = `## 데이터와 API

### 네이버 검색

**아이콘** Naver
**용도** 후기를 모은다
`;

test("아이콘 힌트는 카드 필드로 새지 않는다", () => {
  const secs = parseProjectBody(HINT_INTEG);
  assert.equal(secs[0].kind, "integrations");
  if (secs[0].kind !== "integrations") return;
  assert.equal(secs[0].items[0].icon, "Naver");
  assert.equal(secs[0].items[0].details.length, 0);
});

test("필드가 하나도 없는 데이터와 API 는 raw 로 떨어진다", () => {
  const secs = parseProjectBody("## 데이터와 API\n\n### 이름만 있음\n\n설명 문단.\n");
  assert.equal(secs[0].kind, "raw");
});

test("2열 표는 첫 열만 이름으로 남긴다", () => {
  const secs = parseProjectBody(
    "## 기술 선정\n\n| 기술 | 고른 이유 |\n| --- | --- |\n| Next.js | 어드민이 동적이라 |\n",
  );
  assert.equal(secs[0].kind, "tech");
  if (secs[0].kind !== "tech") return;
  assert.deepEqual(secs[0].items, ["Next.js"]);
});

test("본문에 기술 섹션이 없으면 프런트매터 stack 으로 끼운다", () => {
  const secs = buildProjectSections("## 제품 소개\n\n소개다.\n\n## 남은 것\n\n- 더 할 것\n", [
    "Next.js",
    "Supabase",
  ]);
  assert.deepEqual(secs.map((s) => s.kind), ["intro", "tech", "remaining"]);
  const tech = secs[1];
  if (tech.kind !== "tech") return;
  assert.equal(tech.title, "기술 스택");
  assert.deepEqual(tech.items, ["Next.js", "Supabase"]);
});

test("화면이 없으면 기술 스택이 소개 바로 뒤에 온다", () => {
  const secs = buildProjectSections(
    "## 제품 소개\n\n소개다.\n\n## 요구사항\n\n- [x] 된다\n\n## 구조\n\n### 한 단계\n\n설명.\n",
    ["React"],
  );
  assert.deepEqual(secs.map((s) => s.kind), ["intro", "tech", "requirements", "architecture"]);
});

test("옛 제목 `요구사항` 도 같은 렌더러로 간다", () => {
  const s = parseProjectBody("## 요구사항\n\n- [x] 된다\n")[0];
  assert.equal(s.kind, "requirements");
  if (s.kind !== "requirements") return;
  assert.equal(s.title, "요구사항");
  assert.deepEqual(s.items, ["된다"]);
});

test("화면 갤러리를 파싱한다", () => {
  const s = parseProjectBody(
    "## 화면\n\n### 목록\n\n**이미지** https://cdn/list.png\n**설명** 한눈에 본다\n\n### 상세\n\n**이미지** https://cdn/detail.png\n",
  )[0];
  assert.equal(s.kind, "screens");
  if (s.kind !== "screens") return;
  assert.deepEqual(s.shots, [
    { title: "목록", src: "https://cdn/list.png", caption: "한눈에 본다" },
    { title: "상세", src: "https://cdn/detail.png", caption: "" },
  ]);
});

test("어드민에서 적은 `**파일** <url>` 도 화면·시연으로 잡힌다", () => {
  const shots = parseProjectBody("## 화면\n\n### 목록\n\n**파일** https://cdn/list.png\n")[0];
  assert.equal(shots.kind, "screens");
  if (shots.kind !== "screens") return;
  assert.equal(shots.shots[0].src, "https://cdn/list.png");

  const clips = parseProjectBody("## 시연\n\n### 흐름\n\n**파일** https://cdn/a.mp4\n")[0];
  assert.equal(clips.kind, "demo");
  if (clips.kind !== "demo") return;
  assert.equal(clips.clips[0].src, "https://cdn/a.mp4");
});

test("화면이 비면 raw 로 떨어진다", () => {
  const s = parseProjectBody("## 화면\n\n아직 없다.\n")[0];
  assert.equal(s.kind, "raw");
});

test("기술 스택은 화면 바로 뒤에 온다", () => {
  const secs = buildProjectSections(
    "## 화면\n\n### 목록\n\n**이미지** https://cdn/a.png\n",
    ["React"],
  );
  assert.deepEqual(secs.map((s) => s.kind), ["screens", "tech"]);
});

test("본문에 기술 섹션이 있으면 stack 을 덧붙이지 않는다", () => {
  const secs = buildProjectSections("## 기술 스택\n\n- Astro\n", ["React"]);
  assert.equal(secs.filter((s) => s.kind === "tech").length, 1);
  const tech = secs[0];
  if (tech.kind !== "tech") return;
  assert.deepEqual(tech.items, ["Astro"]);
});

test("시연 섹션을 클립으로 쪼갠다", () => {
  const secs = parseProjectBody(
    "## 시연\n\n### 초안 요청부터 발행까지\n\n**영상** https://cdn.example.com/demo.webm\n**설명** URL 을 넣으면 초안이 나온다\n\n### 소스 없는 장면\n\n**설명** 설명만 있다\n",
  );
  assert.equal(secs[0].kind, "demo");
  if (secs[0].kind !== "demo") return;
  // 소스가 없는 장면은 버린다 — 빈 플레이어가 뜨면 더 나쁘다.
  assert.equal(secs[0].clips.length, 1);
  assert.equal(secs[0].clips[0].title, "초안 요청부터 발행까지");
  assert.equal(secs[0].clips[0].src, "https://cdn.example.com/demo.webm");
  assert.match(secs[0].clips[0].caption, /초안이 나온다/);
});

test("소스가 하나도 없는 시연은 raw 로 떨어진다", () => {
  const secs = parseProjectBody("## 시연\n\n### 장면\n\n**설명** 설명만\n");
  assert.equal(secs[0].kind, "raw");
});

test("기획 섹션을 라벨 필드로 쪼갠다", () => {
  const secs = parseProjectBody(
    "## 기획\n\n**범위** 초안 생성까지만 한다\n**우선순위** 폰에서 던지는 흐름이 먼저\n**넣지 않은 것** 댓글·구독\n",
  );
  assert.equal(secs[0].kind, "plan");
  if (secs[0].kind !== "plan") return;
  assert.deepEqual(
    secs[0].fields.map((f) => f.label),
    ["범위", "우선순위", "넣지 않은 것"],
  );
  assert.deepEqual(secs[0].fields[0].values, ["초안 생성까지만 한다"]);
});

test("기획의 같은 라벨은 하나로 묶인다", () => {
  const secs = parseProjectBody(
    "## 기획\n\n**접은 안** 첫째\n**범위** 초안까지\n**접은 안** 둘째\n**넣지 않은 것** 로그인\n**넣지 않은 것** 결제\n",
  );
  assert.equal(secs[0].kind, "plan");
  if (secs[0].kind !== "plan") return;
  // 처음 나온 순서를 지킨다 — 접은 안, 범위, 넣지 않은 것
  assert.deepEqual(secs[0].fields.map((f) => f.label), ["접은 안", "범위", "넣지 않은 것"]);
  assert.deepEqual(secs[0].fields[0].values, ["첫째", "둘째"]);
  assert.deepEqual(secs[0].fields[2].values, ["로그인", "결제"]);
});

test("라벨이 없는 기획은 raw 로 떨어진다", () => {
  const secs = parseProjectBody("## 기획\n\n그냥 문단이다.\n");
  assert.equal(secs[0].kind, "raw");
});

// 인터뷰는 기획에서 떼어 낸 문답 섹션이다. 원고 형태는 같고 화면만 다르므로
// 파서는 종류만 갈라 준다.
test("인터뷰 섹션은 기획과 같은 라벨 필드로 쪼개진다", () => {
  const secs = parseProjectBody(
    "## 인터뷰\n\n**소개** 폰에서 URL 을 던지면 초안이 나와요\n**계기** 글감을 자꾸 놓쳤거든요\n",
  );
  assert.equal(secs[0].kind, "interview");
  if (secs[0].kind !== "interview") return;
  assert.deepEqual(
    secs[0].fields.map((f) => f.label),
    ["소개", "계기"],
  );
});

test("라벨이 없는 인터뷰는 raw 로 떨어진다", () => {
  const secs = parseProjectBody("## 인터뷰\n\n그냥 문단이다.\n");
  assert.equal(secs[0].kind, "raw");
});

test("유저 플로우는 mermaid 를 떼어낸다", () => {
  const secs = parseProjectBody(
    `## 유저 플로우\n\n${FENCE}mermaid\nflowchart LR\n  A --> B\n${FENCE}\n\n### 첫 걸음\n\n폰에서 URL 을 붙인다.\n`,
  );
  assert.equal(secs[0].kind, "userflow");
  if (secs[0].kind !== "userflow") return;
  assert.equal(secs[0].diagram, "flowchart LR\n  A --> B");
  assert.deepEqual(secs[0].steps.map((s) => s.label), ["첫 걸음"]);
});

test("'유저 플로' 표기도 같은 섹션으로 받는다", () => {
  const secs = parseProjectBody(`## 유저 플로\n\n${FENCE}mermaid\nflowchart LR\n  A --> B\n${FENCE}\n`);
  assert.equal(secs[0].kind, "userflow");
});

test("개발 과정은 단계와 '붙인 것' 을 갈라낸다", () => {
  const secs = parseProjectBody(
    "## 개발 과정\n\n### 1. 폰으로 초안을 요청하고 싶었다\n\n서버 상태가 필요했다.\n\n**붙인 것** Supabase, Vercel\n\n### 2. 워커를 붙였다\n\n큐를 돌렸다.\n",
  );
  assert.equal(secs[0].kind, "journey");
  if (secs[0].kind !== "journey") return;
  assert.equal(secs[0].steps.length, 2);
  assert.deepEqual(secs[0].steps[0].added, ["Supabase", "Vercel"]);
  assert.equal(secs[0].steps[0].md, "서버 상태가 필요했다.");
  assert.deepEqual(secs[0].steps[1].added, []);
});

test("'붙인 것' 이 없는 단계도 서술은 온전히 남는다", () => {
  const secs = parseProjectBody("## 개발 과정\n\n### 시작\n\n첫 줄.\n\n둘째 줄.\n");
  assert.equal(secs[0].kind, "journey");
  if (secs[0].kind !== "journey") return;
  assert.equal(secs[0].steps[0].md, "첫 줄.\n\n둘째 줄.");
});

test("개발 과정 제목의 앞머리 번호는 뗀다", () => {
  const secs = parseProjectBody("## 개발 과정\n\n### 1. 시작했어요\n\n내용.\n\n### 2) 다음\n\n내용.\n");
  assert.equal(secs[0].kind, "journey");
  if (secs[0].kind !== "journey") return;
  assert.deepEqual(secs[0].steps.map((s) => s.label), ["시작했어요", "다음"]);
});

test("유저 플로우의 갈라짐을 조건·결과로 쪼갠다", () => {
  const secs = parseProjectBody(
    "## 유저 플로우\n\n### 결과를 확인한다\n\n한 화면에서 본다.\n\n**갈라짐** 괜찮다 → 발행 / 아쉽다 → 다시 요청\n",
  );
  assert.equal(secs[0].kind, "userflow");
  if (secs[0].kind !== "userflow") return;
  assert.equal(secs[0].steps[0].md, "한 화면에서 본다.");
  assert.deepEqual(secs[0].steps[0].branches, [
    { when: "괜찮다", then: "발행" },
    { when: "아쉽다", then: "다시 요청" },
  ]);
});

test("갈라짐이 없는 단계도 그대로 남는다", () => {
  const secs = parseProjectBody("## 유저 플로우\n\n### 첫 걸음\n\n붙이면 끝이에요.\n");
  assert.equal(secs[0].kind, "userflow");
  if (secs[0].kind !== "userflow") return;
  assert.deepEqual(secs[0].steps[0].branches, []);
  assert.equal(secs[0].diagram, null);
});

test("mermaid 만 있는 옛 유저 플로우도 살아남는다", () => {
  const secs = parseProjectBody(`## 유저 플로우\n\n${FENCE}mermaid\nflowchart LR\n  A --> B\n${FENCE}\n`);
  assert.equal(secs[0].kind, "userflow");
  if (secs[0].kind !== "userflow") return;
  assert.equal(secs[0].steps.length, 0);
  assert.equal(secs[0].diagram, "flowchart LR\n  A --> B");
});
