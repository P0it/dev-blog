---
title: 프롬프트 캐시가 깨지면 토큰 값 50배, Claude Code 2.1.265가 고친 건 비용이었다
slug: prompt-cache-prefix-claude-code-cost
tags: [프롬프트 캐싱, AI 에이전트]
category: insights
---

> Claude Code가 9월 1일부터 8일까지 낸 릴리스 노트 327건 가운데 15건이 프롬프트 캐시가 깨지던 자리를 고친 항목입니다. 에이전트 파이프라인의 값은 모델 단가표가 정하지 않습니다. 요청 프리픽스가 어제와 같은지가 정합니다.

## 캐시 항목은 프리픽스 해시 한 덩어리다

[Anthropic의 프롬프트 캐싱 문서](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)는 캐시 프리픽스가 `tools` → `system` → `messages` 순서로 만들어진다고 적어 뒀습니다. 뒤 단계는 앞 단계 위에 쌓입니다. 그래서 한 층이 바뀌면 그 층과 그 뒤 층이 함께 무효가 됩니다. tool 정의를 한 줄 고치면 `system`도 `messages`도 같이 날아갑니다.

캐시 쓰기는 `cache_control`을 붙인 그 지점에서만 일어납니다. 문서는 그 지점까지의 프리픽스를 **누적 해시**로 만들어 항목 하나를 쓴다고 설명합니다. 누적이라는 말이 전부죠. 그 지점 앞의 블록이 하나라도 달라지면 다음 요청의 해시는 다른 값이 되고, 캐시는 없는 것과 같아집니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>tools에서 system으로 한 층이 바뀌면 그 뒤 층까지 함께 무효가 되는 모습</title>
  <rect x="55" y="175" width="185" height="105" rx="16"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="147" y="234" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 26px">tools</text>
  <path d="M250 227 H288" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M278 219 L288 227 L278 235" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="298" y="175" width="185" height="105" rx="16"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="390" y="234" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 26px">system</text>
  <path d="M493 227 H531" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M521 219 L531 227 L521 235" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="541" y="175" width="200" height="105" rx="16"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="641" y="234" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 26px">messages</text>
  <path d="M390 135 V163" style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="390" y="120" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 22px">한 줄 변경</text>
  <path d="M298 305 V325 H741 V305" style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="519" y="360" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 22px">여기까지 함께 무효</text>
</svg>
```

## Fable 5.1의 $0.25와 $12.50

같은 문서의 가격표를 보면 Claude Fable 5.1은 100만 토큰당 기본 입력이 $10, 5분짜리 캐시 쓰기가 $12.50, 캐시 적중이 $0.25입니다. <mark>같은 토큰을 읽으면 $0.25, 다시 쓰면 $12.50 — 50배입니다.</mark>

Fable 5.1과 Mythos 5.1은 캐시 적중 단가가 기본 입력의 0.025배까지 내려갔습니다. 다른 모델은 여전히 0.1배입니다. 읽기 단가가 내려간 건 반가운 변화지만, 놓쳤을 때 물어야 하는 배수는 그만큼 커집니다. 0.1배 시절의 미스 한 번은 12.5배였고, 지금은 50배입니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>캐시 적중 100만 토큰당 0.25달러와 5분 캐시 쓰기 12.50달러의 길이 비교</title>
  <text x="60" y="120" style="fill: var(--fg-neutral); font-size: 22px">캐시 적중</text>
  <rect x="60" y="140" width="12" height="58" rx="4"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="92" y="179" style="fill: var(--fg-strong); font-size: 26px">$0.25</text>
  <text x="60" y="272" style="fill: var(--fg-neutral); font-size: 22px">5분 캐시 쓰기</text>
  <rect x="60" y="292" width="600" height="58" rx="4"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="680" y="331" style="fill: var(--fg-strong); font-size: 26px">$12.50</text>
  <path d="M672 140 V198" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="694" y="179" style="fill: var(--fg-strong); font-size: 30px">50×</text>
  <text x="60" y="410" style="fill: var(--fg-neutral); font-size: 20px">Claude Fable 5.1 · 100만 토큰 기준</text>
</svg>
```

