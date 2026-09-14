---
title: DeepSeek의 V4-Pro 라우팅 철회가 드러낸 모델 ID의 유효기간
slug: deepseek-v4-pro-routing-model-id
tags: [AI 에이전트, LLM API]
category: insights
---

> DeepSeek가 `deepseek-v4-pro` 로 들어오는 요청을 전부 작은 모델로 넘기겠다던 계획을 시행 당일에 접었습니다. 모델 은퇴에서 실제로 위험한 것은 통보 기간의 길이가 아니라 은퇴한 ID 로 간 요청이 에러로 끊기느냐 200 을 받고 다른 모델의 답을 가져오느냐입니다.

## 시행 당일에 되돌린 V4-Pro 라우팅

DeepSeek는 9월 10일 V4.1-Flash 를 공개하면서 함께 공지를 냈습니다. 9월 14일 04:00 UTC 부터 `deepseek-v4-pro` 로 들어오는 요청을 전부 V4.1-Flash 가 처리하고 요금도 Flash 기준으로 받겠다는 내용이었습니다. 작은 모델이 대부분의 시험에서 앞섰으니 큰 쪽을 정리한다는 설명이었습니다.

그리고 그 날짜에 계획을 접었습니다. 사용자 요구를 이유로 V4-Pro 를 API 에서 계속 제공하고 청구도 그대로 두겠다고 밝혔습니다.

하루 차이로 없던 일이 됐지만 공지가 말한 내용은 그대로 남습니다. 모델을 내리겠다는 이야기가 아니라 **같은 모델 ID 에 다른 모델이 답하게 하겠다는 이야기**였습니다. 두 문장은 코드 입장에서 전혀 다릅니다. 앞쪽은 배포가 실패합니다. 뒤쪽은 배포가 성공합니다.

## 은퇴가 에러로 끝나지 않을 때

같은 일이 5월에 한 번 있었습니다. xAI 가 5월 15일에 Grok 계열 모델 여덟 개를 정리했는데 통보에서 시행까지가 열흘이 채 안 됐다고 합니다. 짧은 통보만으로도 충분히 문제였지만 정작 논란이 된 것은 그다음입니다.

은퇴한 슬러그가 사라지지 않았습니다. 공개된 정리 글들에 따르면 옛 슬러그로 간 요청은 grok-4.3 이 받았습니다. 추론 모델은 effort 가 낮은 단계로 내려갔고 요금은 grok-4.3 기준으로 계산됐습니다. 은퇴를 알리는 메일에는 요청이 "더 이상 동작하지 않는다"고 적혀 있었는데 문서에는 다른 동작이 적혀 있었습니다.

호출하는 쪽에서 보면 이렇습니다. 에러도 경고도 없이 200 이 돌아옵니다. 로그에는 실패가 한 줄도 남지 않습니다. 달라진 것은 답의 품질과 요금뿐입니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>은퇴한 모델 ID로 간 요청이 실패로 끊기는 경우와 다른 모델의 응답을 받는 경우</title>
  <rect x="50" y="190" width="160" height="70" rx="14"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" />
  <text x="130" y="232" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 18px">요청</text>
  <path d="M220 225 H300"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="310" y="190" width="180" height="70" rx="14"
    style="fill: none; stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="400" y="232" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 18px">은퇴한 모델 ID</text>
  <path d="M500 215 L560 140 M500 235 L560 310"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="570" y="90" width="180" height="80" rx="14"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="660" y="125" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 18px">요청 실패</text>
  <text x="660" y="150" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">배포가 멈춘다</text>
  <rect x="570" y="280" width="180" height="80" rx="14"
    style="fill: var(--diag-yellow-fill); stroke: var(--diag-yellow-stroke); stroke-width: 2.5" />
  <text x="660" y="315" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 18px">200 · 다른 모델</text>
  <text x="660" y="340" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">품질과 요금만 달라진다</text>
