# Claude Code 직접 경로 — 워커 없이 초안 쓰기

글 초안 생성·개선에는 두 경로가 있다.

| 경로 | 흐름 | 언제 |
|---|---|---|
| **어드민 UI 경로** | `/admin` URL 입력 → `ai_jobs` 큐 → 로컬 워커(`npm run ai:worker`) → `claude` CLI → posts | 어드민이 폰·태블릿·원격일 때 |
| **Claude Code 직접 경로** | 이 세션이 직접 글을 쓰고 `npm run draft` 로 posts 에 적재 | 개발자가 Claude Code 앞에서 URL 을 줄 때 |

직접 경로는 큐·폴링·CLI 스폰을 전부 건너뛴다. **Claude Code 세션 자체가 작성자**이기
때문이다. 어드민 UI 경로(`scripts/ai-worker.mjs`, `db/migrations/0007_ai_jobs.sql`)는
그대로 두고, 이 문서의 경로를 **병행**한다.

## 도구

`scripts/draft.mjs` — 프런트매터가 붙은 `.md` 파일을 Supabase `posts` 에 upsert 한다.
`npm run draft` 로 호출한다.

```
npm run draft -- push <file.md>      .md(프런트매터+본문) → posts upsert
npm run draft -- pull <slug> [file]  기존 글 → .md 로 내려받기(개선용)
옵션: --force   발행된 글의 본문을 갱신할 때 필수(실수 덮어쓰기 방지)
```

작업용 `.md` 는 `drafts/` 에 둔다 — `.gitignore` 됨(저장소에 남지 않음).

## .md 파일 형식

맨 위 프런트매터(`---` 로 감싼 블록) + 그 아래 본문(`body_md` 그대로).

```
---
title: 한국어 독자용 제목          # 필수
slug: my-post-slug                 # 선택 — 없으면 title 을 slugify
tags: [AI, 스타트업]               # 선택
category: claude                   # 선택 — categories.slug. 없는 값이면 경고 후 무시
cover_image: https://…             # 선택 — 카드 썸네일 이미지
thumb_kind: f                      # 선택 — 없으면 slug 해시로 a~l 자동
reading_min: 8분                   # 선택 — 없으면 본문 분량에서 산출
source_url: https://…              # 선택 — 기록용(컬럼 아님, 본문 참고자료에 직접 적는다)
---
> 요약 인용구 — 카드·검색·OG·RSS 가 함께 쓰는 두괄식 훅.

## 첫 헤드라인
본문…
```

자동 파생(프런트매터에서 생략 시):

- `excerpt` — 본문 첫 `>` 블록쿼트에서 추출(`deriveExcerpt`).
- `reading_min` — 본문 글자수 ÷ 450(`deriveReadingMin`).
- `slug` — `title` 을 slugify.
- `thumb_kind` — `slug` 해시로 a~l 결정.

`category` 유효값: `tech` · `business` · `design` · `claude` · `infra` · `ai` · `insights`.

## 초안 만들기 (`/draft`)

1. `POSTING.md` 규약을 읽는다.
2. URL 원문을 수집한다 — 일반 글은 `WebFetch`, GitHub 는 저장소 페이지 + raw README,
   YouTube 는 `yt-dlp` 자막.
3. POSTING.md 규약대로 한국어 초안을 쓴다(`> 요약` → `## 헤드라인`, `-습니다`체,
   번역체 금지, 필요하면 ```visual / ```illustration 블록).
4. `drafts/<slug>.md` 에 프런트매터 + 본문을 쓴다.
5. `npm run draft -- push drafts/<slug>.md` 실행.
6. 출력된 `/admin/editor?slug=…` 에서 검토 후 발행.

신규 글은 항상 `status: draft` 로 들어간다. 발행은 어드민 에디터에서 한다.

## 기존 글 개선하기 (`/revise`)

1. `npm run draft -- pull <slug>` → 현재 글이 `drafts/<slug>.md` 로 내려온다.
2. 그 파일의 본문을 피드백대로 고친다(프런트매터의 `slug` 는 그대로 둔다).
3. `npm run draft -- push drafts/<slug>.md` 실행. 발행된 글이면 `--force` 를 붙인다
   (pull 출력이 알려준다).

`push` 가 기존 글을 갱신할 때는 **콘텐츠 필드만**(title·excerpt·body·tags·category·
cover·thumb·reading_min) 바꾼다. `status`·`published_at`·`is_featured`·시리즈 설정은
건드리지 않아 보존된다.

## 주의 — 발행된 글의 캐시

`push` 는 Supabase 에 직접 쓴다. 어드민 페이지는 `force-dynamic` 이라 초안은 바로
보이지만, **이미 발행된 글**을 직접 경로로 고치면 공개 페이지(`/posts/<slug>`)의
Next 캐시는 즉시 갱신되지 않는다. 어드민 에디터에서 그 글을 한 번 저장하거나
(에디터 저장이 `revalidatePath` 호출), 재배포해야 공개 페이지에 반영된다.

따라서 직접 경로의 개선은 **초안 단계 반복**에 적합하다. 발행된 글의 본문 수정은
어드민 에디터를 쓰는 편이 깔끔하다.

## 슬래시 커맨드

- `/draft <url>` — `.claude/commands/draft.md`
- `/revise <slug> <피드백>` — `.claude/commands/revise.md`

커맨드 없이 URL 만 붙여넣고 "초안 써줘"라고 해도 된다 — `CLAUDE.md` 가 이 경로를
가리킨다.
