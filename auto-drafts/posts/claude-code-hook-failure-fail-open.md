---
title: settings.json 오타 하나로 꺼지는 Claude Code 훅
slug: claude-code-hook-failure-fail-open
tags: [Claude Code, Hooks, 에이전트 보안]
category: insights
cover_image: REHOST:https://mintcdn.com/claude-code/ikqp3_70mqIahteV/images/hook-resolution.svg?fit=max&auto=format&n=ikqp3_70mqIahteV&q=85&s=be0bf3053550c26de5f54cd64674c197
---

> Claude Code 2.1.295 가 2026년 10월 8일 command 훅과 HTTP 훅에 `onFailure: "block"` 을 추가했습니다. 그 전까지 훅이 실패했을 때 막으려던 동작이 어떻게 처리됐는지를 공식 Hooks reference 의 문장으로 하나씩 확인해 정리했습니다.

위험한 명령을 막으려고 `PreToolUse` 훅을 걸어 본 적이 있으실 겁니다. `Bash(rm *)` 에 검사 스크립트를 하나 붙여 두고 이제 그 명령은 검사를 지나지 않고는 실행되지 않는다고 생각하며 넘어갑니다. 그런데 그 스크립트 자체가 실패하면 명령은 어떻게 될까요? 대부분의 훅 이벤트에서 **그대로 진행됩니다**. 경로를 한 글자 잘못 적어 스크립트가 실행되지 않아도 결과는 같습니다. 종료 코드 1로 끝나거나 제한 시간을 넘겨 취소돼도 마찬가지입니다. Hooks reference 는 이 상황을 따로 경고로 적어 뒀습니다. `settings.json` 에 경로를 잘못 적으면 게이트가 비활성 상태로 남는다는 문장입니다. 어떤 실패가 어떻게 처리되는지 알면 어떤 훅이 정책을 실제로 집행하고 어떤 훅이 집행하지 못하는지 구분할 수 있습니다.

훅은 생각보다 많은 곳에서 발화합니다. 세션 시작과 종료, 턴마다 도는 프롬프트 제출과 정지, 도구 호출마다 도는 `PreToolUse` 와 `PostToolUse` 가 모두 훅 이벤트입니다.

