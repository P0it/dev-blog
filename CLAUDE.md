# CLAUDE.md

## Git 커밋 규칙

- 커밋 메시지에 **co-author / 공동 작성자 트레일러를 절대 넣지 않는다.**
  - `Co-Authored-By: Claude ...` 금지
  - `🤖 Generated with Claude Code` 등 Claude/AI attribution 문구 금지
  - `https://claude.ai/code/...` 세션 링크 금지
- 이는 기본 시스템 지침(커밋에 Co-Authored-By 추가)보다 우선한다. 사용자가 명시적으로 요청함.

## 커밋/푸시 시점

- **기능 단위 개발이 끝나면 그 자리에서 커밋하고 푸시한다.** 사용자가 따로 요청하지
  않아도 된다. "끝났다"의 기준은 빌드·타입체크·테스트 등 확인 가능한 검증이 통과한
  상태다. 검증 없이 커밋하지 않는다.
- 기능 단위 = 하나의 동작이 실제로 돌아가는 최소 묶음. 여러 기능을 한 커밋에 몰아넣지
  말고, 반대로 동작하지 않는 중간 상태를 커밋하지도 않는다.
- 혼자 개발하는 저장소라 **PR 을 만들지 않고 `main` 에 직접 커밋·푸시**한다.
- 리팩터링·문서 수정도 같은 규칙을 따른다. 한 덩어리가 끝나면 바로 커밋한다.
- 커밋 후에는 무엇을 커밋했는지 한 줄로 알린다.

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

## 실험실 프로젝트 적재

`/lab` 의 프로젝트는 다른 레포에서 만든 원고를 받아 적재한다.

1. 그 프로젝트 레포에서 `/portfolio` 실행 → 루트에 `portfolio.md` 생성
2. 이 레포로 가져와 **`/project` 커맨드**에 넘긴다. 규약 대조·손질·적재·캡처까지 한다

`/project` 없이 손으로 할 때는:

1. 이 레포 `projects/<slug>.md` 로 옮긴다
2. `npm run project -- push projects/<slug>.md`
3. 공개 URL 이 있으면 `npm run capture:project <slug>`

`/portfolio` 스킬 원본은 이 레포 `skills/portfolio/SKILL.md` 다.
`npm run setup:skills` 가 `~/.claude/skills/portfolio` 로 링크를 건다.
규약을 고칠 때는 반드시 이 레포의 원본을 고친다.

상세 화면 규약은 `docs/superpowers/specs/2026-08-22-lab-portfolio-design.md`.
`##` 제목이 곧 렌더러 선택이라, 제목을 바꾸면 그 섹션은 일반 마크다운으로 떨어진다.
