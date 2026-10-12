---
title: 에이전트 허용 도메인에 와일드카드가 필요할까요?
slug: agent-allowed-domains-wildcard
tags: [AI 에이전트, 에이전트 보안, Claude Code]
category: insights
cover_image: REHOST:https://www-cdn.anthropic.com/images/4zrzovbb/website/0d1c612947c798aef48e6ab4beb7e8544da9d41a-4096x2305.png
---

> 에이전트에 웹을 열어 줄 때 적는 허용 도메인 목록은 Claude Managed Agents 의 도구 설정과 환경 설정, Claude Code 샌드박스까지 세 곳에 각각 있고 와일드카드 규칙이 서로 다릅니다. 같은 도메인 한 줄이 세 곳에서 어떻게 읽히는지와 어느 거절이 어느 목록에서 나오는지를 공식 문서에 적힌 범위로 정리했습니다.

에이전트에 웹 검색을 붙여 두고 허용 도메인에 `example.com` 한 줄을 적어 본 적이 있으실 겁니다. 이제 그 사이트는 열렸다고 생각하며 넘어갑니다. 그런데 서브도메인까지 열린 걸까요, 아니면 와일드카드를 따로 적어야 할까요? **어느 목록에 적었느냐에 따라 다릅니다.** 도구 쪽 목록에 적은 `example.com` 은 `docs.example.com` 까지 덮지만 환경 쪽 목록에 적은 같은 한 줄은 `example.com` 하나만 맞습니다. 그리고 도구 쪽에서는 `*.example.com` 을 적으면 거절당합니다. 세 목록이 어떤 규칙으로 읽히는지 알면 세션이 400 으로 거절될 때 어느 줄을 고쳐야 하는지 알게 됩니다.

## 도구 설정의 allowed_domains 가 덮는 범위

Claude Managed Agents 에서 `web_search` 와 `web_fetch` 에는 각각 도메인 목록을 걸 수 있습니다. `allowed_domains` 를 적으면 그 호스트만 닿고 `blocked_domains` 를 적으면 그 호스트에만 못 닿습니다. 한 항목에 둘을 같이 적을 수는 없습니다.

여기서 적은 도메인은 **그 호스트와 모든 서브도메인**을 덮습니다. `example.com` 을 적으면 `docs.example.com` 도 포함됩니다. 반대 방향은 성립하지 않습니다. `docs.example.com` 을 적어도 `example.com` 이나 `api.example.com` 은 포함되지 않습니다. `www.` 도 다른 서브도메인과 같아서 `www.example.com` 은 `example.com` 을 덮지 못합니다. 두 쪽을 다 열려면 맨 도메인을 적습니다.

그래서 이 목록에서는 **와일드카드를 쓸 수 없습니다.** `*.example.com` 을 적으면 요청이 거절되고 `example.com` 으로 쓰라는 안내가 돌아옵니다. scheme 과 port, `web_fetch` 쪽의 path, IP 주소, `com` 같은 맨 최상위 도메인도 같이 거절됩니다. `localhost` 와 `.local`·`.internal`·`.localdomain`·`.invalid` 로 끝나는 호스트도 받지 않습니다. 목록 하나에는 도메인 1개에서 64개까지 들어가고 각 도메인은 255자까지입니다.

## 환경 설정의 allowed_hosts 가 맞추는 호스트 하나

환경 쪽은 규칙이 반대입니다. `limited` 네트워킹을 쓰는 클라우드 환경에서 `allowed_hosts` 에 적은 **맨 호스트명은 그 호스트 하나만** 맞습니다. `example.com` 은 `www.example.com` 과 맞지 않습니다. 서브도메인을 열려면 `*.example.com` 을 적어야 하고 이 형태는 모든 서브도메인과 맞지만 `example.com` 자신은 맞지 않습니다.

