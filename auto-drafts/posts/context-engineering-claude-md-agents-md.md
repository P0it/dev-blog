---
title: 컨텍스트 엔지니어링이 프롬프트 엔지니어링과 다른 점
slug: context-engineering-claude-md-agents-md
tags: [컨텍스트 엔지니어링, CLAUDE.md, AGENTS.md, 컨텍스트 창, Claude Code, AI 네이티브 개발 입문]
category: ai
published_at: 2026-08-29
series: ai-native-dev
series_order: 5
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/45e741a1.webp
---
> Anthropic 은 2026년 7월 Claude Code 시스템 프롬프트의 80% 이상을 삭제하고도 성능 손실이 없었다고 밝혔습니다. 그 근거가 된 컨텍스트 엔지니어링의 여섯 가지 새 규칙과 CLAUDE.md 에 넣을 것·뺄 것, AGENTS.md 효과를 두고 엇갈린 두 논문을 정리했습니다.

## 긴 세션에서 에이전트가 멍청해지는 이유

에이전트와 한참 일하다 보면 초반에 분명히 말한 규칙을 어기기 시작합니다. 컨텍스트 창이 남아 있는데도 그렇습니다. 왜 그럴까요? Anthropic 의 설명은 이렇습니다. Transformer 는 토큰 n 개에 대해 n² 쌍의 관계를 계산하는데 토큰이 늘수록 주의가 얇게 퍼집니다. 게다가 학습 데이터에 짧은 문장이 훨씬 많아서 긴 범위의 의존 관계를 다루는 경험 자체가 적습니다. 이 현상을 **컨텍스트 부패**라고 부릅니다.

그래서 Claude Code 문서는 모범 사례 대부분이 한 가지 제약에서 나온다고 적습니다. **컨텍스트 창은 빨리 차고 차면 성능이 떨어진다.** 디버깅 한 번, 코드베이스 탐색 한 번에 수만 토큰이 들어갑니다. 컨텍스트가 가장 중요한 자원이라는 겁니다.

## 프롬프트가 아니라 컨텍스트

그럼 무엇을 관리해야 할까요? Anthropic 이 그린 그림이 범위를 잘 보여 줍니다.

![Anthropic — 프롬프트 엔지니어링은 지시문을 쓰는 일, 컨텍스트 엔지니어링은 시스템 프롬프트·도구·문서·메시지 기록 전체를 고르는 일](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/98c5ce36.webp)

왼쪽이 프롬프트 엔지니어링입니다. 사람이 쓰는 지시문을 다듬습니다. 오른쪽이 컨텍스트 엔지니어링입니다. 시스템 프롬프트, 도구 정의, 외부 문서, 메시지 기록 가운데 **이번 추론에 무엇을 넣을지** 고릅니다. 사용자 프롬프트는 그중 한 조각입니다.

Claude 5 세대용 가이드는 컨텍스트 창을 여섯 층으로 그립니다.

![Anthropic — 컨텍스트 창의 구성: 사용자 프롬프트·참조 파일·시스템 프롬프트·CLAUDE.md·스킬·메모리](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/45e741a1.webp)

프롬프트, `@` 로 붙인 참조 파일, 시스템 프롬프트, CLAUDE.md, 스킬, 메모리. 이 여섯 개가 매 턴 합쳐져 모델에 들어갑니다. 컨텍스트 엔지니어링은 이 여섯 층 각각을 언제·얼마나 채울지 정하는 일입니다.

## CLAUDE.md 에 넣을 것과 뺄 것

여섯 층 중 개발자가 가장 자주 손대는 게 CLAUDE.md 입니다. 매 세션 자동으로 읽히는 프로젝트 지침 파일이라 여기에 뭐든 적어 두고 싶어집니다. 그런데 Claude Code 문서는 반대로 말합니다. **부풀어 오른 CLAUDE.md 는 정작 필요한 지시를 무시하게 만든다.** 규칙을 적어 뒀는데 계속 어기면 파일이 너무 길어서 그 규칙이 묻힌 겁니다.

문서가 제시하는 기준은 한 줄마다 "이 줄을 지우면 Claude 가 실수하는가"를 묻는 겁니다. 아니면 지웁니다.

| 넣는다 | 뺀다 |
|---|---|
| Claude 가 추측 못 하는 빌드·테스트 명령 | 코드를 읽으면 알 수 있는 것 |
| 기본값과 다른 코드 스타일 규칙 | 언어의 표준 관례 |
| 브랜치·PR 규칙 같은 저장소 예절 | 상세 API 문서(링크로 대체) |
| 이 프로젝트만의 설계 결정 | 자주 바뀌는 정보 |
| 필수 환경 변수 같은 환경의 특이점 | 파일별 코드베이스 설명 |
| 겉으로 안 보이는 함정 | "깨끗한 코드를 써라" 같은 당연한 말 |

가끔만 필요한 도메인 지식은 스킬로 옮깁니다. 스킬은 필요할 때만 열려서 매 대화를 무겁게 하지 않습니다. 반드시 지켜야 하는 규칙은 아예 훅으로 옮겨서 기계적으로 강제합니다. CLAUDE.md 는 조언이고 훅은 강제입니다.

