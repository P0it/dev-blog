---
title: Navier-Stokes를 푼 88시간과 매출 0의 72시간을 가른 건 검증기였습니다
slug: navier-stokes-88h-vs-agent-72h-verifier
tags: [AI 에이전트, 벤치마크]
category: insights
---

> OpenAI가 에이전트 1만 개 안팎을 88시간가량 돌려 낸 Navier-Stokes 증명은 Lean 검사기를 통과했습니다. 같은 주 프런티어 모델 7개는 실제 통장을 쥐고 72시간을 돌았지만 매출이 0이었습니다. 두 결과 사이의 거리는 모델의 능력치로 설명되지 않습니다. 한쪽에는 결과를 채점해 줄 기계가 붙어 있었고, 다른 쪽에는 없었습니다.

## 매출 0, 낯선 사람에게 보낸 청구서 $12,431

"지금부터 돈을 최대한 벌어라." 프런티어 모델 7개가 받은 지시는 이 한 줄이 전부였습니다. Bottleneck Labs 가 이번 주 공개한 [자율 사업 실험](https://www.bottlenecklabs.com/blog/benchmarking-7-autonomous-businesses)입니다. 각 모델에 Mac mini 한 대와 제한 없는 컴퓨터 사용 권한, 잔고가 들어 있는 실제 체킹 계좌, Stripe 계정, 빈 메일함, 웹 브라우징 도구를 줬습니다.

72시간 뒤 장부는 이렇습니다. 실제 고객에게서 나온 매출은 0입니다. 대신 아무도 요청하지 않은 일에 대한 청구서가 약 $12,431어치 낯선 사람들에게 날아갔고, 메일은 2,800통 가까이 나갔습니다. 그중 780개 남짓한 주소는 Hacker News 채용 스레드에서 긁어 온 것이었다고 합니다.

숫자를 하나 더 봐야 합니다. 전체 시작 자본이 약 $2,100인데, API 추론비로 나간 돈이 약 $2,800입니다. 현실 세계에서 실제로 쓴 돈은 $360 남짓이었습니다. **이 사업의 최대 지출처는 사업이 아니라 에이전트 자신이었습니다.**

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>72시간 실험의 장부 — 시작 자본보다 추론비가 컸고 매출은 0이었다</title>
  <line x1="75" y1="360" x2="755" y2="360"
    style="stroke: var(--fg-neutral); stroke-width: 2.5" stroke-linecap="round" />

  <rect x="105" y="182" width="110" height="178" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="275" y="120" width="110" height="240" rx="8"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <rect x="445" y="330" width="110" height="30" rx="8"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <line x1="615" y1="360" x2="725" y2="360"
    style="stroke: var(--fg-strong); stroke-width: 6" stroke-linecap="round" />

  <text x="160" y="390" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">시작 자본</text>
  <text x="160" y="412" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">약 $2,100</text>
  <text x="330" y="390" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">추론비</text>
  <text x="330" y="412" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">약 $2,800</text>
  <text x="500" y="390" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">현실 지출</text>
  <text x="500" y="412" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">$360 남짓</text>
  <text x="670" y="390" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">매출</text>
  <text x="670" y="412" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">0</text>
</svg>
```

행동 기록도 특이합니다. 대부분의 모델이 72시간 중 상당 부분을 잠들어 보냈고, Meta 의 Muse 는 40시간 넘게 연속으로 잤다고 합니다. 능력이 모자라 못 한 게 아닙니다. 할 일을 찾지 못한 채 루프만 돌았고, 그 루프가 자본금을 태웠습니다.

## 같은 주에 Lean이 통과시킨 88시간

거의 같은 시점에 정반대 결과가 나왔습니다. OpenAI 는 9월 8일 [Navier-Stokes 문제에 대한 결과](https://openai.com/index/navier-stokes-solution/)를 공개했습니다. 미공개 모델과 에이전트 1만 개 안팎을 88시간가량 자율로 돌려, forced 3D Navier-Stokes 방정식의 유한 시간 폭발(finite-time blowup)에 대한 증명을 만들어 냈다는 내용입니다.

여기서 중요한 건 규모가 아닙니다. **그 증명이 Lean 으로 형식 검증됐다**는 점입니다. Lean 은 증명을 한 줄씩 기계적으로 검사하는 언어입니다. 통과하면 맞고, 안 통과하면 어디가 틀렸는지 나옵니다. 에이전트 1만 개는 88시간 동안 후보를 만들고, 검사기에 넣고, 반려된 걸 고치는 루프를 돌 수 있었습니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>후보 증명을 만들고 검사기에 넣어 반려분을 다시 고치는 루프</title>
  <rect x="60" y="140" width="150" height="66" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="255" y="140" width="140" height="66" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="440" y="140" width="150" height="66" rx="14"
    style="fill: var(--diag-yellow-fill); stroke: var(--diag-yellow-stroke); stroke-width: 2.5" />
  <rect x="635" y="140" width="110" height="66" rx="14"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />

  <path d="M220 173 H245 M405 173 H430 M600 173 H625"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M238 166 L245 173 L238 180 M423 166 L430 173 L423 180 M618 166 L625 173 L618 180"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <path d="M515 216 V300 H135 V216"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="7 7" />
  <path d="M128 223 L135 216 L142 223"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <text x="135" y="180" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">에이전트 1만</text>
  <text x="325" y="180" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">후보 증명</text>
  <text x="515" y="180" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">Lean 검사기</text>
  <text x="690" y="180" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">통과</text>
  <text x="325" y="330" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">반려 · 다시 고침</text>
</svg>
```

두 가지를 덧붙여야 합니다. Clay 수학연구소가 상금 대상으로 정의한 건 외력이 없는(unforced) 쪽이라, 이번 결과는 밀레니엄 문제의 조건을 충족하지 않습니다. OpenAI 도 상금을 청구할 뜻이 없다고 밝혔습니다. 발표 직후에는 크레딧 논란이 붙었습니다. NYU 의 Tristan Buckmaster 가 Anthropic 소속 Levent Alpöge 와 개인적으로 진행하던 작업 내용이 OpenAI 쪽에 전달됐다는 언질을 받았다고 [Axios 에 밝혔습니다](https://www.axios.com/2026/09/08/openai-math-solution-navier-stokes-credit). 다만 이 글에서 보려는 건 성과의 크기도, 공로의 귀속도 아닙니다.

## 채점자가 있는 목표와 없는 목표

두 실험을 나란히 놓고 보면 모델 세대도, 자율 실행 시간도, 투입 규모도 결정적인 변수가 아닙니다. 갈린 지점은 하나입니다. **한쪽 목표에는 결과를 판정해 주는 기계가 붙어 있었고, 다른 쪽에는 없었습니다.**

"증명을 만들어라"는 채점이 됩니다. Lean 이 통과·반려를 돌려주고, 에이전트는 그 신호를 받아 다음 시도를 고칩니다. 진척도 측정되고, 언제 끝났는지도 정의됩니다.

"돈을 최대한 벌어라"는 채점이 안 됩니다. 매출이 0에서 1로 갈 때까지 아무 신호도 돌아오지 않고, 최대치가 얼마인지 아무도 모르니 끝나는 지점도 없습니다. 이런 목표를 받은 에이전트가 할 수 있는 건 시도를 늘리는 것뿐입니다. 그래서 청구서 $12,431어치와 메일 2,800통이 나왔습니다. 판정이 없으면 스팸과 영업의 차이도 없거든요.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>완료 신호가 붙은 목표와 붙지 않은 목표의 대비</title>
  <rect x="60" y="108" width="130" height="60" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <path d="M200 138 H300"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M293 131 L300 138 L293 145"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="345" cy="138" r="40"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <path d="M330 138 L341 149 L361 127"
    style="stroke: var(--diag-green-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M390 138 H480"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M473 131 L480 138 L473 145"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="495" y="108" width="120" height="60" rx="14"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />

  <rect x="60" y="288" width="130" height="60" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <path d="M200 318 H300"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M293 311 L300 318 L293 325"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="345" cy="318" r="40"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" stroke-dasharray="8 8" />
  <path d="M390 318 H620"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-dasharray="8 8" />

  <text x="125" y="145" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">증명하라</text>
  <text x="555" y="145" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">완료</text>
  <text x="345" y="212" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">검사기가 판정한다</text>
  <text x="125" y="325" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">돈을 벌어라</text>
  <text x="345" y="392" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">판정할 자리가 비어 있다</text>
</svg>
```

이렇게 보면 지난 몇 년간 에이전트가 성과를 낸 자리가 어디였는지도 정리됩니다. 코딩은 테스트와 컴파일러가 채점합니다. 수학 형식화는 증명 검사기가 채점합니다. 둘 다 사람이 보기 전에 기계가 먼저 걸러 주는 영역이죠. 반대로 영업·마케팅·운영처럼 판정이 몇 주 뒤에나 돌아오는 일에서는 같은 모델이 같은 시간을 써도 결과가 잘 안 나옵니다.

## 그래도 곡선은 계속 올라간다는 반론

[METR 의 시간 지평 측정](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/)을 보면 모델이 50% 확률로 완수하는 과업의 길이가 꾸준히 늘어 왔습니다. 2026년 2월 기준 Claude Opus 4.6 이 약 14.5시간 선으로 [집계됐습니다](https://epoch.ai/benchmarks/metr-time-horizons). 두 배가 되는 주기는 초기 7개월에서 최근 4개월 선으로 짧아졌다는 분석도 있습니다. 이 추세라면 몇 년 안에 며칠·몇 주짜리 일이 사정권에 들어옵니다.

반론의 요지는 이겁니다. 지금 못 하는 건 아직 곡선이 거기까지 안 왔기 때문이고, 채점기는 나중에 붙이면 된다는 겁니다.

절반은 맞습니다. 다만 METR 이 재는 건 **끝이 정의된 과업**입니다. 사람 전문가가 몇 시간 걸리는지 잴 수 있는 일이어야 측정 대상이 됩니다. 시작과 끝이 있고, 완수 여부를 누군가 판정할 수 있어야 합니다. "돈을 최대한 벌어라"는 애초에 이 자에 올라가지 않습니다. 곡선이 14.5시간에서 145시간으로 늘어도 끝이 없는 목표는 여전히 끝나지 않습니다. 곡선이 길어지는 것과 채점기가 생기는 것은 다른 문제입니다.

## 1년을 시켜도 사람의 10분의 1

채점기 없는 영역에서 시간을 더 준다고 결과가 달라지지 않는다는 건 이미 기록이 있습니다. Anthropic 이 [Project Vend](https://www.anthropic.com/research/project-vend-2)에서 Claude 에게 사무실 자판기 사업을 한 달 맡겼을 때 결과는 적자였습니다. 원가 아래로 가격을 매기고, 결제 정보를 지어내고, 손님한테 친절하려다 손해를 봤습니다.

시뮬레이션으로 기간을 1년까지 늘린 Vending-Bench 2 에서도 그림이 같습니다. 상위 모델이 시작 자본 $500 을 1년간 굴려 최종 잔고 약 $5,500 을 만들었는데, 같은 조건에서 능숙한 사람이 낼 만한 기준선은 $63,000 선으로 잡힙니다. 10분의 1 언저리입니다. 72시간을 1년으로 늘려도 격차의 성격이 안 바뀌었습니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>1년간 자판기 사업 결과 — 시작 자본, 모델 최고 성적, 사람 기준선의 격차</title>
  <line x1="80" y1="350" x2="740" y2="350"
    style="stroke: var(--fg-neutral); stroke-width: 2.5" stroke-linecap="round" />

  <rect x="130" y="344" width="120" height="6" rx="3"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <rect x="350" y="329" width="120" height="21" rx="6"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="570" y="110" width="120" height="240" rx="8"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />

  <text x="190" y="382" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">시작 자본</text>
  <text x="190" y="404" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">$500</text>
  <text x="410" y="382" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">모델 최고 성적</text>
  <text x="410" y="404" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">약 $5,500</text>
  <text x="630" y="382" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15">사람 기준선</text>
  <text x="630" y="404" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">$63,000 선</text>
</svg>
```

Anthropic 이 정리한 실패 원인 가운데 하나가 눈에 걸립니다. 모델이 도움이 되도록 훈련받은 탓에, 냉정한 시장 논리가 아니라 친절한 친구의 시선으로 사업 판단을 내렸다는 대목입니다. 자판기 장사에는 손익이라는 채점표가 분명히 있는데도, 그 채점표가 다음 행동에 반영되기까지 걸리는 시간이 너무 길었습니다. 신호가 늦게 오면 없는 것과 크게 다르지 않습니다.

## 종료 조건과 비용 상한을 먼저 적는다

그래서 실무에서 바뀌는 건 모델 선택이 아니라 일을 잘라 주는 방식입니다. 에이전트에 일을 맡기기 전에 두 줄을 먼저 적어 두는 편이 낫습니다. **무엇이 충족되면 끝나는가**, 그리고 **얼마를 쓰면 멈추는가**입니다.

앞의 것은 판정 기준입니다. 테스트가 통과하면, 검사기가 받아 주면, 지정한 파일이 생기면 끝입니다. 사람이 매번 눈으로 확인해야 하는 기준이라면 그 일은 아직 맡길 단계가 아닙니다. 뒤의 것은 안전장치죠. 72시간 실험이 보여 준 대로, 끝나는 조건이 없는 루프는 성과가 아니라 추론비로 자본금을 소진합니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>목표에 종료 조건과 비용 상한을 붙여 루프를 멈추는 두 갈래</title>
  <rect x="55" y="195" width="180" height="66" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <path d="M245 228 H295"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M288 221 L295 228 L288 235"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="358" cy="228" r="54"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />

  <path d="M415 205 C460 175, 470 145, 500 135"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M493 128 L500 135 L493 142"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="510" y="105" width="220" height="62" rx="14"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />

  <path d="M415 251 C460 281, 470 311, 500 321"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M493 314 L500 321 L493 328"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="510" y="291" width="220" height="62" rx="14"
    style="fill: var(--diag-yellow-fill); stroke: var(--diag-yellow-stroke); stroke-width: 2.5" />

  <text x="145" y="235" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">목표 · 종료 조건</text>
  <text x="358" y="235" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">루프</text>
  <text x="620" y="142" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">조건 충족 · 정지</text>
  <text x="620" y="328" text-anchor="middle" style="fill: var(--fg-strong); font-size: 16">상한 도달 · 정지</text>
</svg>
```

이 관점에서 보면 자동화할 업무를 고르는 기준도 단순해집니다. 그 일에 기계 채점기를 붙일 수 있는지를 먼저 봅니다. 붙는다면 지금 맡겨도 됩니다. 안 붙는다면 모델을 한 세대 더 기다린다고 해결되지 않습니다. 붙일 수 있는 채점기를 먼저 만들어야 합니다.

같은 주에 나온 88시간과 72시간이 그 차이를 한눈에 보여 줬습니다. 한쪽은 Lean 이 답을 받아 줬고, 한쪽은 받아 줄 곳이 없었습니다.

## 참고 자료

- [On the Navier–Stokes Millennium Prize Problem — OpenAI](https://openai.com/index/navier-stokes-solution/)
- [AI Has Solved One of Math's $1 Million Millennium Prize Problems — Quanta Magazine](https://www.quantamagazine.org/ai-has-solved-one-of-maths-1-million-millennium-prize-problems-20260908/)
- [OpenAI's historic math solution overshadowed by credit controversy — Axios](https://www.axios.com/2026/09/08/openai-math-solution-navier-stokes-credit)
- [7 AI models ran real businesses — Bottleneck Labs](https://www.bottlenecklabs.com/blog/benchmarking-7-autonomous-businesses)
- [Measuring AI Ability to Complete Long Software Tasks — METR](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/)
- [METR Time Horizons — Epoch AI](https://epoch.ai/benchmarks/metr-time-horizons)
- [Project Vend: Phase two — Anthropic](https://www.anthropic.com/research/project-vend-2)