</svg>
```

둘 중 어느 쪽이 나을까요? 배포가 멈추는 쪽입니다. 실패는 알림으로 잡히고 원인도 한 줄로 나옵니다. 품질 저하는 사용자가 먼저 발견합니다.

## Anthropic 문서가 같은 자리에 적어 둔 두 줄

[Anthropic 의 모델 은퇴 문서](https://platform.claude.com/docs/en/about-claude/model-deprecations)는 이 질문에 두 줄로 답해 둡니다. 하나는 통보입니다. 공개 출시된 모델은 은퇴 **최소 60일 전**에 알린다고 적혀 있습니다. 다른 하나는 은퇴 이후의 동작입니다. 문서는 Retired 를 정의하면서 "은퇴한 모델에 대한 요청은 실패한다"고 적었습니다.

실제 일정도 그 선을 지켰습니다. Claude Opus 4.1 은 2026년 6월 5일에 통보돼 8월 5일에 은퇴했고 Claude Sonnet 4 와 Claude Opus 4 는 4월 14일 통보에 6월 15일 은퇴였습니다. 각각 61일과 62일입니다.

[모델 개요 문서](https://platform.claude.com/docs/en/about-claude/models/overview)에는 한 줄이 더 있습니다. Claude 의 모델 ID 는 전부 pinned snapshot 입니다. 4.6 세대부터 쓰는 날짜 없는 ID 도 그 자체로 고정된 스냅샷입니다. 별칭이 최신 모델을 따라가지 않는다는 뜻입니다.

세 곳의 정책을 같은 항목으로 놓고 보면 차이가 분명해집니다.

| | Anthropic | xAI | DeepSeek |
|---|---|---|---|
| 통보 기간 | 공개 모델 최소 60일 | 5월 15일 정리는 열흘 남짓 | 9월 10일 공지, 시행 9월 14일 |
| 은퇴 후 요청 | 실패한다고 문서에 명시 | 옛 슬러그가 grok-4.3 으로 이어짐 | 라우팅 계획 자체를 철회 |
| 요금 기준 | 해당 없음 | grok-4.3 기준으로 계산 | V4-Pro 청구 그대로 유지 |
| 최근 사례 | Opus 4.1 · 6월 5일 통보, 8월 5일 은퇴 | 모델 8개 · 5월 15일 정리 | V4-Pro · 9월 14일 철회 |

여기서 통보 기간만 보면 60일과 열흘의 차이입니다. 그런데 운영에 더 크게 걸리는 칸은 두 번째 줄입니다. 60일을 받아도 달력에 적어 두지 않으면 놓치지만 놓쳤을 때 실패가 나면 그날 바로 압니다. 열흘을 받고 놓쳤는데 응답이 계속 200 이면 언제 알게 될지는 아무도 모릅니다.

## 그래도 옛 모델을 계속 제공할 수는 없다는 쪽

공급자 쪽 사정도 같은 문서에 적혀 있습니다. Anthropic 은 새 모델을 낼 용량을 확보하려고 옛 모델을 은퇴시킨다고 밝히면서 그 대가도 함께 적어 뒀습니다. 특정 모델을 쓰던 사용자는 옮겨야 합니다. 연구자는 비교 연구에 쓰던 모델을 잃습니다. 모델 은퇴 자체가 안전과 모델 복지 측면의 문제를 만든다고도 적었습니다. 그래서 가중치를 장기 보존하겠다고 약속해 뒀습니다.

DeepSeek 의 철회도 이 틀에서 보면 이해가 됩니다. 작은 모델이 대부분의 시험에서 앞서고 가격이 3분의 1 수준이면 큰 모델을 계속 서비스할 이유가 약해지거든요. 그래도 프로덕션이 걸린 쪽에서는 "우리 벤치마크에서 더 낫다"가 이전을 결정할 근거가 되지 않습니다. 이번에 그 간극이 하루 만에 드러났고 DeepSeek 는 계획을 접는 쪽을 골랐습니다.

## API 위에 얹어 둔 1인 파이프라인이 확인할 것

이 관점에서 보면 1인 개발자가 확인할 것은 세 가지로 좁혀집니다.

- **호출하는 ID 가 스냅샷인지 별칭인지.** 별칭은 편하지만 무엇을 가리키는지가 공급자 손에 있습니다.
- **은퇴 이후 동작이 문서 어디에 적혀 있는지.** 실패인지 대체인지가 적혀 있지 않은 공급자라면 그 자체가 정보입니다.
- **응답 품질이 달라졌을 때 잡히는 장치가 있는지.** 에러는 알림이 잡아 주지만 품질은 잡아 주지 않습니다.

모델 ID 를 계약처럼 다루기 쉽습니다. 문자열 하나를 고정해 두면 같은 모델이 답한다고 여기게 됩니다. 이번 주 DeepSeek 의 공지와 철회는 그 문자열에 유효기간이 있다는 사실을 하루짜리 사건으로 보여 줬습니다. 다음번에도 되돌려질 거라고 기대할 이유는 없습니다.
