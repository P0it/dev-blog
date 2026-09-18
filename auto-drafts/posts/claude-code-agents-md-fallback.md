---
title: Claude Code가 AGENTS.md를 읽는 조건
slug: claude-code-agents-md-fallback
tags: [Claude Code, AGENTS.md, CLAUDE.md]
category: insights
cover_image: REHOST:https://raw.githubusercontent.com/agentsmd/agents.md/main/public/og.png
---

> Claude Code 2.1.277 이 `AGENTS.md` 를 직접 읽기 시작했습니다. 다만 기본값은 두 파일을 함께 읽는 방식이 아닙니다. 공식 문서가 정리한 판정 규칙과 설정값, 지원이 붙지 않는 세션까지 정리했습니다.

여러 코딩 도구를 같이 쓰는 저장소에는 루트에 규약 파일이 두 개 놓여 있습니다. Codex·Cursor 쪽이 읽는 `AGENTS.md` 와 Claude Code 가 읽는 `CLAUDE.md` 입니다. 이번에 Claude Code 가 `AGENTS.md` 지원을 붙였으니 이제 둘 다 읽을까요? 기본값에서는 읽지 않습니다. `CLAUDE.md` 가 하나라도 있으면 Claude Code 는 `AGENTS.md` 를 건너뜁니다. 루트에 두 파일이 같이 있는 저장소라면 세션은 `CLAUDE.md` 만 읽고 시작합니다. `AGENTS.md` 에 적어 둔 테스트 명령은 컨텍스트에 들어가지 않습니다. 판정 규칙을 알면 이번 세션이 어느 파일을 읽었는지 확인하고 원하는 쪽으로 바꿀 수 있습니다.

## 1년 넘게 닫히지 않던 요청 #6235

`AGENTS.md` 를 지원해 달라는 요청은 2025년 8월 21일에 올라왔습니다. 다른 코딩 에이전트가 이미 같은 파일 이름으로 모이고 있으니 Claude Code 도 읽어 달라는 내용입니다. 이 요청은 1년 넘게 열려 있었습니다. 올해 8월까지 나온 해설 글들도 "Claude Code 는 `CLAUDE.md` 를 읽고 `AGENTS.md` 는 읽지 않는다"로 정리했습니다. 대신 `@AGENTS.md` import 나 심볼릭 링크를 쓰라고 안내했습니다.

그게 이번 주에 닫혔습니다. Claude Code 2.1.277 CHANGELOG 의 첫 줄은 이렇습니다.

> Added AGENTS.md support: in projects without CLAUDE.md, Claude Code reads AGENTS.md instead

