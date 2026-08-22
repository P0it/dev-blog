import test from "node:test";
import assert from "node:assert/strict";
import { buildProjectSections, parseProjectBody, sectionAnchor } from "./project-sections.ts";

const FENCE = "```";

const FULL = `## 제품 소개

첫 문단이다.

두 번째 문단이다.

## 요구사항

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

test("요구사항 체크박스를 파싱한다", () => {
  const s = parseProjectBody(FULL)[1];
  assert.equal(s.kind, "requirements");
  if (s.kind !== "requirements") return;
  assert.deepEqual(s.items, [
    { done: true, text: "서버 주소만 넣으면 붙는다" },
    { done: false, text: "stdio 와 sse 를 함께 본다" },
  ]);
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

**제공처** 공공데이터포털
**링크** https://www.data.go.kr/data/15084084/openapi.do
**방식** REST API, 한 시간 주기 폴링
**적재** 초기 3년치는 CSV 로 받아 벌크 insert, 이후 증분만 API
**주의** 하루 10,000 건 호출 제한

### 카카오 알림톡

**제공처** 카카오 비즈니스
**방식** REST API, 발송 시점에만 호출
`;

test("데이터와 API 섹션을 항목·필드로 쪼갠다", () => {
  const s = parseProjectBody(INTEG)[0];
  assert.equal(s.kind, "integrations");
  if (s.kind !== "integrations") return;
  assert.equal(s.items.length, 2);
  assert.equal(s.items[0].name, "기상청 단기예보");
  assert.deepEqual(s.items[0].fields[0], { label: "제공처", value: "공공데이터포털" });
  assert.equal(s.items[0].fields[1].value, "https://www.data.go.kr/data/15084084/openapi.do");
  assert.equal(s.items[0].fields.length, 5);
  assert.equal(s.items[1].fields.length, 2);
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

test("요구사항이 있으면 그 다음 자리에 끼운다", () => {
  const secs = buildProjectSections(
    "## 제품 소개\n\n소개다.\n\n## 요구사항\n\n- [x] 된다\n\n## 구조\n\n### 한 단계\n\n설명.\n",
    ["React"],
  );
  assert.deepEqual(secs.map((s) => s.kind), ["intro", "requirements", "tech", "architecture"]);
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
    "## 기획\n\n**문제** 맥북 앞에 없을 때 글감을 놓친다\n**사용자** 혼자 블로그를 굴리는 개발자\n**넣지 않은 것** 댓글·구독\n",
  );
  assert.equal(secs[0].kind, "plan");
  if (secs[0].kind !== "plan") return;
  assert.deepEqual(
    secs[0].fields.map((f) => f.label),
    ["문제", "사용자", "넣지 않은 것"],
  );
  assert.equal(secs[0].fields[0].value, "맥북 앞에 없을 때 글감을 놓친다");
});

test("라벨이 없는 기획은 raw 로 떨어진다", () => {
  const secs = parseProjectBody("## 기획\n\n그냥 문단이다.\n");
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
