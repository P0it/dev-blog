# 실험실(Lab) 포트폴리오 개편 설계

작성일: 2026-08-22

## 배경

`/lab` 은 지금 프로젝트 카드 그리드와, `body_md` 마크다운을 블로그 글처럼 렌더하는 상세
페이지로 되어 있다. 상세가 포스트 레이아웃(`post-layout` + 우측 목차 + `PostBody`)을
그대로 쓰기 때문에 글과 프로젝트가 화면상 구분되지 않는다.

앞으로 개인 프로젝트를 하나씩 포트폴리오로 올린다. 각 프로젝트의 아이디어 도출, 기술 선정,
시행착오는 그 프로젝트 레포의 Claude 세션이 자기 메모리·커밋 로그에서 뽑아 넘긴다.
이 문서는 (1) 그 세션이 무엇을 어떤 형식으로 채워야 하는지, (2) 넘어온 내용을 이 블로그가
어떻게 적재하고 어떤 화면으로 보여주는지를 정한다.

## 목표

- 상세 페이지를 열었을 때 "이게 뭐 하는 물건인가"가 글보다 먼저 보인다
- 프로젝트를 새로 올리는 데 드는 추가 작업이 거의 없다 — 규약대로 쓰면 화면이 완성된다
- 목록 카드는 로고·이름·한 줄로 최소화하고, 나머지는 전부 상세로 내린다
- 스크롤에 따른 연출이 붙되, 프로젝트마다 코드를 새로 쓰지 않는다

## 하지 않는 것

- 3D / 모션그래픽 라이브러리 도입 (번들 비용 대비 효과가 낮다)
- 프로젝트별 커스텀 컴포넌트 (특정 프로젝트를 밀고 싶어질 때 개별 판단)
- 어드민에 프로젝트 관리 화면 추가 (CLI 적재로 충분하다)
- 포스트(`/posts`) 쪽 레이아웃 변경

## 전체 흐름

1. 프로젝트 레포에서 `/portfolio` — 세션이 레포·메모리·커밋 로그를 근거로 `portfolio.md` 생성
2. 그 파일을 이 레포 `projects/<slug>.md` 로 가져온다
3. `npm run project -- push projects/<slug>.md` → Supabase `projects` upsert
4. 배포 URL 이 있으면 `npm run capture:project <slug>` → 스크린샷·스크롤 영상 캡처 후 DB 갱신

로고는 1단계에서 이모지+배경색으로 채우고, 스크린샷·영상은 4단계에서 이 레포가 찍는다.
다른 레포 세션은 텍스트만 책임진다.

## 1. 수집 규약 — `/portfolio` 스킬

원본은 이 레포 `skills/portfolio/SKILL.md` 에 두고 커밋한다. `~/.claude/skills/portfolio`
를 그쪽으로 심볼릭 링크해 유저 스코프로 노출한다 (`npm run setup:skills`). 어느 레포에서든
`/portfolio` 로 뜨면서, 규약 수정 이력은 이 레포에 남는다.

스킬은 self-contained 로 쓴다 — 블로그 레포 사정을 모르는 세션에서도 혼자 돌아가야 한다.

### 출력물

레포 루트에 `portfolio.md` 한 장. 프런트매터 + 본문 마크다운.

```yaml
---
slug: mcp-probe            # 필수, ASCII 케밥
name: MCP Probe            # 필수, 카드에 뜨는 이름
tagline: MCP 서버를 붙여보고 응답을 날것으로 보는 도구   # 필수, 40자 이내
year: "2026"               # 필수
logo_emoji: 🔌             # 필수
logo_bg: "#1F6FEB"         # 필수, 단색
stack: [Next.js, Cloudflare Workers, TypeScript]
url: mcp-probe.pages.dev   # 배포 없으면 빈 값
host: cloudflare           # vercel | cloudflare | local | none
status: 운영중              # 운영중 | 실험중 | 중단
capture: true              # 공개 URL 스크롤 캡처 허용 여부
---
```

### 본문 섹션

`##` 제목은 글자 그대로 지킨다. UI 가 이 제목으로 섹션을 갈라 렌더러를 고르기 때문이다.

| 섹션 | 내용 | 형식 제약 |
|---|---|---|
| `## 제품 소개` | 뭐 하는 물건인지, 처음 보는 사람 기준 | 2~3 문단, 기능 나열 금지 |
| `## 요구사항` | 만들 때 하고 싶었던 것들 | `- [x]` / `- [ ]` 체크리스트, 항목당 한 줄 |
| `## 기술 선정` | 후보 / 고른 것 / 이유 | 3열 마크다운 표 |
| `## 구조` | 데이터·요청 흐름 | mermaid 블록 1개 + `### 단계` 설명 문단들 |
| `## 시행착오` | 삽질 케이스 | `### 케이스 제목` 단위, 각각 **증상 / 시도 / 결론** 세 문단 |
| `## 남은 것` | 다음 작업, 알려진 한계 | 짧은 목록 |

