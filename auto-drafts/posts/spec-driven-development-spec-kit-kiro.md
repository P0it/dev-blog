---
title: 스펙 주도 개발은 워터폴로 돌아가는 게 아니다
slug: spec-driven-development-spec-kit-kiro
tags: [스펙 주도 개발, Spec Kit, Kiro, SDD, Claude Code, AI 네이티브 개발 입문]
category: ai
published_at: 2026-08-26
series: ai-native-dev
series_order: 4
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/73118ebf.webp
---
> GitHub Spec Kit 은 GitHub Star 13만 7천 개를 넘었고 AWS 는 스펙을 작업 단위로 삼는 IDE Kiro 를 냈습니다. 두 도구의 구조와 Anthropic 의 스펙 작성 조언을 놓고 스펙 주도 개발이 워터폴 문서 작업과 무엇이 다른지 정리했습니다.

## "대충 말하면 대충 나온다"의 이유

에이전트에게 "결제 기능 추가해 줘"라고 하면 그럴듯한 코드가 나옵니다. 그런데 막상 보면 우리 서비스의 환불 규칙도 모르고 기존 결제 모듈과 다른 패턴으로 짜여 있습니다. 왜 이럴까요? 에이전트는 문장에 없는 요구사항을 채워 넣을 때 **가장 흔한 답**을 고르기 때문입니다. 우리 팀만의 규칙은 흔한 답이 아닙니다.

스펙 주도 개발은 이 빈칸을 코드가 나오기 전에 채우는 방식입니다. 무엇을 만들지(요구사항), 어떻게 만들지(설계), 어떤 순서로 만들지(작업 목록)를 문서로 먼저 고정하고 에이전트가 그 문서를 읽고 구현합니다. 2025년만 해도 "바이브 코딩"의 반대말 정도였는데 2026년 Thoughtworks Technology Radar 34권은 이를 에이전트에 채우는 **선행 통제** 수단으로 분류했습니다.

## GitHub Spec Kit 의 여섯 단계

가장 널리 쓰이는 도구가 GitHub 의 Spec Kit 입니다. 2026년 9월 기준 GitHub Star 137,100개, 기여자 302명, 최신 릴리스 1.0.7 입니다. MIT 라이선스의 Python CLI 라 이미 쓰는 에이전트 위에 얹는 형태입니다.

![GitHub Spec Kit 저장소 — Star 137.1k, Fork 12.3k](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/e38c82b9.webp)

설치하면 에이전트 안에서 슬래시 커맨드 여섯 개가 생깁니다.

| 단계 | 커맨드 | 만드는 것 |
|---|---|---|
| 원칙 | `/speckit-constitution` | 프로젝트 전체에 적용되는 원칙 |
| 명세 | `/speckit-specify` | 무엇을·왜 만드는지 |
| 계획 | `/speckit-plan` | 기술 스택·구조 |
| 작업 | `/speckit-tasks` | 실행 가능한 작업 목록 |
| 구현 | `/speckit-implement` | 작업 목록대로 코드 작성 |
| 수렴 | `/speckit-converge` | 완료 조건 대비 검증 |

여기서 눈여겨볼 건 순서입니다. 명세 단계에서는 기술을 정하지 않습니다. 무엇을 만드는지만 적고 어떤 언어·프레임워크로 만들지는 계획 단계로 미룹니다. 이 분리가 있어야 "React 로 만들어"라는 말이 요구사항을 덮어쓰는 일이 없습니다. 2026년 들어서는 버그 수정용 `/speckit-bug-*` 세 단계와 아이디어 평가용 `/speckit-assess-*` 다섯 단계 워크플로도 추가됐습니다.

## AWS Kiro 는 스펙을 파일 세 개로 고정한다

Spec Kit 이 기존 에이전트에 얹는 도구라면 Kiro 는 스펙을 중심으로 새로 만든 IDE 입니다. 2025년에 Amazon Q Developer 를 대체하며 나왔고 2026년에는 IDE·CLI·웹에서 같은 스펙을 씁니다.

![Kiro 문서의 Specs 페이지 — Feature Specs·Bugfix Specs·Quick Spec·병렬 작업 실행](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/73118ebf.webp)

Kiro 의 스펙은 파일 세 개로 고정됩니다. `requirements.md` 에 사용자 스토리와 인수 조건을, `design.md` 에 아키텍처·시퀀스 다이어그램·에러 처리를, `tasks.md` 에 추적 가능한 작업 목록을 씁니다. 작업은 의존 관계를 분석해 "웨이브"로 묶이고 독립적인 작업은 한 웨이브 안에서 병렬로 실행됩니다. 스펙 문서가 곧 실행 계획이 되는 구조입니다.

