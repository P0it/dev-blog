---
title: Sonnet 5.5 업그레이드는 모델 ID 한 줄이 아니다
slug: sonnet-5-5-migration-breaking-changes
tags: [Claude API, 모델 마이그레이션, AI 에이전트]
category: insights
cover_image: REHOST:https://www-cdn.anthropic.com/images/4zrzovbb/website/b521482c2a09be87ac40f01e8949c216c426eeaa-1600x1000.png
---

> 9월 28일에 공개된 Claude Sonnet 5.5 는 Sonnet 5 와 가격도 컨텍스트 크기도 같습니다. 대신 공식 문서가 모델 소개보다 먼저 기존 코드를 깨뜨리는 변경 다섯 가지를 적어 뒀습니다. 어떤 요청이 400 으로 돌아오고 어떤 변경이 에러 없이 지나가는지 마이그레이션 문서를 따라 정리했습니다.

새 모델이 나오면 보통 설정 파일에 적힌 모델 ID 부터 바꿔 봅니다. 값 하나만 고치면 되니 작업이라 부르기도 민망합니다. Sonnet 5.5 도 그 한 줄로 끝날까요? 그렇지 않습니다. Anthropic 문서는 모델 소개보다 먼저 "Sonnet 5 에서 이미 돌아가던 코드에 영향을 주는 변경 다섯 가지"를 나열해 뒀습니다. 예를 들어 도구를 반드시 부르게 하려고 쓰던 `tool_choice: {"type": "tool", "name": "..."}` 는 Sonnet 5.5 에서 400 을 돌려받습니다. 무엇이 400 으로 막히고 무엇이 에러 없이 통과하는지 알면 모델을 올리기 전에 고칠 곳을 먼저 찾을 수 있습니다.

## 9월 28일에 공개된 Sonnet 5.5 의 사양