### 스킬이 추가로 지시하는 것

- **문체 규칙** — `POSTING.md` 의 원칙 요약. 짧은 호흡, 다체 중심, 첫 문장은 사실 직진,
  번역투 금지. 다른 세션이 쓴 글이 그대로 올라오므로 이게 없으면 톤이 제각각으로 깨진다.
- **시행착오 선별 기준** — 해결까지 두 번 이상 방향을 튼 것만. 오타 수정·단순 버그는 제외.
  근거는 커밋 로그, 이슈, 세션 메모리에서 찾는다.
- **모르는 건 지어내지 않는다** — 채우지 못한 필드는 사용자에게 묻거나, 보고에 명시한다.

## 2. 데이터 모델

### 마이그레이션 `db/migrations/0013_project_portfolio.sql`

`projects` 에 추가:

| 컬럼 | 타입 | 용도 |
|---|---|---|
| `tagline` | text | 카드 한 줄 |
| `logo_emoji` | text | 카드 아이콘 |
| `logo_bg` | text | 로고 타일 배경색 |
| `logo_url` | text | 실제 로고 이미지. 있으면 이모지보다 우선 |
| `status` | text | 운영중 / 실험중 / 중단 |
| `hero_media` | text | 스크롤 영상 URL (mp4) |
| `hero_poster` | text | 영상 첫 프레임 · 대표 스크린샷 URL |
| `shots` | text[] | 추가 스크린샷 |

제거: `description`, `plan`, `build_note`, `thumb_kind`. `Project` 타입의 `k` 필드도 함께 뺀다.
카드에서 빠지고 본문 섹션이 대체한다. 남겨두면 같은 내용이 두 군데로 갈라져 산다.
`tagline` 백필은 기존 `description` 에서 가져오고, 그 다음 컬럼을 드롭한다.

`src/lib/types.ts` 의 `Project` 와 `queries.ts` 의 `rowToProject` 를 같이 고친다.

프런트매터의 `capture` 는 DB 컬럼이 아니다. `capture-project.mjs` 가 `projects/<slug>.md` 를
읽어 판단하는 값이라 `push` 는 이 키를 무시한다.

### 스토리지

`project-media` 버킷 신설. public, 상한 50MB, `video/mp4` · `image/webp` · `image/png` ·
`image/svg+xml` 허용. `scripts/setup-storage.mjs` 를 버킷 목록 순회 구조로 바꿔
`post-images` 와 함께 처리한다.

## 3. 목록 화면 `/lab`

`ProjectCard` 를 재작성한다. 로고 타일 / 이름 / 연한 한 줄, 그게 전부다.

```
┌─────────────────┐
│                 │   로고 타일 — logo_bg 단색 위에
│       🔌        │   이모지(또는 logo_url) 크게, 정사각
│                 │
├─────────────────┤
│ MCP Probe       │   이름
│ MCP 서버 붙여보고 │   tagline — 작고 연하게, 2줄에서 잘림
│ 응답을 날것으로   │
└─────────────────┘
```

제거: `Thumb` 다이어그램, 기획/구현 2줄, 스택 칩, 배포 URL, "자세히" 화살표,
페이지 하단 안내 문단. `.lab-grid` 는 카드가 작아지는 만큼 열 수를 늘린다.

`Thumb` 컴포넌트 자체는 포스트 쪽에서 계속 쓰므로 지우지 않는다.

## 4. 상세 화면 `/lab/[slug]`

포스트 레이아웃에서 완전히 떼어낸다. `post-layout` · 우측 목차 · `PostBody` 를 쓰지 않는다.

### 히어로

화면폭을 꽉 채우는 미디어. `hero_media` 가 있으면 자동재생·무음·루프 영상,
없으면 `hero_poster` 이미지, 둘 다 없으면 `logo_bg` 단색 위에 로고. 그 위에 제목,
tagline, `연도 · 스택 · 배포처 · status` 한 줄. 배포 URL 버튼은 우상단 고정.

### 좌측 섹션 레일

sticky. 점 + 라벨로 섹션 목록을 표시하고, 스크롤 위치에 따라 현재 섹션이 채워진다.
IntersectionObserver 를 쓰는 클라이언트 컴포넌트. 포스트의 우측 목차와 위치·형태를
일부러 다르게 둬서 인상을 가른다.

### 섹션별 렌더러

`body_md` 를 `##` 기준으로 쪼개고, 제목이 아는 이름이면 전용 렌더러로 보낸다.

