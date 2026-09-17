---
title: 내 Claude 세션은 회사가 어디까지 볼 수 있을까요?
slug: claude-compliance-api-session-transcripts
tags: [Claude, Compliance API, 보안]
category: insights
---

> Claude Enterprise 조직은 Compliance API 로 구성원의 Claude Code·Cowork 세션 transcript 를 조회합니다. 9월 18일에는 Chrome 확장에서 나눈 대화까지 그 목록에 붙었습니다. 무엇이 기록되고 무엇이 빠지는지를 공식 문서 기준으로 정리했습니다.

회사 노트북 터미널에서 Claude Code 를 실행하다 보면 이 대화가 어디에 남는지 한 번쯤 궁금해집니다. 내 기기에서 돌아간 세션이니 기록도 내 기기에만 있을까요? 회사 계정으로 로그인했고 그 조직이 Claude Enterprise 라면 그렇지 않습니다. 대화는 Anthropic 서버에 남고 조직의 컴플라이언스 담당자가 Compliance API 로 꺼내 볼 수 있습니다. `GET /v1/compliance/apps/sessions/local/{session_id}/messages` 한 번이면 프롬프트와 응답, 도구 호출과 그 결과 텍스트가 순서대로 돌아옵니다. 어떤 실행 방식이 이 목록에 잡히고 어떤 방식이 빠지는지 알아 두면 개인 작업과 회사 작업을 나누는 기준을 세울 수 있습니다.

## Claude API 에 닿은 요청만 기록된다