![AGENTS.md — 코딩 에이전트를 위한 공개 포맷을 소개하는 저장소 로고 이미지](REHOST:https://raw.githubusercontent.com/agentsmd/agents.md/main/public/og.png)

`AGENTS.md` 는 코딩 에이전트에게 줄 지시를 한 파일에 모으자는 공개 포맷입니다. 에이전트를 위한 README 라고 소개합니다. 저장소는 MIT 라이선스이고 GitHub Star 는 2만 4천 개 선입니다.

## AGENTS.md 는 CLAUDE.md 가 없을 때만 읽힌다

공식 문서는 저장소에 어떤 파일이 있는지에 따라 무엇을 읽는지를 표로 정리해 뒀습니다.

| 저장소에 있는 것 | Claude 가 읽는 것 |
|---|---|
| `AGENTS.md`, 그리고 작업 디렉터리와 그 위에 `CLAUDE.md`·`CLAUDE.local.md` 없음 | `AGENTS.md` |
| `AGENTS.md`, 그리고 작업 디렉터리나 그 위에 `CLAUDE.md`·`CLAUDE.local.md` 있음 | `CLAUDE.md` 파일만 |
| `@AGENTS.md` 를 import 하는 `CLAUDE.md` | `CLAUDE.md`, import 로 들어온 `AGENTS.md` 포함 |

가운데 줄이 이번 변경의 실제 모습입니다. 두 파일을 합쳐 읽는 동작은 기본값에 없습니다. `AGENTS.md` 는 `CLAUDE.md` 가 없을 때 대신 읽히는 파일입니다.

## `CLAUDE.local.md` 하나가 판정을 뒤집는다

그럼 어떤 파일이 "`CLAUDE.md` 가 있다"는 판정에 들어갈까요? 문서가 두 가지로 나눠 적어 뒀습니다.

- **판정에 들어가는 파일** — 작업 디렉터리와 그 위 모든 디렉터리의 `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md`. 하나라도 있으면 `AGENTS.md` 대신 이 파일들을 읽습니다.
- **판정에 안 들어가는 파일** — `~/.claude/CLAUDE.md`, 조직이 관리하는 `CLAUDE.md`, `.claude/rules/` 파일. 이것들은 `AGENTS.md` 와 함께 계속 로드됩니다.

`CLAUDE.local.md` 가 판정에 들어간다는 대목은 한 번 더 볼 만합니다. `AGENTS.md` 로 규약을 관리하는 저장소에서 커밋하지 않을 개인 지시를 `CLAUDE.local.md` 에 적어 두면 그 순간부터 `AGENTS.md` 가 읽히지 않습니다. 개인 파일을 유지하면서 `AGENTS.md` 도 읽게 하려면 아래 설정을 `claude-md-and-agents-md` 로 바꿔야 합니다.

읽혔는지 확인하는 방법도 있습니다. 대화형 세션에서는 `no CLAUDE.md found; AGENTS.md loaded: /home/you/repo/AGENTS.md` 같은 줄이 뜹니다. 세션 시작 시점에는 작업 디렉터리와 상위 디렉터리의 `AGENTS.md` 와 `.claude/AGENTS.md` 를 읽습니다. 그 뒤 하위 디렉터리의 파일을 Read 도구로 열 때 그 디렉터리에 `CLAUDE.md` 세 종류가 없으면 거기 있는 `AGENTS.md` 도 읽습니다. 반대로 `AGENTS.local.md`·`AGENTS.override.md`·`.agents/` 아래 파일은 읽지 않습니다.

## 둘 다 읽게 하려면 Project instructions

기본값을 바꾸려면 세션에서 `/config` 를 입력해 설정 패널의 **Project instructions** 를 고칩니다. 값은 네 가지입니다.

- `claude-md-or-agents-md` — 기본값. `CLAUDE.md` 가 없을 때만 `AGENTS.md` 를 읽습니다.
- `claude-md-and-agents-md` — 두 파일을 함께 읽습니다. 디렉터리마다 `CLAUDE.md` 를 먼저, `AGENTS.md` 를 그다음에 읽습니다. 이미 import 나 심볼릭 링크로 들어온 파일은 두 번 읽지 않습니다.
- `claude-md` — `CLAUDE.md` 만 읽습니다.
- `managed-only` — 조직이 관리하는 `CLAUDE.md` 와 자동 메모리만 읽습니다.

설정 파일에 직접 적어도 됩니다. 내장 `agents-md` 플러그인의 `pluginConfigs` 항목입니다.

```json
{
  "pluginConfigs": {
    "agents-md@builtin": {
      "options": { "instructionFiles": "claude-md-and-agents-md" }
    }
  }
}
```

이 값은 `~/.claude/settings.json`, `--settings` 파일, 관리 설정에서만 읽습니다. 프로젝트 설정과 로컬 설정 파일에 적으면 Claude Code 가 무시합니다. 저장소에 커밋해서 팀 전체에 같은 값을 적용하는 방식은 막혀 있는 셈입니다.

## 지원이 붙지 않는 세션

버전을 올렸는데도 **Project instructions** 항목이 `/config` 에 안 보이는 경우가 있습니다. 문서가 네 가지를 적어 뒀습니다. 2.1.277 이전 버전, Amazon Bedrock 같은 서드파티 공급자를 쓰거나 텔레메트리를 꺼서 기능 플래그를 받지 못하는 세션, 설치나 업그레이드 직후의 첫 세션, 그리고 `disableAllHooks`·`allowManagedHooksOnly` 를 설정했거나 `agents-md` 플러그인을 끈 경우입니다. 이런 세션에서는 `CLAUDE.md` 만 읽습니다.

설정으로 읽은 `AGENTS.md` 는 `CLAUDE.md` 와 다르게 취급되는 부분도 있습니다. `/memory` 와 `/context` 의 메모리 파일 목록에 나오지 않습니다. `InstructionsLoaded` 훅도 뜨지 않습니다. `--add-dir` 로 추가한 디렉터리의 `AGENTS.md` 역시 로드되지 않습니다. 그래서 기존의 `@AGENTS.md` import 방식은 아직 쓸모가 남아 있습니다.

## 기존 우회 설정을 정리하는 법

이미 `AGENTS.md` 를 읽히려고 무언가 해 뒀다면 이번에 손볼 것이 있습니다.

- `@AGENTS.md` import 가 들어 있는 `CLAUDE.md` 는 그대로 둬도 됩니다. 어떤 설정값에서도 같은 파일을 두 번 읽지 않습니다.
- `CLAUDE.md` 에 "`AGENTS.md` 를 읽어라"라고 문장으로 적어 둔 경우는 다릅니다. Claude 가 그 파일을 열기로 결정해야 내용이 들어갑니다. 그 문장을 `@AGENTS.md` import 로 바꾸는 편이 확실합니다.
- `SessionStart` 훅으로 `AGENTS.md` 내용을 출력하고 있었다면 제거합니다. 그대로 두면 같은 내용이 컨텍스트에 두 번 들어갑니다.
- 심볼릭 링크는 둬도 되고 지워도 됩니다. 다만 Edit·Write 도구는 심볼릭 링크를 통한 쓰기를 거부하고 링크가 가리키는 `AGENTS.md` 를 고치라고 안내합니다. Windows 를 쓰는 사람이 저장소를 클론한다면 링크 대신 import 를 쓰는 편이 안전합니다.

## 표준 쪽 명단에는 아직 Claude 가 없다

`agents.md` 저장소의 `public/logos/` 에는 로고 파일이 27개 있습니다. Codex, Cursor, Copilot, Gemini, Jules, Zed, Windsurf 같은 이름이 보이는데 Claude 나 Anthropic 항목은 없습니다. 2.1.277 이 나온 뒤에도 명단은 아직 그대로입니다.

이 목록과 문서의 판정 표를 같이 놓고 보면 이번 변경의 크기를 알 수 있습니다. 규약 파일을 하나로 모으는 일이 끝난 것은 아닙니다. Claude Code 가 읽을 수 있는 파일이 한 종류 늘었고 어느 파일을 먼저 읽을지 정하는 규칙도 같이 늘었습니다. `CLAUDE.md` 를 루트에 두고 써 온 저장소라면 이번 업데이트로 달라지는 것이 없습니다. 이 관점에서 보면 "지원됨"이라는 말만 읽고 옆에 `AGENTS.md` 를 두었을 때 오히려 헷갈리기 쉽습니다. 어느 파일이 읽혔는지부터 세션 첫 줄에서 확인하는 편이 빠릅니다.

## 참고 자료

- [How Claude remembers your project — Claude Code Docs](https://code.claude.com/docs/en/memory)
- [Claude Code CHANGELOG — anthropics/claude-code](https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md)
- [Feature Request: Support AGENTS.md (#6235) — anthropics/claude-code](https://github.com/anthropics/claude-code/issues/6235)
- [agentsmd/agents.md — GitHub](https://github.com/agentsmd/agents.md) (이미지 출처, MIT License)
