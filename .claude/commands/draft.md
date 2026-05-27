---
description: URL을 받아 POSTING.md 규약대로 글 초안을 작성하고 Supabase posts에 바로 적재 (워커 없이)
---

# /draft — URL → 글 초안 (직접 경로)

대상 URL / 메모: **$ARGUMENTS**

이 세션이 곧 작성자다. `ai_jobs` 큐·로컬 워커·`claude` CLI 를 거치지 않고,
아래 절차로 직접 초안을 써서 Supabase `posts` 에 `draft` 로 넣는다.

## 절차

1. **규약 숙지** — `POSTING.md` 를 읽는다. 특히 "2. 말투·본문 골격",
   "2-2. 시각자료 카탈로그", **"2-3. 자동화 티 방지"**, GitHub·발표영상 절. [[korean-writing-style]] 도 지킨다.
2. **직전 초안 점검** — `drafts/` 의 최근 파일 1~2개를 훑는다.
   직전 글의 길이·헤드라인 개수·도입 첫 문장 형태·`<mark>` 위치·시각자료 개수와 패턴 조합·저작권 줄 유무를 확인하고,
   이번 글에서는 그중 최소 2~3가지를 의도적으로 다르게 잡는다 (POSTING.md 2-3절 참조).
3. **원문 수집**
   - 일반 글/문서: `WebFetch`.
   - GitHub 저장소: `WebFetch` 로 저장소 페이지 + 필요하면 `raw.githubusercontent.com` README.
   - YouTube: `Bash` 로 `yt-dlp` 자막 추출. 2차 해설이 아니라 원작자 원본 기준.
4. **초안 작성** — POSTING.md 규약대로 한국어 글을 쓴다.
   - 본문은 `> 요약` → `## 헤드라인` 순서. 맨 위에 `# 제목` 다시 쓰지 않는다.
   - 정보 전달(원문 보존)·`-습니다`체·번역체 금지·두괄식. 대제목은 서술형 문어체.
   - 시각자료는 **기본 0개**. 본문 평문으로 구조·비율·흐름이 잡히지 않는 부분이 분명할 때만 ```visual 블록을 얹는다(0~3개).
     개념 그림은 ```illustration SVG 1개까지. 매번 같은 패턴 조합(`stat-card` + `compare-card` 등)·같은 위치 반복은 금한다.
     본문이 이미 말한 사실만 구조화한다.
   - 끝에 `## 참고 자료` + 원문 링크. 저작권 표기 한 줄은 **기본은 생략**(POSTING.md 2절 참조).
5. **파일 작성** — `drafts/<slug>.md` 를 만든다(`drafts/` 는 .gitignore 됨).
   - **슬러그는 ASCII 영문만** — `a-z 0-9 -`. 한글·공백·기호 금지.
     (Vercel/Next 의 정적 prerender 가 비ASCII 슬러그에서 404 로 고정되는 이슈가 있어, 초안 단계부터 막는다.)
   - 다른 글 스타일(`gstack-garry-tan-claude-code`, `simon-sinek-start-with-why-golden-circle`,
     `project-glasswing-mythos`)을 따라 **인물명 + 핵심 키워드** 3~6단어로 짧게.
   - `npm run draft -- push` 가 비ASCII 슬러그를 거부한다 — frontmatter 의 `slug:` 를 반드시 명시.
   - 맨 위 프런트매터 + 그 아래 본문:
   ```
   ---
   title: 한국어 독자용 제목
   slug: ascii-only-slug      # 필수 — 영문 ASCII (위 규칙)
   tags: [태그A, 태그B]
   category: claude           # 선택 — tech/business/design/claude/infra/ai/insights 중
   source_url: <원문 URL>     # 기록용
   ---
   > 요약 인용구…
   ## 헤드라인…
   ```
6. **적재** — `npm run draft -- push drafts/<slug>.md` 실행.
7. 출력된 `/admin/editor?slug=…` 경로를 사용자에게 알린다. 검토 후 에디터에서 발행한다.

형식·옵션 상세: `docs/draft-in-claude-code.md`.