[공식 문서](https://platform.claude.com/docs/en/manage-claude/compliance-sessions)는 수집 방식을 분명하게 적어 뒀습니다. 기기에는 아무것도 설치하지 않습니다. 클라이언트가 어차피 Claude API 로 보내는 요청을 Anthropic 이 서버 쪽에서 기록할 뿐입니다. 그 요청 바깥에서 따로 수집하는 것은 없습니다.

그래서 transcript 는 기기에서 벌어진 일을 담지 않습니다. Claude 가 무엇을 요청받고 무엇을 돌려줬는지만 남습니다. 파일 작업이나 네트워크 작업은 도구 호출과 도구 결과에 실린 만큼만 드러납니다. API 에 한 번도 닿지 않은 작업, 예를 들어 세션이 한 번도 읽어서 보내지 않은 로컬 파일은 기록에 없습니다.

감사 범위를 정하는 기준이 여기서 나옵니다. 어느 기기에서 실행했느냐가 아니라 그 요청이 Claude API 에 닿았느냐입니다.

## 9월 18일에 붙은 claude_in_chrome

[9월 18일 릴리스 노트](https://platform.claude.com/docs/en/release-notes/api)는 로컬 세션 엔드포인트가 Claude in Chrome 세션의 transcript 도 돌려준다고 적었습니다. Enterprise 조직 대상 beta 입니다. 응답에서 그 세션을 가리키는 `product_surface` 값은 `claude_in_chrome` 입니다.

문서가 덧붙인 조건이 더 눈에 띕니다. 새 키도, 새 스코프도, 새 설정도, 클라이언트 업데이트도 필요 없습니다. 기존 Compliance Access Key 와 `read:compliance_user_data` 스코프를 그대로 씁니다. 확장 프로그램에 새 버전이 나가서 범위가 넓어진 것이 아니라 서버가 그 요청을 어느 제품의 것으로 분류하기 시작한 것입니다.

지금 로컬 세션으로 잡히는 제품은 다섯 가지입니다. Claude Desktop 의 Cowork(`cowork`), 터미널·데스크톱·IDE 확장의 Claude Code(`claude_code`), Claude Science 데스크톱 앱(`claude_science`), Excel·PowerPoint·Word·Outlook 의 Claude 애드인(`office_agents/...`), 그리고 Chrome 확장의 내장 채팅입니다. 문서는 이 목록이 계속 늘어난다고 적어 뒀습니다. 모르는 `product_surface` 값이 와도 그대로 통과시키는 핸들러를 만들라고 권합니다.

## transcript 에 남는 내용과 빠지는 내용

조회한 transcript 는 캡처된 API 호출을 되살린 결과입니다. 사용자 프롬프트, assistant 텍스트, 도구 호출, 도구 결과의 텍스트 부분이 크기 절단을 빼면 보낸 그대로 돌아옵니다. 반대로 빠지는 것도 정해져 있습니다.

- thinking 블록은 어떤 경우에도 들어가지 않습니다.
- system prompt 는 돌려주지 않고 `[system prompt content not shown]` 마커 한 줄이 대신 들어갑니다.
- 도구 정의와 MCP 서버 설정은 transcript 에 포함되지 않습니다.
- 이미지·PDF 같은 블록은 `[image content not shown]` 형태의 텍스트로 바뀌고 `truncated` 가 `true` 로 표시됩니다.
- 웹 검색 결과나 코드 실행 결과의 비텍스트 항목은 `[N non-text item(s) not shown]` 한 줄로 묶입니다.

남는 쪽에서 한 가지는 눈여겨볼 만합니다. <mark>URL·자격증명·개인정보를 가리는 처리는 없습니다.</mark> 문서도 transcript 를 민감한 데이터로 다루라고 분명하게 적어 뒀습니다. 프로젝트 지시 파일인 `CLAUDE.md` 역시 일반 user 메시지로 들어갑니다. 스킬 내용도 클라이언트가 메시지 본문으로 보내면 다른 사용자 텍스트와 구분되지 않습니다.

## 로컬 세션과 OpenTelemetry 로그의 차이

같은 활동을 보는 방법이 하나 더 있습니다. Cowork 와 Claude Code 는 OpenTelemetry 로그도 내보낼 수 있습니다. 둘을 비교해 보면 아래와 같습니다.

| | 로컬 세션 | 원격 세션 | OpenTelemetry |
|---|---|---|---|
| 전달 | HTTPS 로 조회·내보내기 | HTTPS 로 조회·내보내기 | OTLP 수집기로 전송 |
| 인프라 | Anthropic 보관 | Anthropic 보관 | 직접 운영 |
| ID 접두 | `clls_` | `cse_` | 없음 |
| 보존 | 기본 6년 | 6년 | 조직이 정한 정책 |
| 도구 입력 | 기본 10,000바이트까지 | 기본 10,000바이트까지 | 요약만 |
| 기기 정보 | 없음 | 없음 | 터미널 종류·작업 디렉터리 포함 |
| 토큰·비용 | 없음 | 없음 | 있음 |

대화 내용을 보려면 Compliance API 쪽입니다. 기기 정보와 비용을 보려면 OpenTelemetry 쪽입니다. 한쪽이 다른 쪽을 대신하지 못합니다. 도구 입력과 도구 결과의 10,000바이트 기본 절단은 요청하면 1MiB 선까지 늘릴 수 있습니다.

## 목록에 잡히지 않는 세션들

문서가 적어 둔 예외가 오히려 경계를 또렷하게 만듭니다. 다음 세션은 엔드포인트가 돌려주지 않습니다.

- Claude Console API 키로 인증한 Claude Code 세션
- Amazon Bedrock·Google Cloud·Microsoft Foundry 같은 외부 플랫폼을 거쳐 나간 세션
- 웹에서 실행하는 Claude Code 클라우드 세션
- HIPAA readiness 를 켠 조직의 로컬 세션. 수집 자체가 일어나지 않습니다
- zero data retention 이 적용된 세션. 목록에서 빠지고 개별 조회는 404 를 돌려줍니다

같은 사람이 같은 노트북에서 같은 명령을 내려도 어떻게 인증했고 어디를 거쳐 나갔는지에 따라 기록되기도 하고 빠지기도 합니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>사용자 기기에서 나간 요청이 Claude API 를 거쳐 기록될 때와 외부 플랫폼을 거쳐 기록되지 않을 때</title>
  <rect x="48" y="80" width="176" height="104" rx="14"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" />
  <text x="136" y="118" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 18px">사용자 기기</text>
  <text x="136" y="145" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">Cowork · Claude Code</text>
  <text x="136" y="167" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">Chrome 확장</text>
  <path d="M234 132 H294"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M286 126 L294 132 L286 138"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="308" y="80" width="168" height="104" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="392" y="124" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 18px">Claude API</text>
  <text x="392" y="150" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">닿는 순간 기록</text>
  <path d="M486 132 H546"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M538 126 L546 132 L538 138"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="558" y="80" width="194" height="104" rx="14"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="655" y="124" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 18px">Compliance API</text>
  <text x="655" y="150" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">조직이 조회</text>
  <path d="M136 192 V318 H294"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M286 312 L294 318 L286 324"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="308" y="266" width="168" height="104" rx="14"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5" />
  <text x="392" y="310" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17px">Bedrock · Vertex</text>
  <text x="392" y="336" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15px">Console 키 · ZDR</text>
  <path d="M486 318 H546"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none; stroke-dasharray: 8 8"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="558" y="266" width="194" height="104" rx="14"
    style="fill: none; stroke: var(--fg-neutral); stroke-width: 2.5; stroke-dasharray: 8 8" />
  <text x="655" y="325" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 18px">목록에 없음</text>
</svg>
```

## 보존 기간을 늘려도 돌아오지 않는 기록

캡처된 로컬 세션 내용은 기본 6년 동안 보관됩니다. 조직이 claude.ai 조직 설정에서 유한한 대화 보존 기간을 따로 정해 뒀다면 그 기간이 대신 적용됩니다. 여러 개를 설정해 뒀다면 가장 짧은 기간을 따릅니다.

여기에 한쪽으로만 작동하는 규칙이 하나 있습니다. 보존 기간을 줄이면 엔드포인트는 그 즉시 더 오래된 활동을 돌려주지 않습니다. 반대로 기간을 늘려도 이미 만료된 내용은 되살아나지 않습니다. 메시지마다 캡처될 당시에 적용되던 기간을 그대로 들고 가기 때문입니다.

## 에이전트를 어디서 실행할지 정하는 기준

이 문서를 읽고 나면 조직 정책보다 먼저 정해지는 구분을 하나 알게 됩니다. 회사 계정으로 로그인한 상태에서 Claude 클라이언트를 실행하면 그 대화는 기록 대상입니다. 터미널이든 브라우저 확장이든 Excel 애드인이든 같습니다.

1인 개발자 입장에서 이 관점으로 보면 실무적인 선은 단순해집니다. 회사 계정으로 실행하는 세션에는 개인 자격증명이나 개인 저장소 내용을 넣지 않는 편이 낫습니다. 어차피 지워 달라고 요청할 창구가 transcript 쪽에는 없습니다. 절단 한도를 넘지 않는 한 붙여 넣은 텍스트는 그대로 남습니다.

그리고 9월 18일에 늘어난 한 줄이 남긴 감각도 기억해 둘 만합니다. 감사 범위는 클라이언트를 업데이트하면서 넓어지지 않습니다. 문서의 표에 값이 하나 늘어나면서 넓어집니다.

## 참고 자료

- [Retrieve session transcripts — Claude Docs](https://platform.claude.com/docs/en/manage-claude/compliance-sessions)
- [Claude platform release notes — Claude Docs](https://platform.claude.com/docs/en/release-notes/api)
- [Monitoring usage — Claude Code Docs](https://code.claude.com/docs/en/monitoring-usage)