두 도구를 견주면 이렇습니다.

| | Spec Kit | Kiro |
|---|---|---|
| 형태 | CLI + 슬래시 커맨드 | IDE·CLI·웹 |
| 에이전트 | 30개 이상 기존 에이전트 위에 | Kiro 자체 |
| 스펙 단위 | 원칙·명세·계획·작업 문서 | requirements·design·tasks 세 파일 |
| 라이선스 | MIT | AWS 상용 |
| 강점 | 이식성·개방성 | 통합 환경·병렬 실행 |

## 스펙에 실제로 뭘 적어야 하나

도구를 골랐다 치면 스펙 안에는 뭘 써야 에이전트가 잘 움직일까요? Anthropic 의 Claude Code 문서가 짧게 답합니다. 쓸모 있는 스펙은 **자기 완결적**입니다. 관련 파일과 인터페이스 이름을 적고 범위 밖이 무엇인지 적은 뒤 마지막에 기능이 동작함을 증명하는 **끝단 검증 단계**로 끝납니다. 스펙을 정확히 만드는 시간이 구현을 지켜보는 시간보다 이득이 크다고 적어 뒀습니다.

문서는 스펙을 쓰는 방법도 하나 제안합니다. 처음부터 사람이 쓰지 말고 **에이전트가 사람을 인터뷰하게** 하는 겁니다. "이 기능을 만들고 싶다. 구현·UI·엣지 케이스·트레이드오프를 `AskUserQuestion` 으로 캐물어라. 다 물었으면 `SPEC.md` 에 써라." 그리고 스펙이 완성되면 **새 세션**에서 구현을 시작합니다. 인터뷰하느라 쌓인 대화가 구현 컨텍스트를 어지럽히지 않게 하려는 겁니다.

저도 이 방식을 써 보고 의외였던 점이 있습니다. 에이전트가 묻는 질문 중 절반은 제가 생각 안 해 본 것이었습니다. 로그아웃 상태에서 결제 링크를 누르면 어디로 보낼지 같은 것들입니다. 스펙은 에이전트를 위한 문서인 동시에 제 생각을 정리하는 문서였습니다.

## 마크다운 스펙에서 "풍부한 참조"로

2026년 7월 24일 Anthropic 이 낸 Claude 5 세대용 컨텍스트 엔지니어링 가이드에는 스펙에 관한 항목이 하나 더 있습니다. "단순한 스펙 → 풍부한 참조"입니다. 마크다운으로 화면을 설명하는 대신 **HTML 목업·기존 코드·평가 기준표** 자체를 스펙으로 넘기라는 겁니다. 모델이 그걸 읽을 만큼 좋아졌으니 사람이 산문으로 번역할 필요가 줄었습니다.

이 흐름을 보면 스펙 주도 개발이 워터폴 시절 요구사항 정의서로 되돌아가는 게 아니라는 걸 알 수 있습니다. 워터폴 문서는 사람이 읽고 해석했지만 지금의 스펙은 **에이전트가 직접 실행하는 입력**입니다. 그래서 형식보다 검증 가능성이 중요하고 목업이나 테스트 케이스가 산문보다 낫습니다.

## 정리 — 스펙은 에이전트의 첫 번째 컨텍스트

스펙 주도 개발을 한 줄로 줄이면 "코드를 시키기 전에 무엇을·왜·어디까지를 파일로 고정한다"입니다. Spec Kit 이 그 절차를 커맨드로, Kiro 가 파일 구조로 강제합니다. 그런데 스펙은 에이전트에게 주는 컨텍스트의 한 조각일 뿐입니다. 매 세션 자동으로 읽히는 `CLAUDE.md`, 필요할 때만 열리는 스킬, 대화 중 쌓이는 기록까지 합쳐서 어떻게 관리하는지는 다음 글에서 알아보겠습니다.

## 참고 자료

- [github/spec-kit — GitHub](https://github.com/github/spec-kit) — 저장소 화면 캡처 출처
- [Specs — Kiro Docs](https://kiro.dev/docs/specs/) — 문서 화면 캡처 출처
- [Best practices for Claude Code — Claude Code Docs](https://code.claude.com/docs/en/best-practices)
- [The new rules of context engineering for Claude 5 generation models — Anthropic (2026-07-24)](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)
- [Thoughtworks Technology Radar Vol.34 (2026-04-15)](https://www.thoughtworks.com/about-us/news/2026/combat-ai-cognitive-debt-radar-v34)