## 9월 1~8일 릴리스 노트에서 깨져 있던 것

[Claude Code 릴리스 노트](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)를 9월 1일부터 8일까지 세어 봤습니다. 항목 327건 중 15건이 프롬프트 캐시나 요청 프리픽스를 다룹니다. 이 기간 릴리스는 다섯 개인데, 다섯 개 모두에 캐시 항목이 들어 있습니다.

9월 8일 19시 5분(UTC)에 올라온 2.1.265에는 둘이 들어 있습니다. 앞에서 실행한 subagent를 재개하면 그 subagent의 tool 목록과 system 프롬프트 앞부분이 바뀌던 문제, 그리고 agent teammate와 재개된 subagent가 `SubagentStart` 훅 컨텍스트와 미리 읽어 둔 스킬을 뒷턴에서 프리픽스 밖으로 밀어내던 문제입니다. 두 항목 모두 "프롬프트 캐시 재사용이 깨졌다"는 말로 끝납니다.

나머지도 결이 같습니다. Remote Control이 세션 중간에 붙으면 Bash tool 정의를 다시 보냈고, advisor 모델을 켜 둔 세션은 compaction이나 `/recap` 같은 배경 요청에서 대화 전체를 캐시 없이 다시 태웠습니다. 스크린샷이 많은 긴 세션은 이미지가 요청 크기 상한을 넘는 순간부터 매 턴 미스가 났습니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>첫 턴과 뒷턴에서 스킬과 훅 블록의 자리가 바뀌어 프리픽스 해시가 달라지는 모습</title>
  <text x="55" y="95" style="fill: var(--fg-neutral); font-size: 22px">첫 턴</text>
  <rect x="55" y="112" width="118" height="62" rx="12"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="114" y="150" text-anchor="middle" style="fill: var(--fg-strong); font-size: 21px">스킬</text>
  <rect x="185" y="112" width="118" height="62" rx="12"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="244" y="150" text-anchor="middle" style="fill: var(--fg-strong); font-size: 21px">훅</text>
  <rect x="315" y="112" width="150" height="62" rx="12"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="390" y="150" text-anchor="middle" style="fill: var(--fg-strong); font-size: 21px">메시지</text>
  <path d="M478 143 H520" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M510 135 L520 143 L510 151" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="532" y="112" width="215" height="62" rx="12"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="639" y="150" text-anchor="middle" style="fill: var(--fg-strong); font-size: 21px">해시 A · 적중</text>
  <text x="55" y="285" style="fill: var(--fg-neutral); font-size: 22px">뒷턴</text>
  <rect x="55" y="302" width="150" height="62" rx="12"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="130" y="340" text-anchor="middle" style="fill: var(--fg-strong); font-size: 21px">메시지</text>
  <rect x="217" y="302" width="118" height="62" rx="12"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="276" y="340" text-anchor="middle" style="fill: var(--fg-strong); font-size: 21px">스킬</text>
  <rect x="347" y="302" width="118" height="62" rx="12"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="406" y="340" text-anchor="middle" style="fill: var(--fg-strong); font-size: 21px">훅</text>
  <path d="M478 333 H520" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M510 325 L520 333 L510 341" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="532" y="302" width="215" height="62" rx="12"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="639" y="340" text-anchor="middle" style="fill: var(--fg-strong); font-size: 21px">해시 B · 미스</text>