이 목록이 덮는 범위도 도구 쪽보다 넓습니다. `allowed_hosts` 는 샌드박스의 외부 연결만 제한하지 않습니다. `web_search` 와 `web_fetch` 에까지 적용됩니다. 두 도구는 샌드박스 안이 아닌 Anthropic 서버에서 실행되는데도 그렇습니다. 그래서 `allowed_hosts` 에 아무 호스트도 없으면 `web_fetch` 는 어떤 페이지도 받지 못하고 `web_search` 는 어떤 결과도 돌려주지 않습니다. `allow_package_managers` 와 `allow_mcp_servers` 를 켜도 이 두 도구에는 호스트가 더해지지 않습니다. 반대로 두 도구를 위해 추가한 호스트는 샌드박스에도 함께 열립니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>샌드박스의 셸 명령과 Anthropic 서버의 웹 도구가 각각 통과하는 허용 목록</title>
  <rect x="40" y="88" width="200" height="84" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="140" y="123" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 15px">샌드박스</text>
  <text x="140" y="146" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 13px">bash 셸 명령</text>

  <rect x="40" y="268" width="200" height="84" rx="14"
    style="fill: var(--diag-teal-fill); stroke: var(--diag-teal-stroke); stroke-width: 2.5" />
  <text x="140" y="303" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 15px">Anthropic 서버</text>
  <text x="140" y="326" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 13px">web_search · web_fetch</text>

  <rect x="310" y="96" width="170" height="68" rx="12"
    style="fill: none; stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="395" y="136" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 14px">allowed_hosts</text>

  <rect x="310" y="276" width="170" height="68" rx="12"
    style="fill: none; stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="395" y="316" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 14px">allowed_hosts</text>

  <rect x="520" y="276" width="170" height="68" rx="12"
    style="fill: none; stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="605" y="316" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 14px">allowed_domains</text>

  <path d="M250 130 H300" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
  <path d="M250 310 H300" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
  <path d="M490 310 H510" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" />
  <path d="M490 130 H600 V200" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M700 310 H740 V240" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <text x="600" y="228" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 13px">외부 호스트</text>
  <text x="740" y="228" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 13px">외부 호스트</text>