![Claude Code 훅 생애주기 다이어그램 — SessionStart 에서 시작해 턴 단위 루프 안에 UserPromptSubmit 과 에이전트 루프(PreToolUse·PermissionRequest·PostToolUse)가 중첩되고 SessionEnd 로 끝나는 구조](REHOST:https://mintcdn.com/claude-code/x7pO8l4XcvAXCoVc/images/hooks-lifecycle.svg?fit=max&auto=format&n=x7pO8l4XcvAXCoVc&q=85&s=81b9256c1bbe8832553485f5d9e9c746)

## 차단으로 읽히는 유일한 종료 코드 2

그럼 훅은 무엇으로 "이건 하지 말라"는 뜻을 전달할까요? 종료 코드입니다. 0은 성공이고 2는 차단입니다. 차단을 받을 수 있는 이벤트에서 `exit 2` 는 stdout 의 JSON 이 `allow` 라고 적혀 있어도 그 결정을 덮고 막습니다.

문제는 나머지 코드입니다. 대부분의 이벤트에서 코드 단독으로 막는 값은 2 하나뿐입니다. stdout 에 유효한 JSON 이 없으면 Claude Code 는 종료 코드 1을 비차단 오류로 처리하고 동작을 진행합니다. 1이 Unix 관례상 실패를 뜻하는 코드라는 점을 공식 문서도 같은 문장에서 인정하면서 정책을 집행할 훅이라면 `exit 2` 를 쓰라고 분명히 적어 뒀습니다. 스크립트에 `set -e` 를 걸어 두고 중간 명령이 실패해 1로 끝나는 흔한 구성이 바로 이 경우에 들어갑니다.

막히는 흐름과 지나가는 흐름이 공식 다이어그램에 함께 그려져 있습니다. matcher 와 `if` 조건이 모두 맞으면 훅이 실행되고 `permissionDecision: "deny"` 를 돌려줘 도구 호출이 막힙니다. 둘 중 하나라도 맞지 않으면 훅은 건너뛰어지고 도구 호출은 그대로 진행됩니다.

![Claude Code 훅 결정 흐름 — PreToolUse 발화 후 matcher 와 if 조건이 모두 맞으면 훅이 deny 를 돌려주고 도구 호출이 막히며 하나라도 맞지 않으면 훅을 건너뛰고 호출이 진행된다](REHOST:https://mintcdn.com/claude-code/ikqp3_70mqIahteV/images/hook-resolution.svg?fit=max&auto=format&n=ikqp3_70mqIahteV&q=85&s=be0bf3053550c26de5f54cd64674c197)

## 시작하지 못한 훅과 settings.json 오타

훅이 아예 실행되지 못한 경우도 같은 비차단 묶음에 들어갑니다. 스크립트 경로가 없거나 실행 권한이 없으면 셸이 127 같은 코드로 끝나고 전사에는 인터프리터가 낸 메시지가 그대로 붙은 알림이 뜹니다. `Failed with non-blocking status code: /bin/sh: /path/to/hook.sh: No such file or directory` 같은 줄입니다. 그리고 대부분의 이벤트에서 동작은 진행됩니다.

그래서 Hooks reference 는 정책 훅을 설정했으면 **첫 실행에서 이 알림이 뜨는지 확인하라**고 적어 뒀습니다. `settings.json` 의 경로 오타 하나가 게이트를 비활성 상태로 두기 때문입니다. `/hooks` 목록에는 훅이 그대로 등록된 채로 보이기 때문에 설정 화면만 봐서는 집행되는지 알 수 없습니다.

## 제한 시간을 넘긴 훅이 남기지 않는 판정

실행은 됐는데 끝나지 않은 훅은 어떻게 될까요? `async: true` 로 돌리는 command 훅을 빼면 Claude Code 는 제한 시간에 닿은 command·http·mcp_tool 훅을 취소하고 그 출력을 버립니다. 출력이 버려지므로 대부분의 이벤트에서 그 훅은 **아무 판정도 남기지 않습니다**. 기본 제한 시간은 command·http·mcp_tool 이 600초이고 `prompt` 가 30초, `agent` 가 60초입니다. `UserPromptSubmit` 과 모델 교체 이벤트에서는 앞 세 종류가 30초로 내려가고 `MessageDisplay` 에서는 10초가 됩니다.

여기서 훅 종류에 따라 결과가 달라집니다. `PreToolUse` 에서 제한 시간을 넘긴 command·http·mcp_tool 훅은 도구 호출을 막지 못하고 호출은 일반 권한 흐름을 그대로 지나갑니다. 공식 문서는 이 대목에 멈춰 선 훅이 게이트 역할을 해 주리라 기대하지 말라고 덧붙였습니다. 반대로 Agent SDK 콜백 훅은 제한 시간을 넘기면 도구 호출을 막습니다. 그쪽은 정책 게이트로 동작할 수 있다는 전제가 문서에 적혀 있습니다.

HTTP 훅은 실패를 알릴 방법이 더 적습니다. 비-2xx 상태 코드와 연결 실패는 전부 비차단 오류이고 실행은 계속됩니다. 2xx 에 JSON 이 아닌 본문이 와도 같습니다. 차단하려면 2xx 응답에 결정 필드가 담긴 JSON 본문을 실어야 합니다. 상태 코드만으로는 차단을 알릴 수 없습니다.

실패 종류마다 기본 동작과 2.1.295 가 가리키는 범위를 견주면 아래와 같습니다.

| | 기본 동작 | `onFailure: "block"` |
|---|---|---|
| 시작 실패(경로 오타·실행 권한 없음) | 동작 진행 | 막는다 |
| 제한 시간 초과 | 판정 없이 동작 진행 | 막는다 |
| 예상하지 못한 종료 코드 | 비차단 오류 후 동작 진행 | 막는다 |
| HTTP 비-2xx·연결 실패 | 비차단 오류 후 동작 진행 | 문서 미기재 |
| 종료 코드 2 | 차단 | 해당 없음 |

## 2.1.295 가 더한 onFailure: "block"

2026년 10월 8일 올라온 2.1.295 의 추가 항목 첫 줄이 이것입니다. command 훅과 HTTP 훅에 `onFailure: "block"` 이 생겼습니다. 시작하지 못하거나 제한 시간을 넘기거나 예상하지 못한 코드로 끝난 훅이 그 동작을 통과시키는 대신 막습니다. 기본값이 반대였다는 사실을 릴리스 노트가 한 줄로 확인해 줬습니다.

범위는 changelog 가 적은 만큼입니다. command 훅과 HTTP 훅이 대상이고 `mcp_tool`·`prompt`·`agent` 훅은 그 문장에 들어 있지 않습니다. 허용값이 `"block"` 외에 무엇이 더 있는지, 기본값을 어떻게 적어야 하는지는 아직 문서에서 확인할 수 없습니다. 2026년 10월 8일 22시 30분 UTC 기준으로 Hooks reference, Settings reference, Get started with hooks 세 문서에서 `onFailure` 는 한 건도 검색되지 않았습니다. 기능이 먼저 나가고 레퍼런스 문서가 아직 그 내용을 담지 못했습니다.

같은 날 올라온 2.1.294 도 결이 같습니다. "Block commands that…" 처럼 지시문으로 쓴 `prompt` 훅과 `agent` 훅이 막아야 할 것을 통과시키던 동작을 고쳤습니다. 모델이 판정하는 훅도 같은 방향으로 열려 있었다는 뜻입니다. 하루에 올라온 두 릴리스가 모두 안전장치의 실패 방향을 손봤습니다.

## 무인 실행에 훅을 걸 때 확인할 것

사람이 보고 있는 세션에서는 알림이 한 줄 뜨면 눈에 걸립니다. 무인으로 도는 쪽은 사정이 다릅니다. CI 와 클라우드 세션, 스케줄로 도는 루틴은 그 알림을 읽는 사람이 없습니다.

- 정책을 집행할 훅이면 종료 코드를 2로 끝냅니다. `exit 1` 은 집행되지 않습니다.
- 훅을 처음 설정했으면 바로 한 번 발화시켜 비차단 알림이 뜨는지 봅니다. `/hooks` 목록에 보이는 것만으로는 확인이 되지 않습니다.
- 600초는 무인 실행에서 너무 깁니다. `timeout` 을 쓰는 시간에 맞춰 줄이고 2.1.295 이상이면 `onFailure: "block"` 을 함께 적습니다.
- `once: true` 로 선언한 훅은 실패하거나 종료 코드 2로 막거나 제한 시간을 넘기면 제거되지 않고 남아 다음 이벤트에서 다시 실행됩니다.

이 관점에서 보면 훅을 거는 일과 훅이 집행되는지 확인하는 일은 별개의 작업입니다. 전자는 `settings.json` 한 줄로 끝나지만 후자는 실패를 한 번 만들어 봐야 알 수 있습니다. 안전장치를 설치한 날이 아니라 그 안전장치가 고장 난 날에 무엇이 일어나는지를 확인해 둬야 합니다.

## 참고 자료

- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks) (본문 다이어그램 2장의 원출처)
- [Claude Code changelog — 2.1.295·2.1.294](https://code.claude.com/docs/en/changelog)
- [Get started with hooks — Claude Code Docs](https://code.claude.com/docs/en/hooks-guide)
