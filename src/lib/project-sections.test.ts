import test from "node:test";
import assert from "node:assert/strict";
import { parseProjectBody, sectionAnchor } from "./project-sections.ts";

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

test("기술 선정 표에서 구분선을 걷어낸다", () => {
  const s = parseProjectBody(FULL)[2];
  assert.equal(s.kind, "tech");
  if (s.kind !== "tech") return;
  assert.deepEqual(s.head, ["후보", "고른 것", "이유"]);
  assert.deepEqual(s.rows, [["Vercel / CF Workers", "CF Workers", "프록시가 필요했다"]]);
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

test("표가 없는 기술 선정도 던지지 않고 raw 가 된다", () => {
  const secs = parseProjectBody("## 기술 선정\n\n그냥 문단이다.\n");
  assert.equal(secs[0].kind, "raw");
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

test("기술 선정은 2열 표도 받는다", () => {
  const secs = parseProjectBody(
    "## 기술 선정\n\n| 기술 | 고른 이유 |\n| --- | --- |\n| Next.js | 어드민이 동적이라 |\n",
  );
  assert.equal(secs[0].kind, "tech");
  if (secs[0].kind !== "tech") return;
  assert.deepEqual(secs[0].head, ["기술", "고른 이유"]);
  assert.deepEqual(secs[0].rows, [["Next.js", "어드민이 동적이라"]]);
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