| 섹션 | 렌더링 | 스크롤 연출 |
|---|---|---|
| 제품 소개 | 큰 본문 활자, 넉넉한 여백 | 진입 시 페이드업 |
| 요구사항 | `- [x]` 파싱 → 체크 카드 2열 그리드 | 카드 스태거 페이드인, 체크 표시가 그려지듯 |
| 기술 선정 | 마크다운 표 → 전용 비교표 | 행 단위 슬라이드인, "고른 것" 셀만 뒤늦게 색이 차오름 |
| 구조 | 다이어그램을 어두운 풀폭 패널에 크게 | 다이어그램 sticky 고정, 옆 `### 단계` 를 스크롤하면 해당 mermaid 노드 점등 |
| 시행착오 | `###` 케이스별 접이식 카드 | 카드가 겹쳐 쌓이듯 등장, 펼칠 때 증상→시도→결론 계단식 |
| 남은 것 | 담백한 목록 | 없음 |

모르는 `##` 제목은 기본 마크다운으로 떨어뜨린다. 규약을 어겨도 페이지는 깨지지 않는다.

### 연출 구현 방침

- CSS scroll-driven animation(`animation-timeline: view()`) + IntersectionObserver 로 처리.
  라이브러리를 늘리지 않는다. JS 스크롤 핸들러보다 부드럽고, 미지원 브라우저에서는
  애니메이션만 빠지고 내용은 그대로 보인다.
- `prefers-reduced-motion: reduce` 를 존중해 전 연출을 끈다.
- 모바일에서는 sticky 다이어그램 연출을 끄고 일반 세로 흐름으로 떨어뜨린다.

### 새 파일

```
src/lib/project-sections.ts                 body_md → 섹션 배열 파서
src/components/project/ProjectCard.tsx      (재작성)
src/components/project/ProjectHero.tsx
src/components/project/SectionRail.tsx      (client, scrollspy)
src/components/project/sections/Intro.tsx
src/components/project/sections/Requirements.tsx
src/components/project/sections/TechChoices.tsx
src/components/project/sections/Architecture.tsx   (client, sticky + 노드 점등)
src/components/project/sections/Trials.tsx         (client, 접이식)
src/components/project/sections/Remaining.tsx
src/components/page/ProjectDetailView.tsx   (재작성)
```

### 파서 계약 — `project-sections.ts`

```ts
type Section =
  | { kind: "intro";        title: string; md: string }
  | { kind: "requirements"; title: string; items: { done: boolean; text: string }[] }
  | { kind: "tech";         title: string; head: string[]; rows: string[][] }
  | { kind: "architecture"; title: string; diagram: string | null; steps: { label: string; md: string }[] }
  | { kind: "trials";       title: string; cases: { title: string; symptom: string; attempt: string; result: string }[] }
  | { kind: "remaining";    title: string; md: string }
  | { kind: "raw";          title: string; md: string };

function parseProjectBody(md: string): Section[];
```

파서는 절대 던지지 않는다. 형식이 어긋난 섹션은 `raw` 로 떨어뜨린다.

## 5. 스크립트

| 스크립트 | 하는 일 |
|---|---|
| `scripts/project.mjs` | `push` / `pull`. `draft.mjs` 와 같은 구조, 대상 테이블만 `projects` |
| `scripts/capture-project.mjs` | Playwright 로 배포 URL 을 열어 ① 전체 스크린샷 ② 위→아래 스크롤 8초 mp4 녹화 → `project-media` 업로드 → `hero_media` · `hero_poster` 갱신 |
| `scripts/setup-skills.mjs` | `~/.claude/skills/portfolio` 심볼릭 링크 생성 |
| `scripts/setup-storage.mjs` | `project-media` 버킷 추가 (기존 파일 수정) |

`playwright` 를 devDependency 로 추가한다. MCP 브라우저는 대화용이라 스크립트에서 못 쓴다.

`package.json` 스크립트: `project`, `capture:project`, `setup:skills`.

## 6. 검증

- `project-sections.ts` 에 `node:test` 단위 테스트를 붙인다. 이 설계에서 가장 부서지기 쉬운
  지점이 "규약을 어긴 마크다운이 들어왔을 때"라서, 섹션 누락·표 열 수 불일치·mermaid 없음·
  `###` 구조 파괴 같은 케이스가 모두 `raw` 로 안전하게 떨어지는지 본다.
- 나머지는 `npm run build` 통과 + 실제 화면 확인.
- 기존 4개 프로젝트(`news-briefing`, `hyunwoo-blog`, `mcp-probe`, `routines-notebook`)의
  `body_md` 를 새 템플릿으로 옮겨 첫 검증 대상으로 삼는다.

## 마이그레이션 순서

1. 마이그레이션 SQL 작성 → Supabase 에서 실행
2. 타입·쿼리 수정, 기존 화면이 깨지지 않는 선까지 맞춤
3. 파서 + 테스트
4. 목록 카드 재작성
5. 상세 화면 재작성 (히어로 → 레일 → 섹션 렌더러 순)
6. 스크롤 연출 적용
7. 스킬 · 스크립트 · 버킷
8. 기존 4개 프로젝트 콘텐츠 이전