컨텍스트는 1M 토큰, 최대 출력은 128K 토큰이고 입력 `$2` · 출력 `$10` per MTok 입니다. 캐시 읽기는 `$0.20` per MTok, 지식 컷오프는 2026년 6월입니다. [모델 페이지](https://platform.claude.com/docs/en/models/sonnet-5-5/overview)가 적어 둔 대로 **가격은 Sonnet 5 와 같습니다**. 캐시가 걸리는 최소 프롬프트 길이만 1,024 토큰에서 512 토큰으로 내려왔습니다.

성능 쪽은 [발표문](https://www.anthropic.com/claude-sonnet-5-5)이 숫자를 밝혔습니다. 출력이 30% 이상 빠르고 대부분의 작업에서 비용이 최대 30% 적게 든다고 합니다. Terminal-Bench 4.0 에서 70.6%, CursorBench 4.0 에서 55.5%, GDPval-AA v2.1 에서 1,844 점입니다. 마지막 점수는 Opus 5.5 의 1,846 점과 거의 같습니다.

발표 페이지는 같은 프로그램을 이전 모델과 최신 모델에 각각 작성하게 하고 실행 화면을 나란히 붙여 뒀습니다.

![Anthropic 발표 페이지의 비교 화면 — 이전 모델이 clock-of-clocks 프로그램을 작성해 실행한 결과](REHOST:https://www-cdn.anthropic.com/images/4zrzovbb/website/21053b0cbc6e93a7388f173ed8fb3bd4bb2ed85b-1600x1000.png)

![Anthropic 발표 페이지의 비교 화면 — 최신 모델이 같은 clock-of-clocks 프로그램을 작성해 실행한 결과](REHOST:https://www-cdn.anthropic.com/images/4zrzovbb/website/b521482c2a09be87ac40f01e8949c216c426eeaa-1600x1000.png)

## 400 을 돌려주는 다섯 가지

그럼 기존 코드는 어디서 걸릴까요? [What's new 문서](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5)가 첫 화면에 다섯 항목을 적어 뒀습니다. 다섯 가지 모두 요청을 400 `invalid_request_error` 로 되돌립니다. 막히는 요청과 대체 방법을 비교해 보면 아래와 같습니다.

| | 400 이 나는 요청 | 대신 보낼 것 |
|---|---|---|
| 상위 추론 끄기 | `thinking: {"type": "disabled"}` | `{"type": "between_tools"}`, effort 는 `high` 이하 |
| 도구 호출 강제 | `tool_choice` 의 `any` · `tool` | `auto` + 도구 정의에 `strict: true` |
| 편집된 대화 | 앞 기록을 고친 뒤 thinking 블록을 다시 보냄 | 대화를 append-only 로 유지 |
| 컴퓨터 사용 | `computer_20251124`(Claude API · Google Cloud) | `computer_toolset_20260801` |
| advisor 짝 | Opus 4.8 · Opus 4.7 · Sonnet 5 를 advisor 로 | Opus 5 · 5.5, Fable 5 · 5.1, Mythos 5 · 5.1, Sonnet 5.5 |

셋째 줄에는 조건이 하나 붙습니다. 대화 앞부분의 `system` · `tools` · 이전 메시지가 바뀌었는지 검사하는 동작은 **2026년 8월 31일 00:00 UTC 이후에 만들어진 계정**에서 기본으로 켜져 있습니다. 그전에 만든 계정에서는 같은 요청이 통과합니다. 계정을 언제 만들었느냐에 따라 같은 코드가 다르게 동작한다는 뜻이기도 합니다.

## 도구 호출을 강제하던 tool_choice

다섯 가지 가운데 가장 넓게 걸리는 것은 두 번째입니다. 구조화된 JSON 을 받으려고 특정 도구를 반드시 부르게 만드는 방식은 추출·분류 파이프라인에서 흔합니다. Sonnet 5.5 는 `any` 와 `tool` 을 모두 거절하고 이런 메시지를 돌려줍니다.

```text
tool_choice: type "tool" and "any" are not supported for this model.
```

같은 검사가 [token counting 엔드포인트](https://platform.claude.com/docs/en/build-with-claude/token-counting)에도 적용됩니다. 요청을 보내기 전에 토큰 수만 세어 보는 코드까지 함께 막힌다는 뜻입니다.

대체 방법은 `tool_choice: {"type": "auto"}` 를 그대로 두고 도구 정의에 `strict: true` 를 다는 것입니다. [Strict tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use) 는 문법 제약 샘플링으로 도구 입력이 JSON Schema 를 그대로 따르게 만듭니다. `passengers: "two"` 나 `passengers: "2"` 대신 `passengers: 2` 가 옵니다. 다만 모든 object 에 `additionalProperties: false` 가 필요하고 지원하는 JSON Schema 범위도 제한됩니다.

여기서 성격이 한 가지 달라집니다. `strict` 가 맞춰 주는 것은 도구를 부를 때의 입력입니다. 도구를 **반드시 부르게** 만드는 기능은 여기에 없습니다. 모델은 여전히 도구를 건너뛰고 텍스트로 답할 수 있습니다. 문서가 "언제 그 도구를 쓰는지 프롬프트에 적으라"고 덧붙인 이유가 이것입니다. 보장을 파라미터에서 받던 것을 이제 프롬프트에서 받아야 합니다.

Amazon Bedrock 은 사정이 또 다릅니다. Sonnet 5.5 에서는 structured outputs 계열이 제공되지 않아 `strict` 도 못 씁니다. 거기서는 `auto` 만 보내고 도구 입력을 직접 검증하라고 문서가 적어 뒀습니다.

## 에러가 나지 않는 여섯 번째 변경

앞의 다섯 가지는 400 이 나므로 배포 전에 걸립니다. 그런데 문서는 요청을 실패시키지 않는 변경 하나를 따로 떼어 적어 뒀습니다. 이쪽이 더 늦게 발견됩니다.

Sonnet 5.5 는 도구 호출 사이에 쓰는 설명이 한두 문장을 넘으면 그것을 `text` 블록 대신 progress update `thinking` 블록으로 돌려줍니다. 그리고 `display` 의 기본값 `"omitted"` 에서는 그 블록의 `thinking` 필드가 비어 있습니다. 도구를 실행하는 동안 "이제 파일을 읽습니다" 같은 문장을 사용자에게 보여 주던 화면이라면 그 칸이 비어 버립니다. 요청은 200 으로 성공하고 에러 로그에도 아무것도 남지 않습니다.

받아 보려면 adaptive thinking 에서 `display` 를 `"updates"`(베타 헤더 `thinking-display-updates-2026-08-18`)나 `"summarized"` 로 지정하면 됩니다. 상위 추론을 끄는 `between_tools` 를 쓰면 `display` 없이도 텍스트가 그대로 옵니다.

## 다시 재야 하는 effort 값

마지막으로 코드 변경이 아예 필요 없는 항목이 하나 있습니다. effort 레벨이 재보정됐습니다. 같은 `high` 가 Sonnet 5 에서와 같은 양의 추론을 만들어 내지 않습니다. 문서는 설정을 그대로 옮기지 말고 effort 를 다시 훑어 보라고 적었습니다.

권장값도 작업 종류별로 나뉘어 있습니다. 기본은 `high` 입니다. 에이전트 코딩이나 여러 단계 도구 사용은 명세가 분명한 작업이면 `medium` 에서 시작해 어려운 작업에서 `high` 로 올립니다. 채팅처럼 응답이 빨라야 하는 쪽은 `medium` 이나 `low` 입니다. 비용을 기준선부터 다시 잡으라는 문장이 마이그레이션 체크리스트 맨 끝에 붙어 있습니다.

## 모델을 올리기 전에 확인할 것

이번 릴리스를 정리하면 모델 교체의 비용이 어디에 있는지가 비교적 또렷하게 보입니다. 값싸지고 빨라지는 것은 모델 쪽 일입니다. 그 모델을 받는 코드가 어떤 가정 위에 서 있었는지는 그대로 남습니다. `tool_choice` 로 보장받던 것, `disabled` 로 꺼 두던 것, 대화 기록을 자유롭게 고쳐도 된다고 여기던 것이 전부 그런 가정입니다.

혼자 만든 파이프라인이라면 400 다섯 개는 오히려 다행인 쪽입니다. 한 번 돌려 보면 바로 드러나기 때문입니다. 확인이 어려운 것은 여섯 번째입니다. 화면 한 칸이 비는 변화는 테스트가 전부 통과해도 그대로 남습니다. 사용자가 말해 주기 전까지는 모르는 채로 지나갑니다. 모델 ID 를 바꾼 커밋 옆에 화면을 직접 열어 보는 절차 하나를 같이 두는 편이 안전합니다.

Anthropic 은 고용량·저비용 용도의 Claude Haiku 5.5 를 몇 주 안에 내겠다고 발표문에 적었습니다. 같은 확인 절차를 그때 한 번 더 돌리게 될 것 같습니다.

## 참고 자료

- [Claude Sonnet 5.5 — Claude Docs](https://platform.claude.com/docs/en/models/sonnet-5-5/overview)
- [What's new in Claude Sonnet 5.5 — Claude Docs](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5)
- [Migrating to Claude Sonnet 5.5 — Claude Docs](https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide)
- [Strict tool use — Claude Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use)
- [Claude API release notes — Claude Docs](https://platform.claude.com/docs/en/release-notes/api)
- 본문 이미지 출처: [Introducing Claude Sonnet 5.5 — Anthropic](https://www.anthropic.com/claude-sonnet-5-5)