</svg>
```

이 항목들은 **어느 것도 사용자가 한 일이 아닙니다**. 훅 컨텍스트를 어느 자리에 넣을지, 스킬 선언을 첫 턴에만 보낼지 매 턴 보낼지, 재개한 세션의 tool 목록을 어떻게 복원할지는 전부 하네스가 정합니다. 프롬프트를 한 글자도 안 바꿔도 청구서는 달라지죠.

## 자동 캐싱이 알아서 맞춘다는 반론

문서가 권하는 기본값은 자동 캐싱입니다. 요청 맨 위에 `cache_control`을 하나 두면 캐시 지점이 마지막 캐시 가능 블록으로 알아서 옮겨 가고, 대화가 길어져도 따로 손댈 게 없습니다. 읽기 쪽도 받쳐 줍니다. 지점에서 해시가 안 맞으면 시스템이 한 블록씩 뒤로 짚어 가며 이전에 쓰인 항목을 찾습니다.

그러니 프리픽스를 손으로 관리하던 시절 이야기 아니냐고 물을 만합니다. 절반은 맞습니다. 다만 되짚는 범위가 **20블록**으로 잘려 있습니다. 그 안에서 못 찾으면 거기서 멈춥니다. 그리고 이 장치가 찾는 건 어디까지나 **이전 요청이 실제로 써 둔 항목**입니다. 안정된 내용을 알아서 골라 캐시해 주는 게 아닙니다. 스킬 선언 뭉치가 프리픽스 앞쪽에서 통째로 자리를 옮기면 20블록 안에 답이 없습니다.

무엇보다 위에 적은 15건은 자동 캐싱을 켠 상태에서 난 문제들입니다. 자동이 막아 주는 건 사람의 실수이지, 하네스가 프리픽스를 바꾸는 일이 아닙니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>breakpoint에서 뒤로 20블록까지만 되짚어 이전에 쓰인 캐시 항목을 찾는 범위</title>
  <rect x="60" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <rect x="102" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <rect x="144" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <path d="M196 172 V290" stroke-dasharray="8 8"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="214" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="256" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="298" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="340" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="382" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="424" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="466" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="508" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="550" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="592" y="196" width="34" height="70" rx="8"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="676" y="186" width="64" height="90" rx="12"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="708" y="160" text-anchor="middle" style="fill: var(--fg-strong); font-size: 21px">breakpoint</text>
  <path d="M666 320 H214" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M224 312 L214 320 L224 328" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="440" y="358" text-anchor="middle" style="fill: var(--fg-strong); font-size: 22px">뒤로 20블록까지</text>
  <text x="127" y="358" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 20px">범위 밖</text>
</svg>
```

## 오늘 볼 계기판

에이전트 파이프라인의 단가는 모델 가격표가 아니라 **어제와 같은 프리픽스로 요청이 나가는가**로 정해집니다. 그리고 그 프리픽스를 바꾸는 쪽은 대개 프롬프트 바깥, 하네스입니다.

먼저 재 봐야 합니다. 2.1.260부터 `/cost`와 상태 표시줄의 `prompt_cache` 항목이 캐시 미스의 짐작 가는 원인을 함께 띄웁니다. tool 정의나 system 프롬프트가 바뀌었다든지, TTL이 지나도록 놀았다든지 하는 것들입니다. 2.1.261에 들어온 `/skill-doctor`는 안 쓰이는 스킬과 그 스킬이 컨텍스트에서 차지하는 값을 보여 줍니다.

계기판이 이번 주에 붙었다는 건 여기가 그동안 사람이 볼 수 없던 층이었다는 뜻입니다. 그전까지 새는 곳을 알려 주는 건 청구서뿐이었으니까요. 매일 같은 작업을 돌리는 파이프라인이라면 이 두 숫자가 며칠 사이에 어떻게 움직였는지부터 보면 됩니다. 스킬을 하나 더 붙일지 말지가 성능 판단이 아니라 단가 판단이 되는 지점이 거기입니다. 🧾

## 참고 자료

- [Prompt caching — Claude Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Claude Code CHANGELOG — anthropics/claude-code](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- [`@anthropic-ai/claude-code` 배포 시각 — npm registry](https://registry.npmjs.org/@anthropic-ai/claude-code)
