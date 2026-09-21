---
title: MCP로 스킬을 보내는 서버는 있는데 받는 쪽이 없다
slug: skills-over-mcp-host-support
tags: [MCP, Agent Skills, 에이전트]
category: insights
---

> Agent Skills 를 MCP 로 주고받는 규격이 9월 13일 Final 이 됐습니다. 규격 원문과 공식 클라이언트 매트릭스, SDK 의 PR 상태를 확인해 지금 어디까지 구현됐는지와 받는 쪽이 늦어지는 이유를 정리했습니다.

Claude Code 에서 스킬을 쓰려면 지금은 파일을 놓아 둡니다. `~/.claude/skills/` 아래에 `SKILL.md` 가 든 디렉터리를 만들거나 플러그인으로 설치합니다. 팀에서 같이 쓰는 스킬이면 저장소를 하나 만들고 각자 다운받아 링크를 걸어 둡니다. 그러면 MCP 서버가 도구를 보내 주듯 스킬도 보내 줄 수 있을까요? 규격은 이제 있습니다. [SEP-2640](https://github.com/modelcontextprotocol/ext-skills) 이 9월 13일 Final 로 병합되면서 서버가 스킬을 목록으로 내주는 방법까지 정해졌습니다. 다만 그 스킬을 받아 읽는 쪽은 아직 드뭅니다. MCP [공식 클라이언트 매트릭스](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/extensions/client-matrix.mdx)에 올라 있는 14개 클라이언트 중 스킬 칸이 채워진 곳은 세 곳이고 그 셋도 전부 Partial 입니다. 서버 쪽은 이미 v1 이 나왔는데 받는 쪽이 왜 이렇게 늦는지 알면 내가 쓰는 도구에 이 기능이 언제 붙을지 가늠할 수 있습니다.

## 9월 13일에 Final 이 된 SEP-2640

확장의 이름은 `io.modelcontextprotocol/skills` 입니다. 규격 본문은 MCP 본체 저장소가 아니라 [`modelcontextprotocol/ext-skills`](https://github.com/modelcontextprotocol/ext-skills) 라는 별도 저장소에 있습니다. 기준 프로토콜 리비전은 `2026-07-28` 입니다. 9월 16일에 문서 사이트가 올라왔고 9월 18일에 저장소 정리와 CODEOWNERS 교체가 끝났습니다.

새 원시 타입을 만들지는 않았습니다. 스킬 디렉터리의 파일 하나하나를 기존 Resources 로 내주고 그 위에 메서드 세 개를 얹었습니다. `skills/list` 는 서버가 서빙하는 스킬을 열거하고 `skills/get` 은 URI 하나로 그중 한 건을 돌려줍니다. 디렉터리의 자식 목록을 보여 주는 `resources/directory/read` 는 선택입니다. 서버는 capabilities 의 `extensions` 필드에 이 확장을 적어 지원을 알립니다.

스킬의 형식 자체는 이 규격이 건드리지 않습니다. 디렉터리 구조와 YAML 프런트매터, 이름 규칙은 전부 Agent Skills 규격에 맡기고 **전송 방식만** 정했습니다. 그래서 이미 쓰고 있는 `SKILL.md` 를 고칠 일은 없습니다.

## skills/list 가 한 번에 돌려주는 것

그럼 서버는 스킬을 어떤 모양으로 보내 줄까요? 목록 응답의 항목 하나가 `Skill` 엔트리이고 여기에 세 가지가 들어 있습니다. 스킬 `SKILL.md` 의 리소스 URI, 프런트매터를 그대로 옮긴 JSON 객체, 그리고 그 스킬에 속한 파일 전체 목록입니다. 파일 목록에는 파일마다 `sha256:` 로 시작하는 digest 와 바이트 단위 `size` 가 붙습니다.

프런트매터를 통째로 실어 보내는 설계라 호스트는 `SKILL.md` 를 한 건도 읽지 않고 목록만으로 스킬 등록부를 만들 수 있습니다. 작성자가 적은 필드는 `name` 과 `description` 말고도 전부 그대로 통과합니다.

URI 는 이런 모양입니다.

```
skill://acme/billing/refunds/SKILL.md
```

마지막 경로 조각은 반드시 프런트매터의 `name` 과 같아야 합니다. 그 앞은 서버가 마음대로 정하는 구분용 접두사입니다. 이렇게 묶어 둔 덕분에 URI 만 봐도 스킬 이름을 알 수 있습니다.

한도도 규격에 박혀 있습니다. 스킬 하나에 파일 512개, 전체 16MiB 입니다. 파일 목록이 완전하니 호스트는 파일을 하나도 받기 전에 이 두 가지를 확인할 수 있습니다. 내용이 매번 새로 만들어져 digest 를 고정할 수 없는 스킬은 파일 목록 대신 `"dynamic"` 이라는 문자열을 적게 되어 있는데, 이런 스킬은 뒤에서 볼 이유로 아예 받지 않는 호스트가 있을 수 있습니다.

## 이미 서빙하는 서버와 아직 부분 지원인 호스트

확장 저장소가 관리하는 [구현 목록](https://raw.githubusercontent.com/modelcontextprotocol/ext-skills/main/docs/implementations.md)을 서버·SDK·호스트로 나눠 보면 아래와 같습니다.

| | 서버 | 공식 SDK | 호스트 |
|---|---|---|---|
| 상태 | v1 구현 있음 | 네 개 모두 PR 단계 | 전부 Partial |
| 대표 | Hugging Face `hf-mcp-server` | TypeScript · Python · Go · C# | ChatGPT · fast-agent · MCP Inspector |
| 근거 | `skills/list`·`skills/get`·`directoryRead` 지원 | TypeScript PR 은 아직 Draft | 공식 클라이언트 매트릭스 |
| 빠진 곳 | 일부는 프로토타입 | 배포된 npm 최신판은 7월 27일자 | Claude · Cursor · VS Code · Goose |

Hugging Face 의 MCP 서버는 `HF_SKILLS_DIR` 로 스킬 디렉터리를 받아 서빙하면서 모든 파일의 SHA-256 digest 와 프런트매터를 확인한 뒤 올린다고 적어 뒀습니다. 받는 쪽은 사정이 다릅니다. npm 에 올라간 [`@modelcontextprotocol/sdk`](https://registry.npmjs.org/@modelcontextprotocol/sdk) 의 최신 버전 1.30.0 은 7월 27일에 발행됐습니다. 스킬 API 를 넣는 [PR #2818](https://github.com/modelcontextprotocol/typescript-sdk/pull/2818) 은 9월 14일 커밋을 끝으로 아직 Draft 입니다. Go SDK 쪽 [PR #1238](https://github.com/modelcontextprotocol/go-sdk/pull/1238) 은 conformance 테스트를 통과했다고 적혀 있지만 역시 열려 있습니다.

가장 앞서 있는 호스트는 MCP Inspector 입니다. 스킬 검증 기능이 들어간 2.6.0 이 9월 9일에 npm 에 올라왔으니 SEP 가 Final 이 되기 나흘 전입니다. 그리고 Agent Skills 를 처음 내놓은 Claude Code 는 [공식 문서](https://code.claude.com/docs/en/skills) 기준으로 아직 파일 시스템 경로에서만 스킬을 찾습니다. MCP 로 받는 이야기는 문서에 없습니다.

## 원격 스킬을 로컬 스킬처럼 다루지 못하게 한 조항들

그럼 받는 쪽은 왜 이렇게 오래 걸릴까요? [규격 원문](https://raw.githubusercontent.com/modelcontextprotocol/ext-skills/main/specification/stable/skills.mdx)의 보안 항목을 읽어 보면 호스트가 해야 할 일이 파싱이 아니라는 것을 알게 됩니다. 스킬 본문은 모델에게 읽히는 지시문입니다. 원격 서버가 쓴 문장이 내 컨텍스트에 들어가고 그 문장이 호스트의 도구를 부르게 만들 수 있습니다. 규격은 이것을 **원격 도구 호출보다 높은 위험**으로 다루라고 분명히 적어 두었습니다.

요구 사항은 구체적입니다.

- 모델 컨텍스트에 넣는 순간 어느 서버에서 온 스킬인지 표시해야 하며 로컬 스킬과 구분되지 않게 보여 주면 안 됩니다.
- 이름은 서버별 네임스페이스 안에서 해석합니다. 원격 스킬이 같은 이름의 로컬 스킬을 대신 실행되게 만드는 일은 금지입니다.
- 프런트매터의 `allowed-tools` 는 MCP 로 온 스킬에서는 무시합니다. 사용자가 그 스킬에 대해 따로 승인했을 때만 살아납니다.
- 사용자의 승인은 승인 시점의 파일 목록 전체에 묶입니다. 파일이 하나라도 바뀌거나 늘거나 빠지면 그 승인은 철회된 것으로 보고 다시 물어야 합니다.
- 받아 둔 파일을 디스크에 캐시한다면 파일 스킬을 찾는 경로 밖에 두어야 합니다. 호스트만 쓸 수 있는 곳에 두든지, 읽을 때마다 digest 를 다시 계산해야 합니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>서버가 보낸 스킬 엔트리를 호스트가 보관하고 대조한 뒤 모델에 넣는 구조</title>
  <rect x="50" y="165" width="170" height="120" rx="16"
    style="fill: var(--diag-teal-fill); stroke: var(--diag-teal-stroke); stroke-width: 2.5" />
  <text x="135" y="212" text-anchor="middle" style="fill: var(--fg-strong); font-size: 19px">서버</text>
  <text x="135" y="243" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15px">목록 · digest</text>
  <path d="M230 225 H295"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M278 212 L295 225 L278 238"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="305" y="120" width="190" height="210" rx="16"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="400" y="163" text-anchor="middle" style="fill: var(--fg-strong); font-size: 19px">호스트</text>
  <text x="400" y="203" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15px">엔트리 보관</text>
  <text x="400" y="233" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15px">승인 고정</text>
  <text x="400" y="263" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15px">읽을 때마다 대조</text>
  <text x="400" y="299" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15px">캐시 격리</text>
  <path d="M505 225 H570"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <path d="M553 212 L570 225 L553 238"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="580" y="165" width="170" height="120" rx="16"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="665" y="212" text-anchor="middle" style="fill: var(--fg-strong); font-size: 19px">모델</text>
  <text x="665" y="243" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15px">출처 표시</text>
</svg>
```

digest 가 붙어 있으니 안전하다고 읽기 쉬운데 규격은 그 해석을 막아 두었습니다. digest 는 서명이 아니고 내용을 준 서버가 같이 준 값입니다. 둘이 맞는다는 것은 엔트리와 받은 파일이 서로 어긋나지 않았다는 뜻일 뿐입니다. 중간에 낀 게이트웨이가 엔트리와 내용을 함께 바꾸면 그대로 통과합니다. 규격도 digest 를 보안 경계로 취급하지 말라고 적어 두었습니다.

## 내 도구가 스킬을 받을 수 있는지 확인하는 법

세 가지를 보면 됩니다.

먼저 서버 쪽입니다. 연결한 서버의 capabilities 에서 `extensions` 필드에 `io.modelcontextprotocol/skills` 가 있는지 봅니다. 없으면 그 서버는 스킬을 서빙하지 않습니다. `directoryRead: true` 까지 적혀 있으면 디렉터리 목록도 받을 수 있습니다.

다음은 내가 쓰는 클라이언트입니다. 공식 클라이언트 매트릭스의 Skills 칸을 보면 되는데, 지금은 ChatGPT 와 fast-agent, MCP Inspector 세 줄만 채워져 있고 표기는 전부 Partial 입니다. Claude Desktop·Cursor·VS Code Copilot·Goose 는 비어 있습니다. 확인하며 직접 시험해 보려면 MCP Inspector 의 CLI 에 들어간 skill verification 을 쓰면 됩니다.

마지막은 이름입니다. 원격 스킬과 로컬 스킬의 이름이 겹치면 규격은 호스트에 충돌을 사용자에게 보여 주라고 요구합니다. 반대로 말하면 그 표시가 없는 호스트에서는 어느 쪽이 실행됐는지 확인하기 어렵습니다. 스킬 이름을 흔한 단어로 지어 두었다면 지금 한 번 확인해 둘 만합니다.

규격이 먼저 서고 구현이 따라오는 순서 자체는 MCP 에서 낯선 일이 아닙니다. 다만 이번에는 서버와 호스트가 해야 할 일의 양이 크게 다릅니다. 서버는 디렉터리를 읽어 digest 를 붙이면 끝납니다. 호스트는 승인 모델과 이름 공간과 캐시 정책을 새로 만들어야 합니다. 스킬을 저장소에 두고 각자 다운받아 쓰는 방식이 당분간 계속될 것 같다고 보는 이유가 여기 있습니다. 이 관점에서 보면 이번 규격이 정한 것은 배포 방법이라기보다 **원격에서 온 지시문을 어디까지 믿을 것인가**에 대한 기본선입니다.

## 참고 자료

- [Skills 확장 규격 원문 — modelcontextprotocol/ext-skills](https://raw.githubusercontent.com/modelcontextprotocol/ext-skills/main/specification/stable/skills.mdx)
- [ext-skills 저장소 README — SEP-2640 병합 기록](https://github.com/modelcontextprotocol/ext-skills)
- [확장 클라이언트 지원 매트릭스 — modelcontextprotocol](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/extensions/client-matrix.mdx)
- [구현 목록 — ext-skills docs/implementations.md](https://raw.githubusercontent.com/modelcontextprotocol/ext-skills/main/docs/implementations.md)
- [TypeScript SDK PR #2818 — Skills 확장 API](https://github.com/modelcontextprotocol/typescript-sdk/pull/2818)
- [Go SDK PR #1238 — SEP-2640 Skills support](https://github.com/modelcontextprotocol/go-sdk/pull/1238)
- [hf-mcp-server — Hugging Face](https://github.com/huggingface/hf-mcp-server)
- [Agent Skills 문서 — Claude Code](https://code.claude.com/docs/en/skills)
