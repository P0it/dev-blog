---
title: Claude 가 거절한 요청도 과금될까요?
slug: claude-refusal-billing-fallback-credit
tags: [Claude API, LLM 요금, AI 에이전트]
category: insights
---

> 9월 24일 Claude API 릴리스 노트가 거절 응답 일부에 다시 요금을 매기기 시작했다고 적었습니다. 공식 문서와 쿡북을 확인해 어떤 거절이 과금되고 그 응답이 왜 장애 지표에 한 건도 나타나지 않는지 정리했습니다.

에이전트를 돌리다 보면 HTTP 200 으로 돌아왔는데 `content` 가 빈 배열인 응답을 만납니다. 열어 보면 `stop_reason` 에 `"refusal"` 이라고 적혀 있습니다. 모델이 그 요청을 거절한 것입니다.

그러면 출력이 한 글자도 없는 이 응답에도 요금이 붙을까요? 9월 24일부터는 붙는 경우가 생겼습니다. [Claude API 릴리스 노트](https://platform.claude.com/docs/en/release-notes/api)가 그날 항목에 거절 과금을 재개한다고 적었습니다. 대상은 `stop_details.category` 가 `bio`, `frontier_llm`, `reasoning_extraction` 인 세 가지입니다. 이 세 가지는 출력이 나오기 전에 도착한 거절이라도 그 요청을 처리한 모델의 단가로 청구됩니다.

공식 문서에 실린 거절 응답 예시로 보면 이렇습니다. 입력 토큰 412개를 쓴 요청이 `bio` 로 거절당하면 `content` 는 비어 있고 `output_tokens` 는 0 인데 입력 412개분의 요금은 나갑니다. 같은 요청이 `cyber` 로 거절당하면 한 푼도 나가지 않습니다.

저도 처음에는 거절이면 요금이 안 붙는 줄 알았습니다. 이 구분을 알고 나면 요금 내역에 설명되지 않던 금액과 대시보드의 에러율이 왜 어긋나 있었는지 확인할 수 있습니다.

## 릴리스 노트가 되돌린 문장

9월 24일 항목의 표현은 "resuming billing" 입니다. 한동안 받지 않던 요금을 다시 받기 시작했다는 뜻입니다. 출력 도중에 도착한 거절은 그 전부터 이미 과금되고 있었습니다.

이유도 같은 문서에 적혀 있습니다. 안전장치를 대규모로 우회하려는 시도를 막기 위해서입니다. 거절이 공짜면 분류기가 어디서 걸리는지 알아내려고 요청을 수천 번 보내 보는 일에 비용이 들지 않거든요.

적용 범위는 전 플랫폼입니다. Claude API, Amazon Bedrock, Claude Platform on AWS, Google Cloud, Microsoft Foundry 에서 같은 규칙이 돕니다.

## stop_reason 이 refusal 인 응답

거절은 에러가 아닙니다. 상태 코드 200 에 정상 응답 형식으로 돌아옵니다.

```json
{
  "type": "message",
  "role": "assistant",
  "model": "claude-fable-5",
  "content": [],
  "stop_reason": "refusal",
  "stop_details": {
    "type": "refusal",
    "category": "cyber",
    "explanation": "This request was declined because it could enable cyber harm."
  },
  "usage": { "input_tokens": 412, "output_tokens": 0 }
}
```

분류기가 붙어 있는 모델은 Claude Fable 5.1 과 Fable 5, Claude Opus 5.5 와 Opus 5 입니다. `explanation` 의 문구는 안정적이지 않다고 문서가 미리 적어 뒀습니다. 파싱하지 말고 화면에 그대로 표시하라는 뜻입니다. `category` 와 `explanation` 이 둘 다 `null` 로 오는 경우도 있는데 이것도 정상값입니다.

과금 여부와 상관없이 이 요청은 rate limit 을 소모합니다.

## 과금되는 카테고리와 그렇지 않은 카테고리

다섯 가지 카테고리 가운데 세 가지만 과금 대상입니다. 비교해 보면 아래와 같습니다.

| | 걸리는 요청 | 출력 전 거절 과금 |
|---|---|---|
| `cyber` | 멀웨어·익스플로잇 같은 사이버 위해 | 안 함 |
| `bio` | 위험한 실험 방법 같은 생물학적 위해 | 함 |
| `frontier_llm` | 경쟁 모델 개발을 돕는 요청 | 함 |
| `reasoning_extraction` | 내부 추론을 본문에 그대로 옮기라는 요구 | 함 |
| `general_harms` | 위 네 가지 바깥의 사용 정책 영역 | 안 함 |

기준은 문서가 밝혀 뒀습니다. 2026년 9월 기준으로 **오탐이 적게 측정된 카테고리**가 과금 대상입니다. 그러니 이 표는 고정된 목록이 아닙니다. 오탐률을 다시 재면 과금 카테고리도 바뀔 수 있다고 같은 문단에 적혀 있습니다.

표에 딸린 설명도 같이 읽을 만합니다. `cyber` 에는 정상적인 보안 업무가, `bio` 에는 정상적인 생명과학 업무가, `frontier_llm` 에는 일반적인 머신러닝 작업이 걸릴 수 있다고 적혀 있습니다. 뒤의 두 가지가 과금 대상입니다.

## 에러율로 만든 감시에는 이 응답이 보이지 않습니다

여기서 앞의 사실 하나가 문제가 됩니다. 거절은 HTTP 200 입니다.

5xx 비율이나 예외 발생 건수로 알림을 걸어 둔 감시는 거절을 한 건도 보지 못합니다. 요청은 성공으로 집계되고 응답은 비어 있고 요금은 나갑니다. 문서도 이 점을 함정 목록에 올려 두고 거절을 별도 신호로 계측하라고 권고합니다.

권고하는 방식은 두 가지 수를 따로 세는 것입니다. 거절이 올 때마다 이벤트 하나, 폴백이 응답을 만들어 냈을 때마다 이벤트 하나를 남깁니다. 후자는 `usage.iterations` 안의 `fallback_message` 항목으로 알 수 있습니다. 두 수의 차이가 벌어지면 거절당하고 그대로 끝난 요청이 쌓이고 있다는 뜻입니다.

분기 조건도 문서가 지정해 뒀습니다. `content` 가 비었는지나 `stop_details` 안쪽 필드로 판단하지 말고 `stop_reason` 이 `"refusal"` 인지로 분기합니다. 안쪽 필드는 `null` 일 수 있기 때문입니다.

## 한 사용자 요청이 거절을 여러 번 만듭니다

재시도 예산을 턴 단위나 세션 단위로 잡아 두면 모자랍니다. 문서가 요청 단위로 잡으라고 적으면서 든 예가 에이전트와 그 서브에이전트입니다. 사용자가 보낸 한 턴이 모델 호출을 여러 번 만들고 그 각각이 거절당할 수 있습니다.

같은 목록에 더 까다로운 항목이 하나 더 있습니다. `fallbacks` 파라미터는 **도구 실행 안에서 이뤄지는 모델 호출로 전파되지 않습니다.** 서브에이전트를 도구로 구현했다면 그 호출에 폴백을 따로 걸어야 합니다.

문서는 폴백을 요청의 속성으로 두라고도 적었습니다. 공유 플래그나 캐시된 설정값, 전역 토글로 관리하면 값이 어긋난 채로 요청이 나가도 아무 표시가 나지 않습니다. 재시도 핸들러와 에러 복구 분기, 백그라운드 워커까지 전부 폴백을 걸어야 하는 경로입니다.

## 폴백을 걸면 청구가 시도별로 나뉩니다

폴백을 켜면 거절당한 요청을 다른 모델로 다시 보냅니다. 서버 쪽 폴백은 이 재시도를 API 호출 한 번 안에서 처리하므로 사용자는 응답을 한 번만 받습니다. 그런데 청구는 한 번이 아닙니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>한 번의 API 호출 안에서 거절 시도와 응답 시도가 따로 청구되는 구조</title>
  <rect x="60" y="70" width="150" height="64" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <path d="M218 102 H242 M234 94 L242 102 L234 110"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="250" y="70" width="200" height="64" rx="14"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <path d="M458 102 H492 M484 94 L492 102 L484 110"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="500" y="70" width="200" height="64" rx="14"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="135" y="108" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16px">요청 1건</text>
  <text x="350" y="108" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16px">Fable 5 거절</text>
  <text x="600" y="108" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16px">Opus 4.8 응답</text>
  <path d="M350 142 V202 M600 142 V202"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-dasharray="6 7"
    stroke-linecap="round" />
  <rect x="250" y="210" width="200" height="60" rx="12"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" />
  <rect x="500" y="210" width="200" height="60" rx="12"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" />
  <text x="60" y="196" style="fill: var(--fg-neutral); font-size: 15px">usage.iterations</text>
  <text x="350" y="246" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16px">거절 시도</text>
  <text x="600" y="246" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16px">응답 시도</text>
  <path d="M600 278 V332"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-dasharray="6 7"
    stroke-linecap="round" />
  <rect x="500" y="340" width="200" height="60" rx="12"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" />
  <text x="60" y="326" style="fill: var(--fg-neutral); font-size: 15px">최상위 usage</text>
  <text x="600" y="376" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16px">응답 시도만</text>
</svg>
```

시도마다 그 시도를 처리한 모델의 단가가 적용됩니다. 출력 없이 거절한 시도는 과금 카테고리일 때만 청구되고 출력을 만든 시도는 전부 따로 청구됩니다. 시도별 내역은 `usage.iterations` 배열에 남고 최상위 `usage` 에는 반환된 응답을 만든 시도의 숫자만 들어갑니다. 서로 다른 모델의 토큰이 한 필드로 합산되는 일은 없습니다. 거절한 시도도 그 모델의 rate limit 을 소모합니다.

한 번 폴백이 일어난 대화는 그 뒤로 폴백 모델로 바로 갑니다. 약 1시간 동안 유지되고 조직 범위로 적용됩니다. 대화 접두사의 해시와 응답한 모델을 저장하는 방식이라 메시지 내용 자체는 저장되지 않습니다. 다만 best-effort 라서 원래 모델이 다시 시도되는 경우를 코드가 처리하고 있어야 합니다.

## 캐시를 두 번 쓰지 않게 해 주는 폴백 크레딧

프롬프트 캐시는 모델별로 따로 있습니다. Fable 5 에 캐시해 둔 대화 접두사를 Opus 4.8 로 재시도하면 그 접두사를 새 모델의 캐시에 처음부터 다시 써야 합니다. 캐시 쓰기는 읽기보다 비쌉니다. [공식 쿡북](https://platform.claude.com/cookbook/fable-5-fallback-billing-guide)의 설명으로는 캐시 읽기가 기본 입력 단가의 10%인 반면 캐시 쓰기는 기본 단가보다 1.25배 또는 2배 높습니다.

폴백 크레딧이 이 차액을 없앱니다. 거절 응답이 `stop_details` 에 `fallback_credit_token` 을 함께 담아 주고 재시도에 그 토큰을 실어 보내면 처음부터 새 모델에서 돌던 대화인 것처럼 청구됩니다. 서버 쪽 폴백과 SDK 미들웨어는 이 처리를 알아서 합니다. 직접 재시도를 구현한 경우에만 토큰을 챙기면 됩니다.

챙길 때 조건이 붙습니다.

- 토큰은 **거절 5분 뒤에 만료**됩니다. 서버가 상태를 저장하지 않으므로 조회하거나 취소하는 엔드포인트도 없습니다.
- 거절을 받은 조직과 워크스페이스에서만 사용할 수 있습니다.
- 요청 몸통이 정확히 같아야 합니다. `system`, `messages`, `tools`, `tool_choice`, `thinking`, `cache_control` 이 일치해야 하고 `model` 과 `max_tokens`, `temperature` 같은 값은 바뀌어도 됩니다.
- 앞 모델의 `thinking` 블록을 빼면 안 됩니다. 토큰 없이 재시도할 때는 빼도 되지만 크레딧을 쓸 때는 몸통이 달라져서 거절당합니다.
- Fable 5.1 과 Fable 5 가 쓸 수 있는 폴백 대상은 Claude Opus 4.8 과 Claude Opus 5 입니다.
- Message Batches 의 거절은 크레딧 토큰을 만들지 않습니다.

적용됐는지는 재시도 응답의 `usage` 로 확인합니다. `cache_creation_input_tokens` 가 내려가고 `cache_read_input_tokens` 가 같은 양만큼 올라가 있으면 된 것입니다.

## 쿡북 쪽 설명은 9월 24일 이전에 멈춰 있습니다

여기서 문서 두 면이 어긋납니다. 위에서 인용한 공식 쿡북은 분류기에 직접 막힌 요청은 입력 토큰이 과금되지 않는다고 적어 두고 있습니다. 베타 헤더도 `server-side-fallback-2026-06-01` 로 적혀 있습니다. 릴리스 노트와 [Refusals and fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback) 문서는 세 카테고리를 과금한다고 적고 헤더도 `server-side-fallback-2026-07-01` 을 씁니다.

문서 쪽이 최신입니다. 문제는 구현할 때 복사해 가는 쪽이 보통 쿡북이라는 것입니다. 예제 코드가 붙어 있고 바로 돌려 볼 수 있기 때문입니다. 비용 계산을 쿡북 문장으로 잡아 두었다면 세 카테고리만큼 실제 금액이 더 나옵니다.

## 오탐 쪽에서 보면 다르게 읽힙니다

과금 기준이 오탐이 적게 측정된 카테고리라는 점은 이 결정 전체의 전제입니다. 전제가 흔들리면 정상적인 작업을 하다 거절당한 사람이 요금을 내게 됩니다.

그 전제가 늘 단단했던 것도 아닙니다. 6월에는 인사말 정도의 입력에도 분류기가 반응했다는 보도가 나왔습니다. 8월 7일에는 생물학 분류기의 기준 문서를 다시 써서 관련 오탐 폴백을 **약 85%** 줄였다는 보고가 나왔습니다. 개선이 필요할 만큼 오탐이 있었다는 이야기이기도 합니다. 두 건 모두 원문 도메인이 막혀 검색 결과로만 확인했으니 수치는 어림으로 읽는 편이 안전합니다.

그래도 과금 쪽 손을 들어 주는 근거가 하나 있습니다. Anthropic 이 과금 카테고리를 다섯 개 전부가 아니라 세 개로 제한했고 그 기준을 오탐 측정치로 공개했다는 점입니다. 기준이 공개되어 있으면 오탐이 늘었을 때 그 목록이 다시 줄어드는지 밖에서 확인할 수 있습니다.

## 거절을 비용 항목으로 옮길 때 확인할 것

지금 파이프라인에서 거절이 몇 건인지 셀 수 있는지 먼저 봅니다. 셀 수 없다면 그 수는 0 이 아니라 모르는 값입니다.

다음으로 요청이 나가는 경로를 전부 적어 두고 각각에 폴백이 걸려 있는지 확인합니다. 서브에이전트 호출은 따로 걸어야 합니다. 재시도 예산은 요청 하나를 단위로 잡습니다.

직접 재시도를 구현했다면 크레딧 토큰을 쓰고 있는지, 5분 안에 보내고 있는지를 봅니다.

단가표가 바뀌면 모두가 같은 폭으로 영향을 받고 발표문에도 그 숫자가 적힙니다. 이번 변경은 그렇지 않습니다. 어떤 요청을 보내는지에 따라 누구에게는 0원이고 누구에게는 매일 늘어나는 금액입니다. 그러면서 상태 코드는 계속 200 입니다.

## 참고 자료

- [Claude API release notes — Claude Docs](https://platform.claude.com/docs/en/release-notes/api)
- [Refusals and fallback — Claude Docs](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
- [Fallback credit — Claude Docs](https://platform.claude.com/docs/en/build-with-claude/fallback-credit)
- [Classifier fallback and billing for Claude Fable 5 — Claude Cookbook](https://platform.claude.com/cookbook/fable-5-fallback-billing-guide)
- [It blocked us at 'hello!' Anthropic Fable 5 refusing innocuous prompts — The Register](https://www.theregister.com/ai-and-ml/2026/06/10/anthropic-claude-fable-5-refuses-innocuous-prompts/5253754) (검색 결과로만 확인)
- [Anthropic Published Its Guardrail False-Positive Numbers](https://www.digitalapplied.com/blog/anthropic-fable-5-biology-classifier-false-positive-rates) (검색 결과로만 확인)
