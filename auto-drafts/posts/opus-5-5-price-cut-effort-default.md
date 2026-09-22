---
title: Opus 5.5 요금이 20%만 내렸는데 40% 싸다는 이유
slug: opus-5-5-price-cut-effort-default
tags: [Claude Opus 5.5, AI 에이전트, LLM 요금]
category: insights
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-22/0d65b69b.webp
---

> Anthropic 이 9월 22일 Claude Opus 5.5 를 공개하면서 Opus 5 보다 40% 싸게 돌아간다고 적었습니다. 단가표에서 실제로 내려간 폭이 얼마이고 나머지가 어떤 조건에서 측정된 값인지를 발표문과 공식 문서로 확인해 정리했습니다.

새 모델이 나오면 가격표부터 열어 보는 분들이 많을 겁니다. 9월 22일에 공개된 [Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5) 도 발표문 첫 문단에 숫자가 하나 붙어 있습니다. Opus 5 보다 **40% 싸게 돌아간다**는 것입니다.

그런데 같은 글의 가격 문단을 읽으면 입력 토큰이 100만 개에 $5 에서 $4 로, 출력 토큰이 $25 에서 $20 으로 내려갔다고 적혀 있습니다. 둘 다 20%입니다. 나머지 절반은 어디에 있을까요?

발표문은 그 문장에 조건을 같이 적어 뒀습니다. 40%는 **기본 설정에서** 잰 값입니다. 그리고 Opus 5.5 에서 바뀐 기본 설정 가운데 하나가 `effort` 기본값입니다. Opus 5 의 `high` 에서 `medium` 으로 한 칸 내려갔습니다.

저도 처음에는 단가가 40% 내려간 줄 알았습니다.

## 모든 줄이 20%, 캐시 읽기만 60%

