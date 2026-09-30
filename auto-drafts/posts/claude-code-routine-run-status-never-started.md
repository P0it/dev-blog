---
title: 시작도 못 한 루틴 실행이 Succeeded 로 표시되던 이유
slug: claude-code-routine-run-status-never-started
tags: [Claude Code, AI 에이전트, 업무 자동화]
category: insights
---

> Claude Code 루틴의 실행 목록에서 초록색 표시는 세션이 인프라 오류 없이 시작해서 끝났다는 뜻입니다. 9월 30일 릴리스가 고친 것은 그 좁은 보장마저 어긋나던 경우입니다. 무인 실행에서 상태 표시가 어디까지를 판정하는지 공식 문서와 릴리스 노트로 확인해 정리했습니다.

아침에 루틴 페이지를 열면 지난 실행이 목록으로 쌓여 있고 그 옆에 상태 표시가 붙어 있습니다. 초록색이 줄지어 있으면 일단 마음이 놓입니다.

그럼 그 초록색은 무엇을 보장할까요? 세션이 인프라 오류 없이 시작해서 끝났다는 것까지입니다. 프롬프트에 적어 둔 작업이 성공했다는 뜻은 아닙니다. [공식 문서](https://code.claude.com/docs/en/routines)가 그렇게 적어 뒀습니다. 네트워크 요청이 차단돼 아무 자료도 받지 못한 실행, 필요한 커넥터 도구가 없어서 손도 못 댄 실행도 이 목록에서는 초록색으로 보입니다.

그리고 9월 30일 공개된 Claude Code v2.1.286 은 그 좁은 보장마저 어긋나던 경우를 고쳤습니다. 클라우드 세션이 **아예 시작되지 않은 실행**까지 Succeeded 로 표시되고 있었습니다. 상태 표시가 판정하는 범위를 알면 무인 파이프라인에서 무엇을 따로 확인해야 하는지 알 수 있습니다.

## v2.1.286 이 Succeeded 에서 Failed 로 옮긴 실행

[릴리스 노트](https://code.claude.com/docs/en/changelog)의 해당 줄은 클라우드 세션이 시작되지 않은 루틴 실행이 Runs 목록과 루틴 페이지, 사이드바에서 Succeeded 로 표시되던 것을 고쳤다고 적었습니다. 이제 그 실행은 Failed 로 표시됩니다.

세 곳을 함께 적어 둔 부분이 눈에 걸립니다. 목록과 루틴 상세 페이지와 사이드바가 같은 값을 읽고 있었으니 화면을 바꿔 봐도 같은 초록색을 보게 됩니다. 실행이 잘못됐다는 신호를 받을 창구가 하나도 없었다는 뜻입니다.

같은 릴리스가 루틴 페이지의 시각 표시도 함께 바꿨습니다. 예정 시각이 지났는데 아직 시작하지 않은 실행이라면 그전에는 이미 지나간 시각을 다음 실행 시각으로 그대로 보여 줬습니다. 이제는 예정 시각과 함께 **Due** 로 읽힙니다. 두 항목 모두 고친 대상은 실행 자체가 아닙니다. 실행을 보여 주는 화면입니다.

## 공식 문서가 적어 둔 초록색의 뜻

루틴 문서는 실행 목록의 상태를 설명할 때 그 경계를 분명히 적어 뒀습니다.

> 실행 목록의 초록색 상태는 세션이 인프라 오류 없이 시작해서 끝났다는 뜻입니다. 프롬프트에 적은 작업이 성공했다는 뜻은 아닙니다. 실행을 열어 트랜스크립트를 읽고 Claude 가 실제로 무엇을 했는지 확인하세요.

이어서 트랜스크립트에만 나타나는 것을 세 가지로 꼽았습니다. 차단된 네트워크 요청, 없는 커넥터 도구, 작업 수준의 실패입니다. 루틴의 기본 환경은 **Trusted** 네트워크 접근이라 기본 허용 목록 밖의 호스트는 `403` 과 `x-deny-reason: host_not_allowed` 로 막히거든요. 이 실패도 상태 표시에는 올라오지 않습니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>루틴 실행의 네 단계와 상태 표시가 판정하는 범위</title>
  <path d="M390 132 V120 M390 120 H530 M530 120 V132"
    style="stroke: var(--diag-red-stroke); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="460" y="102" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 16px">트랜스크립트에만 남는 결과</text>
  <rect x="60" y="150" width="130" height="70" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="225" y="150" width="130" height="70" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="390" y="150" width="140" height="70" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <rect x="565" y="150" width="130" height="70" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="125" y="192" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">트리거</text>
  <text x="290" y="192" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">세션 생성</text>
  <text x="460" y="192" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">프롬프트 실행</text>
  <text x="630" y="192" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">세션 종료</text>
  <path d="M200 185 H213 M206 179 L213 185 L206 191"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M365 185 H378 M371 179 L378 185 L371 191"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M540 185 H553 M546 179 L553 185 L546 191"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M225 250 V238 M225 250 H695 M695 250 V238"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <text x="460" y="282" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">상태 표시가 판정하는 범위</text>
</svg>
```

루틴은 아직 research preview 입니다. 문서 맨 위에 동작과 한도, API 표면이 바뀔 수 있다고 적혀 있습니다. 표시가 보장하는 범위를 좁게 읽어야 할 이유가 하나 더 있습니다.

## fire 엔드포인트가 200 을 돌려주는 시점

일정 말고 HTTP 요청으로 실행을 시작할 때도 같은 구분이 필요합니다. 루틴에는 API 트리거를 붙일 수 있습니다. 루틴마다 발급되는 토큰으로 `POST https://api.anthropic.com/v1/claude_code/routines/{routine_id}/fire` 를 부르면 새 실행이 시작됩니다. 응답으로는 세션 ID 와 URL 이 돌아옵니다.

[API 문서](https://platform.claude.com/docs/en/api/claude-code/routines-fire)는 요청이 세션이 생성되면 돌아온다고 적었습니다. 세션 출력을 스트리밍하지도 않고 세션이 끝날 때까지 기다리지도 않습니다. CI 파이프라인이나 알림 도구가 `200` 을 받았다면 그건 세션이 만들어졌다는 확인입니다. 작업이 끝났다는 확인은 아닙니다.

멱등 키가 없다는 점도 문서에 그대로 적혀 있습니다. 성공한 요청마다 새 세션이 생기므로 웹훅 호출자가 응답을 못 받고 재시도하면 세션이 여러 개 만들어집니다. 알림 도구가 자동 재시도를 켜 둔 구성이라면 같은 알림으로 실행이 세 번 도는 일이 생깁니다. 반대로 루틴을 일시정지해 둔 상태에서 부르면 `400 invalid_request_error` 가 돌아오니 꺼 둔 루틴을 호출하는 실수는 응답에서 바로 잡힙니다.

## 실패 종류별로 목록에 남는 표시

무엇이 어긋났을 때 실행 목록에 어떻게 보이는지 견주면 아래와 같습니다.

| | 실행 목록에서 보이는 모습 | 확인할 곳 |
|---|---|---|
| 클라우드 세션이 시작되지 않음 | v2.1.286 부터 Failed, 그전에는 Succeeded | CLI 버전과 릴리스 노트 |
| 네트워크 요청이 차단됨 | 초록색 | 세션 트랜스크립트 |
| 커넥터 도구가 없음 | 초록색 | 세션 트랜스크립트 |
| 프롬프트의 작업이 실패 | 초록색 | 세션 트랜스크립트 |
| 시간당 한도 초과 | 실행이 한도 재설정까지 대기 | 루틴 페이지의 예정 시각 |
| GitHub 연결 만료 | 최대 72시간 동안 실행을 건너뜀 | GitHub 연결 상태 |
| 구독 사용량 한도 도달 | 추가 실행이 거절됨 | `claude.ai/settings/usage` |

아래쪽 세 줄은 실행이 목록에 아예 나타나지 않는 경우입니다. 예약 실행은 계정당 시간에 100개까지이고 한도를 넘으면 그 실행은 한도가 재설정될 때까지 기다립니다. GitHub 연결이 없거나 만료된 상태로 실행 시각이 오면 루틴은 최대 72시간 동안 실행을 건너뜁니다. 그 안에 다시 연결하면 스스로 재개합니다. 72시간이 지나면 루틴 자체가 꺼지고 사람이 다시 켜야 합니다.

정시에 걸어 둔 일정이라면 시작 시각도 미리 감안할 필요가 있습니다. 문서는 9:00 처럼 정시에 예약하면 몇 분 늦게 시작할 수 있으니 9:07 처럼 몇 분 지난 시각을 고르라고 권합니다.

실행 로그를 사람이 일일이 열기 번거로울 때는 CLI 에 물어보는 방법이 있습니다. `/schedule why did my nightly review do nothing this morning?` 처럼 적으면 최근 실행을 상태와 링크로 나열한 뒤 로그를 읽어 도구 오류와 권한 거부, 최종 결과까지 설명합니다. Claude Code v2.1.227 이상에서 동작합니다.

## 무인 실행에서 확인할 것

이렇게 보면 상태 표시는 인프라 계층의 신호입니다. 세션이 시작됐는지, 오류 없이 끝났는지를 말해 줍니다. 작업 계층의 신호는 우리가 따로 만들어야 합니다.

- **산출물을 기준으로 확인합니다.** 커밋이나 PR, 파일처럼 실행이 남겨야 하는 결과가 실제로 생겼는지를 봅니다. 실행 목록과 달리 산출물은 없으면 없는 대로 보입니다.
- **프롬프트에 성공 기준을 적습니다.** 루틴 문서도 프롬프트가 가장 중요한 부분이라고 적었습니다. 자체적으로 완결되고 무엇을 할지와 성공이 무엇인지 명시해야 한다는 것입니다.
- **커넥터와 네트워크 범위를 미리 줄입니다.** 루틴을 만들면 연결된 커넥터가 모두 기본 포함되고 실행 중에는 쓰기 도구까지 승인 없이 쓸 수 있습니다. 필요 없는 것을 빼면 실패할 수 있는 곳도 함께 줄어듭니다.

무인 자동화를 붙일 때 사람이 가장 보고 싶은 화면은 실행 목록입니다. 한눈에 들어오고 확인하는 데 몇 초면 됩니다. 그런데 그 화면이 판정하는 범위는 처음부터 좁게 정해져 있었습니다. 9월 30일까지는 그 좁은 범위보다도 넓게 초록색을 칠하고 있었습니다. 이 관점에서 보면 무인 파이프라인의 신뢰 경계는 실행 목록이 아니라 그 파이프라인이 남기는 산출물에 두는 편이 맞습니다.
