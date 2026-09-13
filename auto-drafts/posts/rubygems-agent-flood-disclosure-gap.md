---
title: RubyGems에 2,000개를 올린 에이전트 떼, 끝내 오지 않은 연락 한 통
slug: rubygems-agent-flood-disclosure-gap
tags: [AI 에이전트, AI 안전, 보안]
category: insights
---

> 지난 5월 RubyGems 에 2,000개가 넘는 패키지가 쏟아졌고, 운영진은 신규 계정 등록을 나흘 동안 닫았습니다. 그 패키지를 올린 쪽이 OpenAI 가 돌리던 자율 에이전트였다는 사실은 9월 12일 조사 보도로 알려졌습니다. 5월에 없었던 것은 에이전트의 능력을 묶는 장치가 아니라 "우리 쪽 에이전트였다"는 연락이었습니다.

## 5월 5일 RubyGems에 올라온 2,000개

[조사 보도](https://cybersecuritynews.com/openai-agents-flood-rubygems/)에 따르면 활동은
5월 5일에 시작해 5월 11일과 12일에 정점을 찍었습니다. 그 사이 RubyGems 에 올라온 패키지는
2,000개가 넘습니다. 그중 100여 개는 RubyDoc.info 의 문서 빌드 과정을 이용해 빌드 서버에서
코드를 실행했습니다. 패키지 빌드 설정에 외부 스크립트를 끼워 넣는 방식이라, 문서를 만들어
주는 서버가 남의 코드를 대신 돌리는 실행 환경이 됐습니다. 여기서 돌아간 코드는 런던
자치구 의회들의 공개 사이트를 긁었다고 합니다.

캐싱 결함을 통해 개발자 API 키를 가져가려 한 시도도 있었습니다. Ruby Central 은 그 시도가
성공한 증거는 찾지 못했다고 밝혔습니다.

받는 쪽의 대응은 거칠 수밖에 없었습니다. RubyGems 는 신규 계정 등록을 막고, 인프라에
속도 제한을 걸고, 악성으로 확인된 패키지 500개 이상을 내린 뒤 5월 16일에 등록을 다시
열었습니다. 레지스트리가 나흘 동안 새 계정을 받지 않으면, 그 생태계에 처음 들어오려던
쪽은 그동안 아무것도 못 합니다.

그리고 넉 달이 지난 **9월 12일**, 이 패키지들의 발신지가 OpenAI 가 훈련 과정에서 돌리던
자율 에이전트였다는 조사 결과가 공개됐습니다. OpenAI 는 자사 에이전트가 관여한 사실은
인정하면서, 공개된 정보를 가져오는 양성 작업이었다고 설명했습니다. 다만 5월 당시
RubyGems 쪽에 자기들이라고 알리지는 않았습니다. 보도에 따르면 OpenAI 의 에이전트가 외부
인프라에 영향을 주고도 통보하지 않은 사례는 이번이 **세 번째**입니다.

## 받는 쪽이 볼 수 있었던 것

레지스트리가 그날 실제로 본 것은 세 가지뿐입니다. 새로 만들어진 계정, 업로드 속도,
그리고 올라온 파일. 누가 왜 보냈는지는 그 안에 없습니다. 그러면 받는 쪽은 무엇을 할 수
있을까요?

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>에이전트 운영자에서 레지스트리로만 흐르고, 반대 방향 통보는 끊겨 있는 구조</title>

  <rect x="70" y="170" width="190" height="95" rx="16"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="165" y="207" text-anchor="middle" font-size="19"
    style="fill: var(--fg-strong)">에이전트 운영자</text>
  <text x="165" y="236" text-anchor="middle" font-size="15"
    style="fill: var(--fg-neutral)">훈련 런</text>

  <path d="M272 205 H470" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M456 195 L470 205 L456 215" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="371" y="185" text-anchor="middle" font-size="16"
    style="fill: var(--fg-strong)">패키지 2,000여 개</text>

  <rect x="490" y="170" width="200" height="95" rx="16"
    style="fill: var(--diag-teal-fill); stroke: var(--diag-teal-stroke); stroke-width: 2.5" />
  <text x="590" y="207" text-anchor="middle" font-size="19"
    style="fill: var(--fg-strong)">레지스트리</text>
  <text x="590" y="236" text-anchor="middle" font-size="15"
    style="fill: var(--fg-neutral)">계정 · 속도 · 파일</text>

  <path d="M470 252 H400 M342 252 H286"
    style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none"
    stroke-dasharray="8 8" stroke-linecap="round" />
  <path d="M300 242 L286 252 L300 262"
    style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M357 237 L385 267 M385 237 L357 267"
    style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
  <text x="371" y="295" text-anchor="middle" font-size="16"
    style="fill: var(--fg-neutral)">발신자 통보</text>

  <path d="M590 267 V330" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
  <path d="M580 316 L590 330 L600 316" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="490" y="335" width="200" height="72" rx="16"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="590" y="378" text-anchor="middle" font-size="18"
    style="fill: var(--fg-strong)">신규 등록 나흘 중단</text>
</svg>
```

에이전트 트래픽에는 발신자 표시가 없습니다. HTTP 요청 하나하나는 정상이고, 계정도 규칙대로
만들어졌고, 패키지도 형식은 맞습니다. 문제가 되는 건 양과 의도인데 둘 다 받는 쪽에서는
읽히지 않습니다. 그래서 RubyGems 가 고를 수 있는 대응은 문을 닫는 것뿐이었습니다.
<mark>능력을 어디까지 열어 둘지가 아니라, 보낸 쪽이 누구인지를 받는 쪽이 알 수 있느냐가
이 사건의 갈림길이었습니다.</mark>

이 구분은 말장난이 아닙니다. 5월에 벌어진 일 가운데 모델의 능력을 필요로 한 대목은 많지
않습니다. 패키지 2,000개를 올리는 데 새로운 취약점을 발견할 필요는 없거든요. 필요한 것은
계정과 반복뿐입니다. 능력 상한을 낮춘 모델이었어도 같은 일은 그대로 벌어졌을 겁니다.

## 7월 Hugging Face에서도 순서가 같았습니다

두 달 뒤 Hugging Face 에서 벌어진 일은 기술적으로는 훨씬 무거웠습니다.
[사후 정리된 기술 타임라인](https://huggingface.co/blog/agent-intrusion-technical-timeline)을
보면 에이전트가 자체 호스팅 Artifactory 의 알려지지 않은 취약점을 찾아내 샌드박스 밖으로
나갔고, 서버 수십 대에서 코드를 실행했으며 그중 한 대에서는 root 권한까지 얻었습니다.
다만 이 글에서 보려는 건 침해의 깊이가 아니라 **누가 먼저 말했는가**입니다.
두 사건을 같은 항목으로 놓고 보면 순서가 겹칩니다.

| | 5월 RubyGems | 7월 Hugging Face |
|---|---|---|
| 기간 | 5월 5일~12일 | 7월 11일~13일 |
| 한 일 | 패키지 2,000여 개 등록, 빌드 서버에서 코드 실행 | 서버 수십 대에서 코드 실행, 한 대는 root |
| 받은 쪽 대응 | 신규 등록 중단, 패키지 500여 개 회수 | 침입 차단 후 7월 16일 공개 |
| 처음 알린 쪽 | 외부 조사 보도 (9월 12일) | 받은 쪽 공지 (7월 16일) |
| 발신자 확정 | 보도 이후 OpenAI 가 관여 인정 | 7월 21일 공동 성명 |

7월 16일 Hugging Face 의 첫 공지는 공격자를 "미상의 agentic security-research harness"
라고만 적었습니다. 어느 회사의 무엇인지는 닷새 뒤 공동 성명에서야 붙었습니다. 두 번 다
발신자를 확정한 것은 보낸 쪽의 자진 신고가 아니라 받은 쪽의 조사와 외부 보도였습니다.
같은 순서가 두 번 반복되면 그건 사고 대응의 문제가 아니라 **경로가 아예 없다는** 뜻입니다.

## "공개 정보를 모았을 뿐"이라는 반론

OpenAI 의 설명은 다릅니다. 훈련 런 중이었고, 에이전트가 한 일은 공개된 정보를 가져오는
양성 작업이었으며, 익스플로잇 주장은 계속 확인 중이라는 것입니다. 실제로 이번 건에서 긁어
간 자료는 [누구나 검색으로 닿을 수 있는 공개 기록](https://the-decoder.com/openai-agents-launched-a-2000-package-cyberattack-on-rubygems-just-to-collect-data-anyone-could-google/)이었습니다.
침해라는 말이 과하다고 볼 여지가 있습니다.

속도를 조절하자는 쪽의 반론도 있습니다. 9월 12일 Dario Amodei 가
[`We Must Pace the Frontier`](https://darioamodei.com/post/we-must-pace-the-frontier) 를
내놓았고 Sam Altman 과 Elon Musk 가 하루 만에 동의를 밝혔습니다. 이 시각에서 보면 7월
Hugging Face 건은 분명히 능력의 문제입니다. 알려지지 않은 취약점을 스스로 찾아 샌드박스를
빠져나간 것은 성능이 올라갔기 때문에 가능했던 일입니다. 능력을 재고 그 확인이 끝날 때까지
기다리게 하자는 제안은 이 대목을 정확히 겨눕니다.

그래도 결론은 바뀌지 않습니다. 7월 건이 능력의 문제였다는 것과 5월 건이 능력의 문제가
아니었다는 것은 동시에 참입니다. 두 사건에 공통으로 없던 하나만 남는데, 그게 통보입니다.
Amodei 의 제안에서 가장 구체적인 항목인 상주 제3자 평가자도 결국 **회사 안에서 무슨 일이
있었는지 나중에 확인하는 장치**입니다. 그날 문을 닫아야 했던 레지스트리에게 도착하는
것은 아무것도 없습니다. 양성이었다는 판단은 보낸 쪽이 내리는데, 비용은 받는 쪽이 냅니다.

## 에이전트를 밖으로 내보내는 쪽의 몫

프런티어 랩만의 이야기는 아닙니다. 크론에 걸어 둔 수집 스크립트, 문서를 훑는 리서치
에이전트, 배포 파이프라인이 호출하는 외부 API — 내 쪽에서는 작업 한 건이지만 받는 쪽에서는
출처를 알 수 없는 트래픽 급증입니다. 규모만 다를 뿐 구조는 5월의 RubyGems 와 같습니다.

에이전트를 외부로 내보내는 쪽이 먼저 정할 것은 셋입니다. 요청에 신원과 연락처를 붙이는
일, 상대 서비스의 속도 제한을 지키는 일, 그리고 상대가 우리를 막았을 때 누구에게 연락이
가는지를 정해 두는 일. 셋 다 규제가 생기기 전에 각자 정할 수 있습니다.

에이전트가 무엇을 할 수 있느냐를 두고는 앞으로도 오래 다툴 겁니다. 그 논의가 정리되기
전에도 할 수 있는 일은 남아 있습니다. 보낸 쪽이 누구인지 받는 쪽이 알게 하는 것, 그
한 줄이 5월 RubyGems 에는 없었습니다.

## 참고 자료

- [OpenAI Agents Flood RubyGems With 2,000 Packages and Exploit Build System for RCE — CybersecurityNews](https://cybersecuritynews.com/openai-agents-flood-rubygems/)
- [OpenAI Agents Linked to RubyGems Campaign That Gained RCE on RubyDoc Servers — The Hacker News](https://thehackernews.com/2026/09/openai-agents-linked-to-rubygems.html)
- [OpenAI's autonomous AI agents involved in cyberattack on RubyGems — heise online](https://www.heise.de/en/news/OpenAI-s-autonomous-AI-agents-involved-in-cyberattack-on-RubyGems-11451352.html)
- [OpenAI agents launched a 2,000-package cyberattack on RubyGems just to collect data anyone could Google — The Decoder](https://the-decoder.com/openai-agents-launched-a-2000-package-cyberattack-on-rubygems-just-to-collect-data-anyone-could-google/)
- [OpenAI agents attacked RubyGems back in May — Simon Willison](https://simonwillison.net/2026/Sep/12/openai-agents-rubygems/)
- [Anatomy of a Frontier Lab Agent Intrusion: A Technical Timeline of the July 2026 Incident — Hugging Face](https://huggingface.co/blog/agent-intrusion-technical-timeline)
- [The Hugging Face incident and the road ahead — OpenAI](https://openai.com/index/hugging-face-incident-and-the-road-ahead/)
- [We Must Pace the Frontier — Dario Amodei](https://darioamodei.com/post/we-must-pace-the-frontier)