[Claude 가격 문서](https://platform.claude.com/docs/en/about-claude/pricing)의 단가표에서 두 모델만 뽑아 비교해 보면 아래와 같습니다.

| | Claude Opus 5 | Claude Opus 5.5 |
|---|---|---|
| 입력 토큰 | $5 / MTok | $4 / MTok |
| 출력 토큰 | $25 / MTok | $20 / MTok |
| 5분 캐시 쓰기 | $6.25 / MTok | $5 / MTok |
| 1시간 캐시 쓰기 | $10 / MTok | $8 / MTok |
| 캐시 읽기 | $0.50 / MTok | $0.20 / MTok |
| Batch API 입력·출력 | $2.50 / $12.50 | $2 / $10 |

입력과 출력, 캐시 쓰기, Batch 까지 전부 정확히 20% 내려갔습니다. 다른 폭으로 움직인 줄은 캐시 읽기 하나입니다.

이유는 배수에 있습니다. 캐시 읽기 값은 보통 기본 입력가의 0.1배인데 Opus 5.5 는 0.05배를 씁니다. 단가가 20% 내려간 위에 배수가 절반이 되니 $0.50 에서 $0.20 으로, 60% 떨어집니다. 발표문도 캐시 읽기가 에이전트와 코딩 작업 비용의 대부분을 차지한다고 적었습니다.

## 캐시가 80%인 요청의 실제 절감폭

그러면 캐시 읽기 비중이 높은 요청은 40%에 닿을까요? 입력 5만 토큰 가운데 4만 개가 캐시 읽기이고 출력이 1만 5천 토큰인 요청 하나를 잡습니다. 에이전트 루프에서 흔한 모양입니다. Opus 5 로 계산하면 새 입력 1만 개가 $0.05, 캐시 읽기 4만 개가 $0.02, 출력 1만 5천 개가 $0.375 이라서 합계 $0.445 입니다. Opus 5.5 로 같은 요청을 계산하면 각각 $0.04, $0.008, $0.30 이 되어 합계 $0.348 입니다.

**22% 정도** 내려갑니다. 캐시 읽기를 80%까지 채워도 단가표만으로는 40%가 나오지 않습니다. 값의 대부분을 차지하는 출력 토큰이 20%만 내려갔기 때문입니다.

## 발표문이 밝힌 측정 조건

발표문은 40%를 말한 문장에 조건을 붙여 뒀습니다.

> Our tests show that at default settings it will cost 40% less than Opus 5 on typical workloads.

기본 설정에서 쟀다는 것입니다. 같은 절의 다른 문장은 내역까지 적었습니다. Opus 5.5 는 토큰당 값도 싸고 작업당 토큰도 적게 써서 두 가지가 합쳐져 40%가 된다는 설명입니다.

앞의 계산이 보여 준 대로 토큰당 값은 20%까지입니다. 나머지는 작업당 토큰 수에서 나옵니다. 그리고 작업당 토큰 수는 단가표처럼 고정된 값이 아니라 내가 보내는 요청의 설정에 따라 달라집니다.

## 한 칸 내려간 effort 기본값

`effort` 는 Claude 가 한 응답에 토큰을 얼마나 쓸지 정하는 파라미터이고 `low` 부터 `max` 까지 다섯 단계가 있습니다. [effort 문서](https://platform.claude.com/docs/en/build-with-claude/effort)는 Opus 5.5 만 기본값이 `medium` 이고 나머지 모델은 `high` 라고 적어 뒀습니다. Opus 5 도 `high` 였습니다.

그래서 `effort` 를 적지 않은 요청은 Opus 5 에서 돌던 단계보다 한 칸 아래에서 돕니다.

effort 가 걸리는 범위는 생각보다 넓습니다. thinking 분량만이 아니라 응답 텍스트, 도구 호출의 개수와 인자까지 전부 포함합니다. 단계를 낮추면 모델이 도구를 덜 부르고 설명도 짧아집니다. 40%라는 숫자 안에 이 효과가 들어 있습니다.

## 같은 단계로 맞추면 늘어나는 토큰

Opus 5 와 똑같이 두려고 `effort: "high"` 를 명시하면 두 가지가 한꺼번에 일어납니다.

먼저 기본 설정에서 벗어나므로 40%를 측정한 조건 밖으로 나갑니다. 그리고 [Opus 5.5 변경 문서](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5)가 동작 차이로 적어 둔 항목 하나가 반대 방향으로 작용합니다. 같은 effort 단계에서 Opus 5.5 는 Opus 5 보다 턴마다 더 많이 생각하고 `xhigh` 와 `max` 에서 그 차이가 가장 큽니다.

Opus 5 의 설정을 그대로 옮겨 붙이면 토큰을 더 쓰게 된다는 뜻입니다. 문서가 마이그레이션 항목에 설정을 물려받지 말고 자기 eval 에서 effort 를 다시 측정하라고 적어 둔 이유입니다. `max_tokens` 도 함께 봐야 합니다. thinking 과 응답 텍스트를 합친 총량의 상한이라 높은 단계에서는 여유를 둬야 합니다.

## 끌 수 없게 된 thinking

비용을 줄이려고 thinking 을 꺼 두던 코드가 있다면 그 줄은 이제 동작하지 않습니다. Opus 5 는 `high` 이하 effort 에서 `thinking: {"type": "disabled"}` 를 받아 줬습니다. Opus 5.5 는 어느 단계에서도 400 을 돌려줍니다. 수동 예산을 주는 `{"type": "enabled", "budget_tokens": N}` 도 같습니다.

에러 메시지는 문서에 그대로 적혀 있습니다.

```text
"thinking.type.disabled" is not supported for this model. Use "thinking.type.adaptive" and "output_config.effort" to control thinking behavior.
```

메시지가 대안까지 알려 줍니다. thinking 을 끄던 코드는 effort 를 낮추는 쪽으로 바꾸라는 것입니다.

## 모델 이름만 바꿔서 끝나지 않는 네 가지

공식 문서는 Opus 5 에서 돌던 코드에 영향을 주는 breaking change 를 네 가지로 정리해 뒀습니다.

- `thinking` 을 끄거나 수동 예산을 주는 요청은 400 입니다
- `tool_choice` 를 `any` 나 `tool` 로 지정하는 강제 도구 호출도 400 입니다. `auto` 에 strict tool use 나 structured outputs 를 붙이는 쪽으로 바꿔야 합니다. token counting 엔드포인트에도 같은 검증이 걸립니다
- computer use 를 `computer_20251124` 로 선언하면 Claude API 와 Google Cloud 에서 400 입니다. `computer_toolset_20260801` 로 바꿉니다. Amazon Bedrock 에서는 예전 방식이 그대로 동작합니다
- thinking 블록이 그 블록을 만든 모델과 대화에 묶입니다. 다른 모델로 넘어간 대화에서는 API 가 읽지 못하는 블록을 빼고 처리하므로 요청 자체는 성공합니다. 다만 그 뒤 턴은 앞 모델의 추론 없이 돕니다. 중간에 `system` 이나 `tools` 를 고친 뒤 블록을 다시 보내면 2026년 8월 31일 이후에 만든 계정에서는 400 이 돌아옵니다

요청이 실패하지 않는 변화도 하나 있습니다. 도구 호출 사이에 모델이 쓰던 짧은 설명이 이제 thinking 블록으로 돌아옵니다. Opus 5 에서는 `text` 블록이었습니다. 기본 `display` 설정이 `"omitted"` 라 그 필드는 비어 있습니다. 그래서 진행 상황을 화면에 보여 주던 애플리케이션은 도구 호출 사이에 아무것도 표시하지 못하게 됩니다. 에러는 나지 않습니다.

## 40% 쪽인지 20% 쪽인지 확인하는 법

먼저 코드에 `effort` 를 명시해 뒀는지 봅니다. 적어 두지 않았다면 지금까지 `high` 로 돌던 요청이 오늘부터 `medium` 으로 내려갑니다. 값이 싸지는 대신 응답이 달라지므로 품질을 먼저 확인하고 단계를 정하는 것이 순서입니다. 명시해 뒀다면 40%는 내 숫자가 아닙니다.

다음으로 응답의 `usage` 에서 `cache_read_input_tokens` 와 `input_tokens` 비율을 봅니다. 캐시 읽기 비중이 낮은 워크로드라면 60% 인하가 차지하는 몫이 작아서 단가표대로 20%에 가깝습니다.

마지막으로 같은 eval 을 두 모델로 한 번씩 돌려 작업당 토큰 수를 비교합니다. 40%의 나머지 절반이 거기서 나오기 때문에 이 값을 재기 전까지는 내 파이프라인의 절감폭을 알 수 없습니다.

## 단가표보다 크게 움직인 건 effort 한 줄

발표문의 40%는 Anthropic 이 자기 테스트에서 기본 설정으로 잰 값이고 조건까지 같이 적혀 있습니다. 다만 그 조건 안에는 사용자가 직접 건드릴 수 있는 파라미터가 들어 있습니다. 단가표는 한 번 바뀌면 모두에게 똑같이 적용되지만 `effort` 기본값은 그렇지 않습니다. 값을 명시해 둔 쪽과 비워 둔 쪽이 오늘부터 다른 단계에서 돌고 청구서 금액도 달라집니다.

## 참고 자료

- [Introducing Claude Opus 5.5 — Anthropic](https://www.anthropic.com/claude-opus-5-5)
- [What's new in Claude Opus 5.5 — Claude Docs](https://platform.claude.com/docs/en/models/opus-5-5/whats-new-opus-5-5)
- [Migrating to Claude Opus 5.5 — Claude Docs](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide)
- [Effort — Claude Docs](https://platform.claude.com/docs/en/build-with-claude/effort)
- [Pricing — Claude Docs](https://platform.claude.com/docs/en/about-claude/pricing)
