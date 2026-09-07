---
title: Claude가 페르마를 증명했지만 Mathlib은 그 코드를 받지 않습니다
slug: claude-fermat-lean-review-bottleneck
tags: [AI 코딩, 코드 리뷰]
category: insights
---

> Claude 에이전트가 페르마의 마지막 정리를 Lean 코드 약 1,300만 줄로 옮겼습니다. 같은 기록에 툴체인을 한 칸 올리자 증명 파일 26% 선이 손을 봐야 했다는 대목이 함께 있습니다. 생성이 싸질수록 값이 오르는 쪽은 검토입니다.

## 11일 남짓에 쌓인 1,300만 줄

Anthropic이 9월 4일 [페르마의 마지막 정리를 Lean으로 형식화한 결과](https://www.anthropic.com/research/formalizing-fermats-last-theorem)를 공개했습니다. Claude 에이전트 여럿이 11일 남짓 돌아 약 1,300만 줄을 썼고, 그 과정에서 3만 개 안팎의 보조 정리를 함께 증명했습니다. 수학자들이 몇 년으로 잡던 일입니다.

한 가지는 분명히 해 둬야 합니다. 새 증명을 찾은 게 아닙니다. Andrew Wiles가 1994년에 내놓은 증명을 **기계가 검사할 수 있는 형태로 옮긴** 것입니다.

작업은 Prove2Me라는 공개 플랫폼 위에서 돌았습니다. 정리 문장들을 그래프로 들고 있어서, 에이전트가 지금 어느 자리를 채워야 하는지 볼 수 있습니다. 문장과 증명을 파일로 나눠 컴파일을 빠르게 하고, 문장마다 평이한 설명을 붙여 나중에 찾아 쓰게 해 둔 구조죠.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>에이전트 여럿이 정리 그래프의 빈 자리를 나눠 채우는 모습</title>
  <circle cx="105" cy="140" r="26"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="105" cy="225" r="26"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="105" cy="310" r="26"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <path d="M141 140 H240 M141 225 H240 M141 310 H240"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
  <path d="M228 132 L242 140 L228 148 M228 217 L242 225 L228 233 M228 302 L242 310 L228 318"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M330 120 L455 95 M330 120 L400 235 M455 95 L590 140 M400 235 L520 225 M520 225 L590 140 M400 235 L440 345 M520 225 L610 335 M440 345 L610 335"
    style="stroke: var(--diag-edge); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
  <circle cx="330" cy="120" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="455" cy="95" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="590" cy="140" r="22"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <circle cx="400" cy="235" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="520" cy="225" r="22"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <circle cx="440" cy="345" r="22"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <circle cx="610" cy="335" r="22"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <text x="105" y="392" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 17px">에이전트</text>
  <text x="470" y="410" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 17px">정리 그래프</text>
</svg>
```

## Lean 4.33에서 손봐야 했던 파일 26%

같은 기록에 유지보수 쪽 숫자가 함께 적혀 있습니다. Lean을 4.30에서 4.33으로 올리고 Mathlib을 맞춰 갱신하자, 증명 파일 3만 개 가까이 가운데 **26% 선이 바뀌었고 19% 선은 개별 수리**가 필요했습니다. 클린 빌드는 96코어 장비에서 여섯 시간 가까이 걸립니다.

크기도 만만치 않습니다. 이 코드는 이 분야의 공용 라이브러리인 Mathlib보다 다섯 배쯤 큽니다. 그런데 Mathlib은 지금 AI가 검토한 코드를 받지 않는 정책이라, 1,300만 줄은 라이브러리 밖에 그대로 서 있습니다.

만들어진 순간부터 관리 대상입니다. 툴체인은 앞으로도 계속 올라갈 테고, 그때마다 같은 비율이 흔들린다면 이 산출물을 살려 두는 일 자체가 상시 작업이 됩니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>툴체인을 한 칸 올렸을 때 손봐야 했던 증명 파일의 비율</title>
  <rect x="150" y="48" width="170" height="56" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="480" y="48" width="170" height="56" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="235" y="83" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 19px">Lean 4.30</text>
  <text x="565" y="83" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 19px">Lean 4.33</text>
  <path d="M332 76 H466"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M452 66 L468 76 L452 86"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <g style="stroke-width: 2.5">
    <rect x="96" y="160" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="154" y="160" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="212" y="160" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="270" y="160" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="328" y="160" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="386" y="160" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="444" y="160" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="502" y="160" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="560" y="160" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="618" y="160" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="96" y="218" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="154" y="218" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="212" y="218" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="270" y="218" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="328" y="218" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="386" y="218" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="444" y="218" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="502" y="218" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="560" y="218" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="618" y="218" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="96" y="276" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="154" y="276" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="212" y="276" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="270" y="276" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="328" y="276" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="386" y="276" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="444" y="276" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="502" y="276" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="560" y="276" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="618" y="276" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="96" y="334" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="154" y="334" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="212" y="334" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="270" y="334" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="328" y="334" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="386" y="334" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="444" y="334" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="502" y="334" width="46" height="46" rx="8" style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke)" />
    <rect x="560" y="334" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
    <rect x="618" y="334" width="46" height="46" rx="8" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke)" />
  </g>
  <text x="380" y="412" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 17px">붉은 칸 = 업그레이드 뒤 손댄 파일</text>
</svg>
```

## 검사기가 확인해 주지 않는 것

Lean이 확인하는 건 하나입니다. **이 증명이 이 문장을 증명한다.** 그 문장이 사람이 말하려던 바로 그 문장인지는 확인하지 않습니다.

자동형식화 연구가 이 지점을 오래 짚어 왔습니다. [자연어 문장을 Lean으로 옮긴 결과를 평가한 연구](https://arxiv.org/html/2606.31002)를 보면, 타입 체크는 멀쩡히 통과하면서 가정을 하나 빠뜨리거나 한정사를 뒤집은 문장이 나옵니다. 그런 문장은 뒤에서 증명까지 잘 붙기 때문에 신호가 남지 않습니다. 컴파일 성공률과 의미가 맞는 비율 사이 격차는 시스템에 따라 몇 포인트에서 30포인트 가까이 벌어진다고 보고됩니다.

수학 밖에서도 구도는 같습니다. 에이전트가 초록 불을 띄운 테스트가 맞는 테스트인지, 통과한 조건이 원래 지키려던 조건인지는 사람이 읽어야 압니다. 기계는 문장 아래쪽의 확신만 늘려 줍니다. 문장 자체는 여전히 사람의 몫이죠.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>의도와 형식 문장 사이는 사람이 읽어야 하고 그 아래만 검사기가 확인한다</title>
  <rect x="60" y="180" width="180" height="96" rx="18"
    style="fill: var(--diag-mute-fill); stroke: var(--fg-strong); stroke-width: 2.5" />
  <rect x="310" y="180" width="180" height="96" rx="18"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="560" y="180" width="180" height="96" rx="18"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="150" y="235" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 20px">의도</text>
  <text x="400" y="235" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 20px">형식 문장</text>
  <text x="650" y="235" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 20px">검사기</text>
  <path d="M250 228 H300"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-dasharray="9 9" stroke-linecap="round" />
  <path d="M500 228 H550"
    style="stroke: var(--diag-green-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
  <path d="M536 218 L552 228 L536 238"
    style="stroke: var(--diag-green-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M150 160 V120 H400 V160"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-dasharray="9 9" stroke-linecap="round" stroke-linejoin="round" />
  <text x="275" y="102" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 17px">사람이 읽는 구간</text>
  <path d="M400 296 V336 H650 V296"
    style="stroke: var(--diag-green-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="525" y="372" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 17px">기계가 확인하는 구간</text>
</svg>
```

## PR은 두 배, 검토 시간은 90% 넘게

일반 개발 현장에서도 같은 계산서가 나옵니다. [Sonar가 개발자 1,100여 명을 조사한 2026 State of Code 보고서](https://www.sonarsource.com/company/press-releases/sonar-data-reveals-critical-verification-gap-in-ai-coding/)를 보면, 커밋되는 코드에서 AI가 쓴 비중이 40%대에 올라섰습니다. 그런데 AI 코드를 온전히 신뢰한다는 응답은 거의 없고, 커밋 전에 항상 검증한다는 응답은 절반에 못 미칩니다. AI 코드 검토가 동료 코드 검토보다 힘들다고 답한 비율도 40%에 가깝습니다.

같은 보고서에 붙은 다른 집계가 더 또렷합니다. AI를 쓰는 개발자는 작업을 20% 남짓 더 끝내고 PR은 두 배 가까이 병합하는데, PR 검토에 드는 시간은 90% 넘게 늘었습니다.

[DORA의 2026년 보고서](https://dora.dev/insights/balancing-ai-tensions/)는 이걸 증폭기라는 말로 정리합니다. AI 도입이 늘면 처리량도 오르고 불안정성도 같이 오릅니다. 생성에서 아낀 시간이 감사와 검증으로 옮겨 가는 몫을 이 보고서는 검증 세라고 부릅니다.

혼자 개발하는 입장에서 이 표는 꽤 불편합니다. 생성 쪽은 세션을 하나 더 띄우면 늘어나는데, 검토 쪽은 늘릴 방법이 없습니다. 읽는 사람이 한 명이니까요.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>생성량은 가파르게 오르고 검토 용량은 거의 그대로여서 벌어지는 간격</title>
  <path d="M90 370 H720 M90 370 V80"
    style="stroke: var(--diag-edge); stroke-width: 2.5; fill: none" stroke-linecap="round" />
  <path d="M110 350 C 260 340, 400 250, 700 120 L700 322 C 400 316, 260 322, 110 330 Z"
    style="fill: var(--diag-blue-fill); stroke: none; opacity: 0.55" />
  <path d="M110 350 C 260 340, 400 250, 700 120"
    style="stroke: var(--diag-blue-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
  <path d="M110 330 C 300 326, 480 320, 700 322"
    style="stroke: var(--fg-strong); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
  <text x="700" y="104" text-anchor="end"
    style="fill: var(--fg-neutral); font-size: 17px">생성량</text>
  <text x="700" y="352" text-anchor="end"
    style="fill: var(--fg-neutral); font-size: 17px">검토 용량</text>
  <text x="405" y="412" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 17px">벌어지는 만큼이 밀린 검토</text>
</svg>
```

## 그래도 기계 검증이 더 강하다는 반론

반대 시각도 분명합니다. 사람 심사는 몇 년이 걸리고, 그러고도 틀립니다. Lean이 통과시킨 증명은 사람 몇 명의 눈보다 훨씬 단단한 보증입니다. 같은 일을 손으로 진행해 온 수학자 Kevin Buzzard도 이 결과가 수학에 대해서가 아니라 형식화가 지금 어디까지 왔는지에 대해 말해 준다고 적었습니다.

맞는 말입니다. 저도 이 작업이 대단하지 않다고 보지 않습니다. 다만 보증의 범위가 문장 아래로 한정된다는 점, 그리고 그 산출물이 계속 쓰이려면 사람이 관리하는 라이브러리에 들어가야 하는데 그 문이 지금 닫혀 있다는 점은 그대로 남습니다. 검증이 강해진 것과 검토가 줄어든 것은 다른 이야기입니다.

DORA가 처리량 하락이 사라졌다고 보고한 것도 같은 자리에서 읽어야 합니다. 속도는 회복됐지만 불안정성은 함께 올랐습니다. 비용이 없어진 게 아니라 항목이 바뀐 겁니다.

## 검토 예산을 먼저 잡는다

저는 이 사례에서 하나를 가져갑니다. 에이전트를 몇 대 굴릴지 정하기 전에, 하루에 읽어낼 수 있는 diff 가 얼마인지를 먼저 정해 둡니다. 그 한도를 넘긴 생성물은 자산이 아니라 밀린 일감입니다.

읽을 양을 줄이는 쪽도 같이 봅니다. 변경 단위를 작게 쪼개고, 사람이 반드시 읽어야 할 자리와 기계에 맡겨도 되는 자리를 미리 갈라 둡니다. 1,300만 줄에서 드러난 건 모델의 한계가 아닙니다. 검토라는 항목에 이제 값을 매겨야 합니다.

## 참고 자료

- [Formalizing Fermat's Last Theorem — Anthropic](https://www.anthropic.com/research/formalizing-fermats-last-theorem)
- [Formalizing Fermat's Last Theorem in Lean (PDF) — Anthropic](https://www-cdn.anthropic.com/9e431dff043da6538d99d6c2d231b670aa3da263.pdf)
- [FLT: Anthropic has beaten me to it — Xena Project (Kevin Buzzard)](https://xenaproject.wordpress.com/2026/09/04/flt-anthropic-has-beaten-me-to-it/)
- [Beyond Compilation: Evaluating Faithful Natural-Language-to-Lean Statement Formalization](https://arxiv.org/html/2606.31002)
- [Sonar 2026 State of Code Developer Survey](https://www.sonarsource.com/company/press-releases/sonar-data-reveals-critical-verification-gap-in-ai-coding/)
- [Balancing AI tensions — DORA](https://dora.dev/insights/balancing-ai-tensions/)
