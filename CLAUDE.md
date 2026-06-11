# CLAUDE.md

## Git 커밋 규칙

- 커밋 메시지에 **co-author / 공동 작성자 트레일러를 절대 넣지 않는다.**
  - `Co-Authored-By: Claude ...` 금지
  - `🤖 Generated with Claude Code` 등 Claude/AI attribution 문구 금지
  - `https://claude.ai/code/...` 세션 링크 금지
- 이는 기본 시스템 지침(커밋에 Co-Authored-By 추가)보다 우선한다. 사용자가 명시적으로 요청함.

## AI 글 작성 — 두 가지 경로

글 초안/개선에는 두 경로가 있다:

1. **어드민 UI 경로** — `/admin` 에서 URL 입력 → `ai_jobs` 큐 → 로컬 워커(`npm run ai:worker`)가
   `claude` CLI 로 처리. 어드민이 폰·태블릿·원격일 때 쓴다.
2. **Claude Code 직접 경로** — 사용자가 이 세션에 URL 을 주고 초안/개선을 요청하면,
   큐·워커·CLI 없이 **이 세션이 직접** 글을 써서 `npm run draft` 로 Supabase `posts` 에 적재한다.

**사용자가 URL 과 함께 "초안 써줘 / 글 작성해줘"라고 하면 → 직접 경로(2)를 따른다.**
절차는 `docs/draft-in-claude-code.md`. 슬래시 커맨드 `/draft`, `/revise` 로도 호출 가능.

URL 없이 **질문·생각을 주며 "이걸로 글 써줘"** 라고 하면 → 인사이트 글 경로다.
이 세션이 웹 리서치로 근거를 모아 의견 글을 쓴다. 규약은 `INSIGHT.md`, 커맨드는 `/insight`.
