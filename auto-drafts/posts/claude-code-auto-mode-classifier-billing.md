---
title: auto 모드가 명령마다 부르는 두 번째 모델
slug: claude-code-auto-mode-classifier-billing
tags: [Claude Code, auto 모드, LLM 게이트웨이]
category: insights
---

> Claude Code 2.1.278 부터 auto 모드의 안전 검사가 서버에서 돌고 토큰으로 청구되지 않습니다. 다만 게이트웨이를 끼운 세션은 예전 방식으로 되돌아갑니다. 검사가 어떻게 도는지와 내 세션이 어느 쪽인지 확인하는 방법을 공식 문서 기준으로 정리했습니다.

auto 모드로 두고 작업하다 보면 명령이 실행되기 직전에 한 박자 멈추는 순간이 있습니다. 이 짧은 정지 동안 무슨 일이 일어날까요? 다른 모델 하나가 그 명령을 대신 검토합니다. [공식 문서](https://code.claude.com/docs/en/permission-modes)는 이것을 분류기라고 부릅니다. 사람이 승인하던 판단을 이 모델이 대신한다고 적어 뒀습니다. Enterprise 플랜과 Claude API 계정에서는 이 검토가 별도의 모델 요청으로 나가 토큰 사용량에 잡혔습니다. 9월 19일에 나온 2.1.278 이 그 요청을 세션 요청 안으로 옮겼습니다. 구조를 알아 두면 내 세션에서 검사가 어느 쪽으로 도는지 확인할 수 있습니다. 요금이 그대로 나오는 세션의 원인도 찾을 수 있습니다.

## 내가 고른 모델이 아닌 쪽이 명령을 본다

분류기는 `/model` 에서 고른 모델과 별개로 동작합니다. 기본값은 Claude Sonnet 5 입니다. Anthropic 이 서버에서 지정한 분류기 모델이 있으면 그쪽이 우선합니다. 세션 모델이 Claude Sonnet 4.6 이거나 `availableModels` 가 Sonnet 5 를 빼 두면 세션 모델이 분류기를 맡습니다.

검사 대상도 정해져 있습니다. 읽기와 작업 디렉터리 안의 파일 편집은 분류기를 거치지 않습니다. 셸 명령과 네트워크 작업이 검사를 받습니다. 분류기가 보는 내용은 사용자 메시지와 읽기 조회를 뺀 도구 호출, 그리고 `CLAUDE.md` 입니다. **도구 실행 결과는 요청에서 제거됩니다.** 파일이나 웹 페이지에 심어 둔 문장이 분류기를 직접 흔들지 못하게 하려는 설계입니다.

## 검사 한 번마다 늘어나던 요청 한 번

문서는 비용 구조를 분명하게 적어 뒀습니다. Enterprise 플랜과 Claude API 계정, Claude Platform on AWS, Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry 에서는 분류기 호출이 토큰 사용량에 포함됩니다. 검사 한 번마다 대화 일부와 실행을 기다리는 명령이 함께 실려 나갑니다. 명령이 돌기 전에 왕복이 한 번 더 붙는 구조입니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>명령 하나에 나가는 모델 요청의 수가 2.1.278 에서 둘에서 하나로 줄어든 모습</title>
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" style="fill: var(--fg-neutral)" />
    </marker>
  </defs>
  <text x="60" y="40" style="fill: var(--fg-neutral); font-size: 14px">2.1.277</text>
  <rect x="60" y="92" width="150" height="60" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="135" y="128" text-anchor="middle" style="fill: var(--fg-strong); font-size: 15px">Claude Code</text>
  <rect x="300" y="52" width="180" height="56" rx="14"
    style="fill: var(--diag-yellow-fill); stroke: var(--diag-yellow-stroke); stroke-width: 2.5" />
  <text x="390" y="86" text-anchor="middle" style="fill: var(--fg-strong); font-size: 15px">분류기 요청</text>
  <rect x="300" y="136" width="180" height="56" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="390" y="170" text-anchor="middle" style="fill: var(--fg-strong); font-size: 15px">세션 요청</text>
  <rect x="570" y="92" width="160" height="60" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <text x="650" y="128" text-anchor="middle" style="fill: var(--fg-strong); font-size: 15px">Claude API</text>
  <path d="M218 116 L292 88 M218 128 L292 156 M488 88 L562 112 M488 156 L562 128"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" marker-end="url(#ar)" />
  <text x="60" y="262" style="fill: var(--fg-neutral); font-size: 14px">2.1.278</text>
  <rect x="60" y="300" width="150" height="60" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="135" y="336" text-anchor="middle" style="fill: var(--fg-strong); font-size: 15px">Claude Code</text>
  <rect x="280" y="300" width="260" height="60" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="410" y="336" text-anchor="middle" style="fill: var(--fg-strong); font-size: 15px">세션 요청 (safeguards)</text>
  <rect x="610" y="300" width="130" height="60" rx="14"
    style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <text x="675" y="336" text-anchor="middle" style="fill: var(--fg-strong); font-size: 15px">Claude API</text>
  <path d="M218 330 L272 330 M548 330 L602 330"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" marker-end="url(#ar)" />
</svg>
```

그래서 같은 세션이라도 파일을 읽고 고치기만 하는 구간에서는 검사 요청이 거의 나가지 않습니다. 빌드나 배포처럼 셸 명령이 이어지는 구간에서 사용량이 올라갔습니다.

## 2.1.278 이 검사를 세션 요청 안으로 넣었다

2.1.278 이 바꾼 것은 검사를 누가 수행하느냐입니다. 이제 Claude Code 는 세션의 모델 요청에 검사를 함께 실어 서버에 맡깁니다. 서버가 수행한 검사에는 요금을 매기지 않습니다. 별도로 나가던 분류기 요청이 없어지니 왕복 한 번과 그 토큰이 함께 없어집니다.

기본으로 서버 검사를 요청하는 대상은 Enterprise 플랜과 Claude API 계정, 그리고 Claude Platform on AWS, Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry 입니다. 플랫폼과 리전마다 적용 시점은 다릅니다. Pro·Max·Team 플랜에서는 이 변경을 알리는 공지가 뜨지 않습니다.

## 자격이 없다는 공지가 뜨는 세션

서버 검사가 세션에 닿지 못하면 Claude Code 는 예전처럼 자체 분류기 요청을 보냅니다. 그리고 그렇게 처리할 첫 명령 앞에서 실행을 멈추고 아래 문구를 띄웁니다.

```text
We're changing auto mode to no longer charge for classifier requests in Claude Code. However, this session isn't eligible.
```

공지가 뜨는 조건이 조금 까다롭습니다. 서버 검사가 한 번 실패한 정도로는 뜨지 않습니다. 개별 명령을 서버가 검사하지 못하면 Claude Code 가 그 명령만 자체 요청으로 처리하고 다음 요청에서 다시 서버에 물어봅니다. 남은 세션 내내 서버 검사가 닿지 않는 상태로 굳었을 때만 공지가 올라옵니다. 경로에 게이트웨이나 프록시가 있는 것이 확인되면 공지가 그 이름까지 말해 줍니다.

- **Enter** — 멈춰 있던 명령과 이후 세션이 자체 분류기 요청을 쓰고 예전처럼 청구됩니다. 게이트웨이 이름이 찍힌 공지였다면 그 머신에서 24시간 동안 다시 뜨지 않습니다.
- **Esc·Ctrl+C** — 멈춰 있던 명령을 실행하지 않고 턴을 끝냅니다. 세션은 auto 모드에 그대로 있습니다. 다음 검사 앞에서 공지가 다시 올라옵니다.

`-p` 로 돌리는 비대화형 실행에서는 같은 문구가 stderr 로 나갑니다. `stream-json` 출력에서는 `system` 경고 메시지로 나옵니다. Agent SDK 로 만든 애플리케이션은 메시지 스트림에서 이 경고를 읽을 수 있습니다.

## safeguards 필드를 지우는 게이트웨이

원인은 대부분 Claude Code 와 API 사이에 놓인 LLM 게이트웨이나 프록시입니다. 요청 헤더를 지우거나 고쳐 쓰는 게이트웨이, 모르는 요청 필드를 버리는 게이트웨이, 응답에서 ID 를 다시 쓰거나 스트리밍 이벤트의 키를 떨어뜨리는 게이트웨이가 여기 해당합니다. 그러면 검사 요청이 서버에 닿지 않거나 결과가 세션으로 돌아오지 못합니다.

문서가 이름을 들어 지목한 값은 두 가지입니다. 요청 쪽의 `safeguards` 필드와 응답 쪽의 `safeguard_results` 필드입니다. 게이트웨이 운영자에게 요청할 내용도 이 두 필드입니다. [게이트웨이 호환성 문서](https://code.claude.com/docs/en/llm-gateway-protocol)는 모르는 헤더와 바디 필드를 목록으로 걸러내지 말고 그대로 흘려보내라고 적어 뒀습니다. Claude Code 는 릴리스마다 새 필드를 추가합니다. 오늘 본 목록에 고정해 둔 게이트웨이는 다음 기능이 나오는 날 그 기능을 깨뜨립니다.

같은 문서의 feature pass-through 표를 보면 이번 일이 처음도 아닙니다. 프롬프트 캐시의 `cache_control` 마커를 흘려보내지 않는 게이트웨이는 에러 없이 매 턴 전체 입력을 캐시 미스로 청구합니다. `context_management` 필드를 헤더 없이 넘기면 `400` 이 돌아옵니다. `safeguards` 는 그 목록에 새로 얹힌 값입니다.

## /status 에 붙은 Auto mode server 행

내 세션이 어느 쪽으로 도는지는 `/status` 로 확인합니다. 2.1.278 이 여기에 `Auto mode server` 행을 새로 붙였습니다. 서버 검사가 세션의 명령을 판정하는 동안에는 `Enabled`, 자체 요청으로 되돌아간 뒤에는 `Disabled` 로 읽힙니다.

게이트웨이가 서버 검사를 지원하지 못하는 것이 이미 확실하다면 물어보는 과정을 생략할 수 있습니다.

```bash
export CLAUDE_CODE_AUTO_MODE_SERVER=0
```

이 변수를 설정하면 분류기 요청은 항상 Claude Code 자체 요청이 되고 공지도 뜨지 않습니다. Anthropic API 에 직접 연결한 세션에서는 값을 읽지 않습니다. `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1` 을 켜 둔 채 이 변수를 비워 두면 서버 검사도 함께 꺼집니다. 문서는 이 변수를 임시 설정이라고 밝혀 뒀습니다. 이후 릴리스에서 없어질 수 있으니 설정 파일에 오래 두고 잊을 값은 아닙니다.

## 게이트웨이 점검표가 된 요금 공지

이 공지는 요금 안내처럼 보입니다. 그런데 읽고 나면 남는 정보는 요금이 아닙니다. auto 모드를 켠 세션에서 이 문구를 봤다면 그 경로의 게이트웨이가 Anthropic 요청을 원형 그대로 넘기지 않는다는 뜻입니다. 프롬프트 캐시가 에러 없이 조금씩 비싸지거나, 다음 베타 기능이 `400` 으로 떨어지는 문제와 뿌리가 같습니다.

이 관점에서 보면 개인 터미널과 회사 환경의 차이도 분명해집니다. API 에 직접 붙는 개인 세션은 이 변경으로 검사 비용이 그냥 없어집니다. 게이트웨이를 통과하는 회사 세션은 같은 버전을 써도 분류기 요청 비용을 예전처럼 냅니다. 그 차이를 세션 안에서 알려 주는 표시는 `/status` 한 줄과 처음 한 번 뜨는 공지뿐입니다. 조직에 auto 모드를 푸는 쪽이라면 이 행부터 확인해 두는 편이 좋겠습니다.

## 참고 자료

- [Auto mode classifier request charges — Claude Code Docs](https://code.claude.com/docs/en/auto-mode-classifier-billing)
- [Choose a permission mode — Claude Code Docs](https://code.claude.com/docs/en/permission-modes)
- [Claude Code changelog — Claude Code Docs](https://code.claude.com/docs/en/changelog)
- [Claude Code gateway compatibility guide — Claude Code Docs](https://code.claude.com/docs/en/llm-gateway-protocol)
