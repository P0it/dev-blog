---
title: rm 없는 스크립트에도 뜨는 Claude Code 2.1.288 의 rm 경고
slug: claude-code-inline-shell-rm-check-false-positive
tags: [Claude Code, 보안, 업무 자동화]
category: insights
---

> 10월 2일 Claude Code 2.1.288 이 셸 스크립트 안에 든 위험한 삭제 명령까지 검사하도록 바뀌었고 하루 뒤 그 검사가 삭제 명령 없는 스크립트를 막는다는 리포트가 올라왔습니다. 권한 프롬프트를 전부 끈 세션에서도 남는 마지막 검사가 명령의 어디를 읽고 어디를 못 읽는지 확인했습니다.

Claude Code 로 작업하다 삭제 명령에서 확인 창을 받아 본 적이 있을 것입니다. 파일 몇 개를 지우는 명령은 그냥 지나가는데 어떤 삭제는 꼭 한 번 묻습니다. 권한 프롬프트를 전부 끄고 시작한 세션에서도 그렇습니다.

이 확인 창은 무엇을 기준으로 뜰까요? `rm` 과 `rmdir` 의 대상이 임계 경로일 때입니다. [공식 문서](https://code.claude.com/docs/en/permission-modes)는 파일시스템 루트, 루트 바로 아래 디렉터리, 홈 디렉터리, 작업 디렉터리와 그 상위를 임계 경로로 적어 뒀습니다. 이 검사는 `permissions.allow` 규칙이나 `"allow"` 를 돌려주는 `PreToolUse` 훅이 승인해도 명령을 통과시키지 않습니다. 문서는 이것을 모델의 실수를 막는 회로 차단기라고 설명합니다.

10월 2일 릴리스와 그다음 날 올라온 리포트를 같이 읽으면 이 검사가 명령의 어디까지 읽는지 알게 됩니다. 사람이 보고 있지 않은 세션을 돌린다면 이 판정이 곧 자동화가 멈추는 조건이 됩니다.

## 10월 2일 2.1.288 이 메운 구멍 두 개

[changelog](https://code.claude.com/docs/en/changelog)에 적힌 2.1.288 의 수정 두 줄이 이 검사의 범위를 그대로 말해 줍니다. 하나는 `bash -c` 나 `sh -c` 로 넘긴 스크립트 안에 든 위험한 `rm` 이 bypassPermissions 모드나 셸 allow 규칙 아래에서 확인 없이 실행되던 경우입니다. 다른 하나는 같은 명령이 `~` 나 와일드카드 경로로 출력을 리다이렉트할 때 늘 묻던 보호가 없어지던 경우입니다.

두 경우 모두 삭제 대상은 그대로입니다. `rm -rf /` 는 똑같은데 그걸 감싼 문자열의 모양만 달랐습니다.

## 권한 모드를 건너뛰어도 남는 회로 차단기

그럼 권한 프롬프트를 전부 끄는 bypassPermissions 모드에서는 이 검사도 같이 꺼질까요? 꺼지지 않습니다. 문서는 bypassPermissions 가 프롬프트와 안전 검사를 끄고 도구 호출을 바로 실행한다고 적어 뒀습니다. 그러면서 임계 경로를 대상으로 하는 `rm`·`rmdir` 은 그 모드에서도 승인을 묻는다고 따로 밝혔습니다. allow 규칙은 bypassPermissions 에서 아무 효력이 없고 deny 규칙은 모든 모드에서 차단합니다.

같은 문서는 bypassPermissions 가 프롬프트 인젝션이나 의도치 않은 동작을 막아 주지 않는다고도 적었습니다. 이 모드에서 남는 보호는 임계 경로 삭제 검사 하나뿐입니다. 그 하나가 명령의 어디를 읽는지 알아 둘 필요가 있습니다.

## 검사가 bash 를 실행 프로그램으로 읽던 동안

2.1.288 전까지 이 검사는 명령이 실행하는 프로그램을 기준으로 판정했습니다. `bash -c 'rm -rf /'` 를 넣으면 검사가 보는 프로그램은 `bash` 이고 `rm` 은 문자열 인자 안에 있어서 검사 대상에 들어오지 않았습니다. `sh -c "rm -rf ~"` 도 마찬가지였습니다. 셸에 문자열로 넘기는 한 겹이 판정을 바꿨습니다.

지금 문서에는 중첩 명령과 인라인 스크립트를 함께 읽는다고 적혀 있습니다. `(...)` 서브셸, `{ ...; }` 묶음, `$(...)` 치환, `<(...)` 프로세스 치환 안에 든 삭제도 찾아냅니다. 인라인 스크립트는 인용 방식에 따라 판정이 달라집니다. 큰따옴표로 감싼 스크립트는 바깥 셸이 변수를 먼저 펼치기 때문에 `find . -name '*.tmp' -exec sh -c "rm -rf \"$1\"/*" _ {} \;` 는 매치마다 루트에서 삭제하는 명령이 되므로 임계 경로 삭제로 판정됩니다. 반대로 작은따옴표로 감싸고 `$1` 에 실제 값을 넘기는 `sh -c 'rm -rf "$1"/*' _ {}` 는 걸리지 않습니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>셸에 문자열로 넘긴 삭제 명령을 검사가 읽는 범위에 따라 달라지는 세 가지 결과</title>

  <rect x="40" y="190" width="190" height="72" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="135" y="222" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17">bash -c</text>
  <text x="135" y="245" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15">'…'</text>

  <path d="M240 226 H288"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <rect x="298" y="186" width="166" height="80" rx="14"
    style="fill: var(--diag-cluster-bg); stroke: var(--fg-strong); stroke-width: 2.5" />
  <text x="381" y="232" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 17">삭제 검사</text>

  <path d="M474 226 H516 M516 226 V112 H548 M516 226 H548 M516 226 V340 H548"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />

  <rect x="558" y="78" width="202" height="68" rx="14"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="659" y="108" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 16">2.1.287</text>
  <text x="659" y="130" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15">묻지 않고 실행</text>

  <rect x="558" y="192" width="202" height="68" rx="14"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="659" y="222" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 16">2.1.288</text>
  <text x="659" y="244" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15">스크립트 안을 읽음</text>

  <rect x="558" y="306" width="202" height="68" rx="14"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="659" y="336" text-anchor="middle"
    style="fill: var(--fg-strong); font-size: 16">$'…' 인용</text>
  <text x="659" y="358" text-anchor="middle"
    style="fill: var(--fg-neutral); font-size: 15">못 읽고 확인 창</text>
</svg>
```

## rm 이 없는데 rm 을 실행한다고 적힌 확인 창

검사가 스크립트 안쪽을 읽기 시작하면서 반대쪽 문제가 생겼습니다. 10월 3일 공식 저장소에 [리포트](https://github.com/anthropics/claude-code/issues/99320) 하나가 올라왔습니다. 2.1.288 에서 `rm` 이 한 번도 나오지 않는 스크립트에 삭제 경고가 뜬다는 내용이고 아직 열려 있습니다.

조건 세 개가 모두 겹칠 때 재현된다고 적혀 있습니다.

- 스크립트가 `$'...'` 형식으로 인용돼 있다
- 그 안에 `python3 -c` 나 `node -e` 같은 중첩 인터프리터 코드 문자열이 있다
- 그 문자열이 셸 변수를 펼친다

리포터가 올린 최소 재현은 `bash -c $'python3 -c "print($HOME)"'` 한 줄입니다. 2.1.287 에서는 그대로 실행됐습니다.

이때 뜨는 메시지는 이렇습니다.

> This command passes a shell -c script that runs rm, and Claude Code could not check the script for dangerous removals. Approve only if you have read the script.

한 문장에 맞는 말과 틀린 말이 같이 들어 있습니다. 스크립트를 검사할 수 없었다는 뒷부분은 맞습니다. 그 스크립트가 `rm` 을 실행한다는 앞부분은 틀렸습니다. 파싱에 실패했을 때 검사가 "못 읽었다" 에서 멈추지 않고 "`rm` 이 들어 있다" 까지 적어 버렸습니다.

무인 실행에서 걸리는 대목은 그다음입니다. 이 확인 창은 `--dangerously-skip-permissions` 로 시작한 세션에서도 뜨고 리포트는 이걸 끌 수 없다고 적었습니다. 사람이 없는 세션은 삭제와 아무 상관없는 Python·Node 명령 한 줄에서 멈춥니다.

## 모드별 임계 경로 삭제 처리

같은 삭제 명령이 권한 모드마다 어떻게 처리되는지 비교해 보면 아래와 같습니다.

| | 임계 경로 삭제가 들어왔을 때 |
|---|---|
| `default`·`acceptEdits` | 승인을 묻습니다 |
| `plan` | 승인을 묻습니다 |
| `auto` | 터미널에서는 시간 제한을 걸고 묻지만 그 밖에서는 거부합니다 |
| `dontAsk` | 거부합니다 |
| `bypassPermissions` | 터미널에서는 시간 제한을 걸고 묻습니다 |

`auto` 와 `bypassPermissions` 에서 터미널에 뜨는 확인 창에는 2분 카운트다운이 붙습니다. 시간이 지나면 명령을 거부하고 Claude 에게 다음에 할 일을 알려 주므로 세션 자체는 계속 진행됩니다. 다만 같은 세션에서 이런 확인 창이 세 번 응답 없이 지나가면 그 뒤로는 묻지 않고 바로 거부합니다. 이 동작은 2.1.281 이상에서 적용됩니다.

## 무인 실행에서 확인할 것

- **버전을 먼저 본다.** `claude --version` 으로 2.1.288 이상인지 확인합니다. 그 아래면 `bash -c` 한 겹이 검사를 지나갑니다. 2.1.288 이면 위 리포트의 오탐을 만날 수 있습니다.
- **변수 펼침을 가드한다.** `rm -rf "$DIR"/*` 는 변수가 비면 루트에서 삭제하는 명령이 되므로 임계 경로로 판정됩니다. `rm -rf "${DIR:?}"/*` 처럼 비었을 때 셸이 멈추게 적으면 이 검사를 통과합니다.
- **치환은 따로 실행한다.** `rm -rf "$(pwd)"` 처럼 대상이 명령 치환 출력뿐이면 검사가 실행 전에 대상을 확인할 수 없습니다. 치환을 먼저 실행해 경로를 받은 뒤 그 경로를 지웁니다.
- **클라우드 세션의 예외를 기억한다.** 클라우드 세션은 settings 파일의 `bypassPermissions`·`dontAsk` 값을 무시합니다. 저장소에 커밋한 설정으로 클라우드 세션을 bypassPermissions 로 시작할 수 없습니다.
- **끌 수 있는 것과 없는 것을 구분한다.** 명령 치환 대상 검사는 `CLAUDE_CODE_DISABLE_SUBSTITUTION_RM_PROMPT=1` 로, 2분 제한은 `CLAUDE_CODE_DISABLE_DANGEROUS_RM_TIMEOUT=1` 로 끌 수 있습니다. 10월 3일 리포트의 오탐에는 해당하는 환경 변수가 없습니다.

삭제를 막는 검사가 명령의 텍스트를 읽어 판정한다는 사실이 이틀 사이에 양쪽으로 드러났습니다. 덜 읽으면 `bash -c` 한 겹에 지나가고 더 읽으려 하면 못 읽은 것을 읽은 것처럼 적습니다. 무인 실행을 늘릴 생각이라면 모드 이름을 믿기 전에 이 검사가 어디까지 보장하는지 확인해 두는 편이 낫습니다.
