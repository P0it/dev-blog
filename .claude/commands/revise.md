---
description: 기존 글을 피드백대로 개선해 Supabase posts에 바로 반영 (워커 없이)
---

# /revise — 기존 글 개선 (직접 경로)

인자: **$ARGUMENTS**  · 형식: `<slug> <피드백 내용…>`

`ai_jobs` 큐·로컬 워커·`claude` CLI 없이, 이 세션이 직접 글을 고쳐 반영한다.

## 절차

1. 첫 토큰을 **slug**, 나머지를 **피드백**으로 본다. slug 가 모호하면 사용자에게 되묻는다.
2. **내려받기** — `npm run draft -- pull <slug>` → `drafts/<slug>.md` 생성.
   출력에 `--force` 가 필요하다고 나오면(=발행된 글) 5단계에서 그대로 붙인다.
3. **규약 숙지** — `POSTING.md` 를 읽고 [[korean-writing-style]] 를 지킨다.
4. **개선** — `drafts/<slug>.md` 의 본문을 피드백대로 고친다. POSTING.md 규약(말투·
   골격·시각자료·**2-3 자동화 티 방지**)은 유지·적용한다.
   피드백이 시각자료 추가를 명시하지 않으면 빈 채로 두는 쪽을 우선한다.
   프런트매터의 slug 는 그대로 둔다.
5. **반영** — `npm run draft -- push drafts/<slug>.md` 실행
   (발행된 글이면 `npm run draft -- push drafts/<slug>.md --force`).
6. 출력 경로를 사용자에게 알린다. 발행된 글을 고친 경우 공개 페이지 캐시는 즉시
   갱신되지 않는다 — 어드민 에디터에서 한 번 저장하거나 재배포해야 반영된다.

상세: `docs/draft-in-claude-code.md`.