</svg>
```

## 세션 생성이 400 으로 떨어지는 조합

두 목록이 겹치는 곳에서 요청이 거절됩니다. `limited` 네트워킹 환경에서는 세션을 만들 때 웹 도구의 `allowed_domains` 항목이 환경의 `allowed_hosts` 안에 들어 있는지 검사합니다. 하나라도 밖에 있으면 세션 생성이 400 으로 실패하고 그런 항목을 추가하는 세션 수정도 같이 실패합니다.

여기서 앞의 두 규칙 차이가 그대로 문제가 됩니다. 공식 문서가 든 예가 분명합니다. 도구에 적은 `docs.example.com` 은 `allowed_hosts` 가 `["example.com"]` 일 때 그 안에 없습니다. `allowed_hosts` 쪽은 맨 호스트명을 정확히 하나로만 맞추기 때문입니다. 같은 항목이 `["docs.example.com"]` 이나 `["*.example.com"]` 일 때는 안에 있습니다. 고치는 방법은 두 가지가 있습니다. `allowed_hosts` 에 그 호스트를 추가하거나 `allowed_domains` 에서 그 항목을 빼는 것입니다.

서브에이전트에 일을 넘기면 목록이 더 겹칩니다. 호출된 에이전트에는 자기 목록과 자기를 호출한 에이전트의 목록, 그리고 세션을 돌리는 에이전트의 현재 목록이 함께 걸립니다. `allowed_domains` 는 **모든 목록이 덮는 호스트만** 통과하고 `blocked_domains` 는 서로 더해집니다. 그래서 호출된 에이전트는 범위를 좁힐 수만 있고 넓힐 수는 없습니다. 교집합이 비면 도구는 그대로 남아 있는데 모든 호출이 실패합니다.

## Claude Code 샌드박스의 network.allowedDomains

내 기계에서 돌리는 Claude Code 에도 같은 종류의 목록이 있습니다. 샌드박스 안의 셸 명령은 네트워크로 나가는 직접 연결이 없고 Anthropic 이 기계 위에 띄운 프록시를 지나갑니다. 프록시가 연결마다 호스트명을 `network.allowedDomains` 와 `network.deniedDomains` 에 대조합니다. 포트를 적지 않은 항목은 그 호스트의 모든 포트를 엽니다.

![Claude Code 의 샌드박싱 구조에서 파일시스템 제한과 네트워크 제한이 나뉘어 적용되는 모습](REHOST:https://www-cdn.anthropic.com/images/4zrzovbb/website/0d1c612947c798aef48e6ab4beb7e8544da9d41a-4096x2305.png)

이 목록은 처음에 비어 있습니다. 명령이 새 도메인을 처음 필요로 하면 Claude Code 가 승인을 묻고 승인하면 그 세션 동안 열립니다. `strictAllowlist` 를 켜면 묻지 않고 목록 밖의 호스트를 막습니다. 와일드카드는 `WebFetch(domain:...)` 규칙에서 맨 앞의 `*.` 과 맨 `*` 두 형태를 받습니다. `example.*` 처럼 다른 위치에 넣은 와일드카드는 WebFetch 호출에는 걸리지만 샌드박스 명령에는 효력이 없습니다.

세 목록을 같은 항목으로 비교해 보면 아래와 같습니다.

| | 도구 `allowed_domains` | 환경 `allowed_hosts` | 샌드박스 `network.allowedDomains` |
|---|---|---|---|
| 적용 대상 | `web_search`·`web_fetch` | 샌드박스와 두 웹 도구 | 샌드박스의 셸 명령 |
| `example.com` 한 줄 | 서브도메인까지 덮는다 | 그 호스트 하나만 맞는다 | 그 호스트를 맞춘다 |
| `*.example.com` | 거절된다 | 서브도메인 전체, apex 제외 | 받는다 |
| 비어 있을 때 | 제한이 없다 | 웹 도구가 아무것도 못 받는다 | 첫 요청에서 승인을 묻는다 |
| 막혔을 때 | 생성 400 또는 `url_not_allowed` | `url_not_allowed`, 샌드박스는 403 | 승인 프롬프트 또는 차단 |

## 호스트가 맞아도 막히는 요청

목록을 맞게 적었는데도 연결이 안 되는 경우가 있습니다. Claude Code 샌드박스에서는 프록시 환경변수를 읽는 도구만 통과합니다. `curl` 과 `npm`, HTTPS 로 붙는 `git` 은 호스트가 열리면 연결됩니다. 반면 `ssh` 와 대부분의 데이터베이스 드라이버는 그 환경변수를 읽지 않아서 허용된 호스트에도 붙지 못합니다. TCP 가 아닌 트래픽은 아예 나가지 못합니다. UDP 와 QUIC 위의 HTTP/3, `ping` 같은 ICMP 도구가 여기 해당합니다.

Managed Agents 쪽에는 목록과 별개인 조건이 하나 더 있습니다. 2026년 10월 7일부터 `web_fetch` 는 **세션에 이미 등장한 URL 만** 가져옵니다. 사용자 메시지 본문에 있던 URL, `web_search` 결과로 돌아온 URL, 앞선 `web_fetch` 가 받아 온 페이지 안의 URL 이 여기 들어갑니다. 모델이 자기 출력으로 만든 URL 과 에이전트의 시스템 프롬프트, 첨부 문서, `bash`·`read` 같은 도구 출력에만 있는 URL 은 포함되지 않습니다. 그런 URL 로 `web_fetch` 를 부르면 `url_not_in_prior_context` 가 돌아옵니다. 공식 설명은 데이터 유출 위험을 줄이기 위한 것이라고 적었습니다. 에이전트에 URL 을 넘기려면 `user.message` 본문에 담아 보내야 합니다.

그래서 거절의 종류를 에러로 가릴 수 있습니다. 세션을 만들 때 떨어지는 400 은 두 목록의 조합이 맞지 않는 것이고 런타임의 `url_not_allowed` 는 호스트가 목록에 없는 것이며 `url_not_in_prior_context` 는 호스트와 무관하게 URL 의 출처가 조건에 맞지 않는 것입니다. 샌드박스에서 80·443 요청이 거절될 때는 막힌 호스트 이름을 담은 403 이 돌아옵니다.

## 호스트 단위 허용이 남기는 유출 경로

Managed Agents 문서는 이 구조의 한계를 직접 경고로 적어 뒀습니다. 네트워크 접근은 **호스트 단위로 열리고 동작 단위로는 열리지 않습니다.** 허용된 호스트라면 샌드박스는 그 호스트로 어떤 요청이든 보낼 수 있고 여기에는 `git push` 나 패키지 배포 같은 업로드도 들어갑니다. 명령이 건네는 자격증명이 무엇이든 함께 나갑니다. 에이전트가 저장소 파일이나 받아 온 웹 문서, 외부 도구 출력처럼 신뢰할 수 없는 입력을 처리하는 중이라면 프롬프트 인젝션이 성공했을 때 허용된 호스트로 파일이 빠져나갈 수 있습니다.

문서가 제시하는 완화책은 목록을 좁히는 쪽이 아닙니다. `bash` 도구의 permission policy 를 `always_ask` 나 `auto` 로 두는 것이고 환경이 `packages` 를 쓰지 않는다면 `allow_package_managers` 를 끈 채 필요한 호스트만 적는 것입니다. 호스트를 열어 주는 결정과 그 호스트에서 무엇을 할 수 있는지를 따로 관리해야 한다는 뜻입니다.

![Claude Code 가 git 명령을 프록시로 보내 토큰과 브랜치 이름, 저장소 대상을 검사하는 구조](REHOST:https://www-cdn.anthropic.com/images/4zrzovbb/website/e8f66bcf73d9d23cae67e67776b2d31373c13050-4096x2305.png)

Claude Code 의 웹 세션이 git 을 다루는 방식이 그 구분을 보여 주는 예입니다. 자격증명은 샌드박스 밖에 두고 전용 프록시가 범위를 좁힌 자격증명과 git 동작을 함께 검사합니다. 설정된 브랜치로만 push 하는지까지 확인한 다음 실제 토큰을 붙여 GitHub 로 넘깁니다. 호스트를 여는 것으로 끝내지 않고 동작까지 검사하는 구조입니다.

## 목록을 좁히면 같이 줄어드는 것

허용 목록을 좁히는 작업은 안전을 올리는 대신 에이전트가 할 수 있는 일을 같이 줄입니다. `allowed_hosts` 가 웹 도구에까지 적용된다는 조항이 그 점을 분명하게 만듭니다. 조사를 맡긴 에이전트에게 열어 준 호스트가 적으면 검색 결과부터 그만큼 줄어들고 에이전트는 자기가 무엇을 못 봤는지 알지 못한 채로 결론을 냅니다. 사람이 보지 않는 파이프라인에서는 이 차이가 에러 없이 품질 저하로만 남고 어디에도 표시가 나지 않습니다.

이 블로그의 매일 아침 원고를 쓰는 클라우드 세션도 같은 구조 안에서 돌아갑니다. 그래서 목록을 설계할 때 확인할 것이 둘로 나뉩니다. 무엇을 막았는지와, 막은 결과로 에이전트가 무엇을 못 보게 됐는지입니다. 앞쪽은 설정 파일에 적혀 있지만 뒤쪽은 에러 로그에 남지 않습니다.

## 참고 자료

- [Restrict web search and web fetch domains — Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/tools-web-restrictions)
- [Cloud environment setup — Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/environments)
- [Claude API release notes](https://platform.claude.com/docs/en/release-notes/api)
- [Configure the sandboxed Bash tool — Claude Code](https://code.claude.com/docs/en/sandboxing)
- [Claude Code sandboxing — Anthropic Engineering](https://www.anthropic.com/engineering/claude-code-sandboxing) — 본문 도식 2장의 출처
