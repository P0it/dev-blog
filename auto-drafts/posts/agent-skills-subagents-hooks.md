---
title: SKILL.md 하나로 30개 도구가 같은 일을 하는 이유
slug: agent-skills-subagents-hooks
tags: [Agent Skills, SKILL.md, 서브에이전트, 훅, Claude Code, AI 네이티브 개발 입문]
category: ai
published_at: 2026-09-04
series: ai-native-dev
series_order: 7
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/1c69c463.webp
---
> Anthropic 이 2025년 12월에 공개 표준으로 푼 `SKILL.md` 형식을 Codex·Cursor·Gemini CLI·VS Code·Kiro 등 30개가 넘는 도구가 그대로 받아들였습니다. 스킬이 왜 그렇게 퍼졌는지, 서브에이전트·훅과 어떻게 역할을 나누는지, 어떤 규칙을 어디에 둘지 표로 정리했습니다.

## "이거 지난주에도 설명했는데"

에이전트에게 우리 팀 배포 절차를 설명하고 며칠 뒤 새 세션에서 또 설명하는 일이 반복됩니다. CLAUDE.md 에 넣자니 매 세션 읽혀서 컨텍스트가 무거워집니다. 이 지식은 배포할 때만 필요한데 말입니다. 어떻게 해야 할까요?

답이 **스킬**입니다. 절차 지식을 폴더 하나에 담아 두고 에이전트가 그 일을 할 때만 열게 하는 방식입니다. 예를 들어볼까요? `.claude/skills/deploy/SKILL.md` 에 배포 순서를 적어 두면 "배포해 줘"라는 말에 에이전트가 그 파일을 찾아 읽고 따릅니다. 다른 작업을 할 때는 이름과 한 줄 설명만 컨텍스트에 있습니다.

## 스킬의 구조와 점진적 공개

형식은 단순합니다. 폴더 안에 `SKILL.md` 하나가 필수이고 나머지는 선택입니다.

![agentskills.io — 스킬은 SKILL.md(메타데이터+지시)에 scripts·references·assets 를 선택적으로 묶은 폴더](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/1c69c463.webp)

`SKILL.md` 맨 위 프런트매터에 `name` 과 `description` 을 적고 아래에 지시를 씁니다. `scripts/` 에 실행 코드, `references/` 에 참고 문서, `assets/` 에 템플릿을 둘 수 있습니다. 표준이 정한 로딩 방식은 세 단계입니다.

1. **발견** — 시작할 때 모든 스킬의 이름·설명만 읽는다.
2. **활성화** — 과제가 설명과 맞으면 `SKILL.md` 본문을 컨텍스트에 넣는다.
3. **실행** — 지시를 따르며 필요하면 스크립트를 돌리거나 참고 파일을 연다.

이게 Anthropic 이 말하는 "점진적 공개"의 실체입니다. 스킬을 수십 개 두어도 컨텍스트 부담은 설명 줄 수만큼입니다. 그래서 `description` 을 잘 쓰는 게 중요합니다. 에이전트가 이 한 줄로 "지금 이 스킬을 열까"를 판단하기 때문입니다.

## 왜 한 형식을 30개 도구가 받아들였나

Anthropic 이 만든 형식을 경쟁사가 왜 그대로 쓸까요? 형식이 마크다운 폴더라 **잃을 게 없기 때문**입니다. 자기 도구에 맞춰 바꿀 이유가 없고 사용자가 이미 만든 스킬을 그대로 가져오면 그만입니다. agentskills.io 의 클라이언트 목록에는 Claude Code·ChatGPT·Codex·Cursor·Gemini CLI·GitHub Copilot·VS Code·Kiro·goose·JetBrains Junie·OpenHands·Databricks·Snowflake 가 올라 있습니다.

Vercel 이 운영하는 skills.sh 를 보면 생태계 크기를 알 수 있습니다.

![skills.sh — 오픈 에이전트 스킬 생태계 리더보드, find-skills 설치 340만 건](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/48cb02bc.webp)

`npx skills update` 한 줄로 설치하고 Claude·OpenAI·Cursor 등 여러 에이전트에 같은 스킬이 들어갑니다. 설치 1위 `find-skills` 가 340만 건, Anthropic 의 `frontend-design` 이 89만 건입니다. npm 패키지처럼 스킬을 나눠 쓰는 시장이 생긴 겁니다.

## 컨텍스트를 격리하는 서브에이전트

스킬이 "무엇을 아는가"를 다룬다면 **서브에이전트**는 "누가 하는가"를 나눕니다. 자기만의 컨텍스트 창과 허용 도구를 가진 별도 에이전트입니다. Claude Code 에서는 `.claude/agents/security-reviewer.md` 처럼 파일 하나로 정의합니다. 프런트매터에 이름·설명·도구 목록·모델을 적고 아래에 역할을 씁니다.

