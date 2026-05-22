---
description: URL을 받아 POSTING.md 규약대로 글 초안을 작성하고 Supabase posts에 바로 적재 (워커 없이)
---

# /draft — URL → 글 초안 (직접 경로)

대상 URL / 메모: **$ARGUMENTS**

이 세션이 곧 작성자다. `ai_jobs` 큐·로컬 워커·`claude` CLI 를 거치지 않고,
아래 절차로 직접 초안을 써서 Supabase `posts` 에 `draft` 로 넣는다.

## 절차

1. **규약 숙지** — `POSTING.md` 를 읽는다. 특히 "2. 말투·본문 골격",
   "2-2. 시각자료 카탈로그", GitHub·발표영상 절. [[korean-writing-style]] 도 지킨다.
2. **원문 수집**
   - 일반 글/문서: `WebFetch`.
   - GitHub 저장소: `WebFetch` 로 저장소 페이지 + 필요하면 `raw.githubusercontent.com` README.
   - YouTube: `Bash` 로 `yt-dlp` 자막 추출. 2차 해설이 아니라 원작자 원본 기준.
3. **초안 작성** — POSTING.md 규약대로 한국어 글을 쓴다.
   - 본문은 `> 요약` → `## 헤드라인` 순서. 맨 위에 `# 제목` 다시 쓰지 않는다.
   - 정보 전달(원문 보존)·`-습니다`체·번역체 금지·두괄식. 대제목은 서술형 문어체.
   - 과정·순서·수치가 있으면 ```visual 블록 1개(많아야 2개), 개념 그림은
     ```illustration SVG 1개까지. 본문이 이미 말한 사실만 구조화한다.
   - 끝에 `## 참고 자료` + 원문 링크 + 저작권 표기 한 줄.
4. **파일 작성** — `drafts/<slug>.md` 를 만든다(`drafts/` 는 .gitignore 됨).
   맨 위 프런트매터 + 그 아래 본문:
   ```
   ---
   title: 한국어 독자용 제목
   tags: [태그A, 태그B]
   category: claude        # 선택 — tech/business/design/claude/infra/ai/insights 중
   source_url: <원문 URL>  # 기록용
   ---
   > 요약 인용구…
   ## 헤드라인…
   ```
5. **적재** — `npm run draft -- push drafts/<slug>.md` 실행.
6. 출력된 `/admin/editor?slug=…` 경로를 사용자에게 알린다. 검토 후 에디터에서 발행한다.

형식·옵션 상세: `docs/draft-in-claude-code.md`.