## 2026년 7월, Anthropic 이 바꾼 규칙 여섯 가지

모델이 좋아지면 컨텍스트를 주는 방식도 바뀝니다. Anthropic 은 2026년 7월 24일 Claude 5 세대 모델(Opus 5·Fable 5)에 맞춰 규칙을 갈아 끼웠습니다.

![Anthropic — Claude 5 세대용 컨텍스트 엔지니어링의 여섯 가지 전환](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/a4fda81a.webp)

- **규칙 → 판단.** "주석은 이렇게 달아라" 대신 "주변 코드의 주석 밀도·이름·관용구에 맞춰라".
- **예시 → 인터페이스.** 사용 예시를 잔뜩 주면 탐색을 제한하니 도구의 파라미터를 잘 설계한다.
- **전부 앞에 → 점진적 공개.** 상세 지침은 스킬과 지연 로딩 도구로 미룬다.
- **반복 → 짧은 도구 설명.** 시스템 프롬프트에 되풀이하지 말고 도구 설명에 한 번만.
- **CLAUDE.md 메모리 → 자동 메모리.** 모델이 알아서 저장한다.
- **단순 스펙 → 풍부한 참조.** 산문 대신 HTML·코드·평가표.

이 전환의 근거가 앞에서 말한 수치입니다. Claude Code 시스템 프롬프트를 **80% 넘게 삭제**했는데 코딩 평가에서 측정 가능한 손실이 없었습니다. 모델이 판단할 수 있는 걸 규칙으로 못 박아 두면 토큰만 쓰고 유연성은 잃는다는 겁니다.

## AGENTS.md 는 정말 도움이 되나 — 엇갈리는 두 논문

여기서 한 번 의심해 볼 만합니다. 저장소에 CLAUDE.md 나 AGENTS.md 를 두면 정말 결과가 나아질까요? 2026년에 나온 두 논문의 답이 엇갈립니다.

ETH Zürich 의 Gloaguen 등이 2026년 2월 12일에 낸 "Evaluating AGENTS.md" 는 SWE-bench 과제와 개발자가 직접 커밋한 컨텍스트 파일이 있는 저장소를 함께 실험했습니다. 결과는 **과제 성공률이 전반적으로 오르지 않았고 추론 비용은 평균 20% 넘게 늘었다**입니다. 특히 다들 권하는 "저장소 개요" 항목이 도움이 안 됐습니다. 다만 파일 안의 지시는 잘 따랐습니다. 저자들은 컨텍스트 파일은 **표준과 다른 관행을 명시할 때** 쓸모가 있다고 정리했습니다.

반대로 Lulla 등이 2026년 1월 28일에 낸 논문은 저장소 10개·PR 124건에서 AGENTS.md 유무를 비교해 **실행 시간 중앙값 28.64% 감소, 출력 토큰 16.58% 감소**를 보고했습니다. 완료율은 비슷했습니다. 성공률은 안 올라도 효율은 오른다는 겁니다.

두 결과를 겹쳐 보면 Claude Code 문서의 표와 같은 결론이 나옵니다. 코드를 읽으면 알 수 있는 개요는 빼고 추측 못 하는 명령과 우리만의 규칙만 남기라는 겁니다. 저도 이 블로그의 CLAUDE.md 를 다시 열어 보니 절반이 코드에서 알 수 있는 내용이었습니다.

## 세션 중에 컨텍스트를 다루는 법

파일을 잘 써 뒀어도 세션이 길어지면 대화 기록이 컨텍스트를 채웁니다. Claude Code 문서가 권하는 습관은 단순합니다.

- 관련 없는 작업으로 넘어갈 때 `/clear` 로 비운다.
- 같은 문제를 두 번 넘게 고쳐 달라고 했으면 `/clear` 하고 배운 것을 담아 더 나은 프롬프트로 새로 시작한다.
- `/context` 로 무엇이 공간을 차지하는지 본다.
- 조사는 서브에이전트에게 맡겨 결과 요약만 받는다. 파일 수십 개를 읽는 과정이 내 컨텍스트에 안 남는다.
- 잠깐 확인할 질문은 `/btw` 로 던진다. 답이 대화 기록에 남지 않는다.

한계에 가까워지면 Claude Code 가 자동으로 오래된 도구 출력을 지우고 대화를 요약합니다. 이때 초반 지시가 사라질 수 있으니 오래 지켜야 할 규칙은 대화가 아니라 CLAUDE.md 에 둡니다. MCP 도구 정의도 기본 설정이 지연 로딩이라 도구 이름만 컨텍스트에 있고 실제 정의는 쓸 때 들어옵니다. 다음 글에서는 이 MCP 에 대해서 알아보겠습니다.

## 참고 자료

- [Effective context engineering for AI agents — Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — 프롬프트 vs 컨텍스트 도식 출처
- [The new rules of context engineering for Claude 5 generation models — Anthropic (2026-07-24)](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models) — 여섯 가지 전환·컨텍스트 창 도식 출처
- [Best practices for Claude Code — Claude Code Docs](https://code.claude.com/docs/en/best-practices)
- [Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents? — arXiv 2602.11988](https://arxiv.org/abs/2602.11988)
- [On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents — arXiv 2601.20404](https://arxiv.org/abs/2601.20404)