언제 쓸까요? 두 경우가 분명합니다. 첫째, **파일을 수십 개 읽어야 하는 조사**입니다. 메인 세션에서 하면 그 파일 내용이 전부 내 컨텍스트에 남습니다. 서브에이전트에게 맡기면 요약만 돌아옵니다. 둘째, **결과를 반대 입장에서 검토하는 리뷰**입니다. 방금 코드를 쓴 세션은 자기 코드에 관대합니다. 새 컨텍스트에서 diff 와 기준만 보는 서브에이전트는 그 편향이 없습니다. Claude Code 문서는 이걸 Writer/Reviewer 패턴이라고 부르고 문서 자체에 주의도 답니다. 빈틈을 찾으라고 시킨 리뷰어는 멀쩡한 코드에서도 뭔가를 찾아내니 "정확성과 요구사항에 영향 주는 것만 보고하라"고 범위를 좁히라는 겁니다.

## 조언을 강제로 바꾸는 훅

CLAUDE.md 와 스킬은 결국 **조언**입니다. 모델이 읽고 따르지만 확률적으로 따릅니다. "마이그레이션 폴더는 절대 건드리지 마"처럼 예외 없이 지켜야 하는 규칙은 어디에 둘까요? **훅**입니다. 에이전트 워크플로의 정해진 시점(도구 실행 전후, 턴 종료 등)에서 스크립트를 자동으로 돌리는 장치라 결정적입니다.

검증을 얼마나 강하게 걸지가 여기서 정해집니다. Stop 훅에 테스트 스크립트를 걸면 통과 전에는 턴이 안 끝납니다(연속 8회 차단 후에는 에이전트가 종료합니다). 파일 편집 후 린터 실행, 특정 경로 쓰기 차단, 커밋 전 타입 체크가 흔한 용도입니다. Anthropic 의 AI 네이티브 SDLC 그림에서 "훅이 핵심 단계에 사람 승인 게이트를 제공한다"고 한 게 이겁니다.

## 어디에 둘지 정하는 기준

세 장치에 CLAUDE.md 까지 넷이 되면 무엇을 어디에 둘지 헷갈립니다. 저도 처음엔 전부 CLAUDE.md 에 넣었다가 Claude Code 문서의 "넣을 것·뺄 것" 표를 보고 나눴습니다. 기준을 표로 정리하면 이렇습니다.

| | CLAUDE.md | 스킬 | 서브에이전트 | 훅 |
|---|---|---|---|---|
| 성격 | 항상 켜진 조언 | 필요할 때 여는 지식 | 격리된 실행자 | 예외 없는 강제 |
| 로딩 | 매 세션 전체 | 설명만, 본문은 활성화 시 | 별도 컨텍스트 | 컨텍스트 안 씀 |
| 둘 것 | 빌드 명령·저장소 규칙 | 배포 절차·API 규약·도메인 지식 | 대량 조사·독립 리뷰 | 린트·테스트·경로 차단 |
| 어기면 | 묻힐 수 있음 | 안 열리면 모름 | 요약만 돌아옴 | 실행 자체가 막힘 |

한 줄로 줄이면 이렇습니다. **반드시 강제할 규칙은 훅, 상황별 지식은 스킬, 격리가 필요한 일은 서브에이전트, 늘 필요한 짧은 지침만 CLAUDE.md.** Claude Code 는 이 넷에 MCP 서버까지 묶어 플러그인으로 설치하게 합니다.

## 하네스를 조립하는 부품

모델을 감싸 도구·컨텍스트·실행 환경을 붙인 껍데기를 하네스라고 부릅니다. 스킬·서브에이전트·훅은 그 하네스를 우리 팀에 맞게 조립하는 부품입니다. 부품이 갖춰지면 에이전트가 만드는 코드는 빨라집니다. 그러면 병목이 다른 곳으로 옮겨 갑니다. 사람이 그 코드를 읽고 승인하는 리뷰입니다. 다음 글에서는 그 병목의 수치와 대책에 대해서 알아보겠습니다.

## 참고 자료

- [Agent Skills Overview — agentskills.io](https://agentskills.io/) — 문서 화면 캡처 출처
- [skills.sh — The open agent skills ecosystem (Vercel)](https://skills.sh/) — 리더보드 화면 캡처 출처
- [Best practices for Claude Code — Claude Code Docs](https://code.claude.com/docs/en/best-practices)
- [How Anthropic secures its AI-native software development lifecycle — Anthropic (2026-07-21)](https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle)
