---
title: 에이전트 1,000대의 순서는 모델이 쓴 스크립트가 정한다
slug: dynamic-workflows-script-orchestration
tags: [Claude Code, AI 에이전트, 업무 자동화]
category: insights
cover_image: REHOST:https://platform.claude.com/docs/images/workflow-anatomy.svg
---

> 2026년 10월 9일 Claude Managed Agents 에 dynamic workflows 가 베타로 들어왔습니다. 에이전트가 오케스트레이션 프로그램을 직접 작성하고 서버가 그것을 백그라운드에서 실행하는 방식입니다. 같은 기능이 먼저 들어가 있던 Claude Code 와 비교해 한도와 확인 수단이 어떻게 다른지 공식 문서에 적힌 범위로 정리했습니다.

파일 수백 개를 에이전트 한 대에 맡겨 본 적이 있다면 어디서 막히는지 아실 겁니다. 작업을 나눠 던지는 것까지는 되는데 중간 결과가 전부 대화에 누적되고 그만큼 모델이 다음에 무엇을 할지 흐려집니다. 10월 9일 Claude Managed Agents 에 들어온 dynamic workflows 는 그 순서를 대화 밖으로 옮겼습니다. **에이전트가 프로그램을 직접 작성하면** 런타임이 그것을 백그라운드에서 실행합니다. 반복과 분기와 중간 결과는 프로그램 안에 머물고 모델의 컨텍스트에는 마지막 답만 들어옵니다. 예를 들어볼까요? 계약서 300건을 검토하라고 하면 에이전트는 한 건에 한 대씩 붙이는 워크플로를 작성해 서버에 넘기고 자기는 사용자와 대화를 계속합니다. 이 구조를 알면 사람 없이 돌리기 전에 무엇을 확인해야 하는지 알게 됩니다.

## 10월 9일에 켜진 workflows 설정

Anthropic 은 2026년 10월 9일 API 릴리스 노트에서 Managed Agents 의 dynamic workflows 를 베타로 공개했습니다. 베타 헤더는 `managed-agents-2026-04-01` 이고 에이전트 정의의 `multiagent` 필드를 이렇게 적으면 켜집니다.

```json
{"multiagent": {"type": "multiagent_20261001", "workflows": {"type": "enabled"}}}
```

`multiagent_20261001` 타입에서는 서브에이전트 위임과 워크플로가 둘 다 기본으로 켜집니다. 워크플로만 쓰려면 `subagents` 를 `{"type": "disabled"}` 로 적습니다.

시작 방법이 조금 특이합니다. 런을 시작하는 별도 API 호출이 없습니다. 작업을 `user.message` 로 설명하면 **에이전트가 런을 시작할지 말지를 스스로 판단합니다.** 그래서 문서는 시스템 프롬프트로 그 판단을 유도하라고 적어 뒀고 계약서 검토 에이전트의 예시를 그대로 보여 줍니다.

```text
You review contracts. When you're asked to review more than a few contracts,
start a workflow run that reads them in parallel and combines the findings.
Review one or two contracts yourself, without a run.
```

## 워크플로 런을 이루는 세 층

그럼 에이전트가 쓴 그 프로그램은 어떤 모양으로 실행될까요? 런은 세 층으로 되어 있습니다. 서버가 백그라운드에서 돌리는 **런**, 런이 선언한 **페이즈**, 그리고 페이즈 안에서 에이전트 한 대가 각각 차지하는 **세션 스레드**입니다. 공식 문서의 다이어그램이 이 세 층을 한 장에 그려 뒀습니다.

![워크플로 런의 구조. 런 안에 페이즈가 둘 있고 각 페이즈 안에서 에이전트 스레드가 돌며 결과가 앞 페이즈에서 다음 페이즈로 넘어간다](REHOST:https://platform.claude.com/docs/images/workflow-anatomy.svg)

페이즈는 "계약서 읽기"처럼 이름이 붙은 단계이고 진행 상황은 이 페이즈 이벤트로 확인합니다. 프로그램이 할 수 있는 일은 네 가지입니다.

- 에이전트 여러 대를 동시에 띄웁니다
- 한 에이전트가 돌려준 결과를 다음 에이전트에게 넘깁니다
- 받은 결과를 보고 다음에 무엇을 실행할지 결정합니다
- 에이전트 한 대가 실패했을 때 그것을 처리하거나 런을 끝냅니다

페이즈 안에서 반복도 됩니다. 검토를 통과할 때까지, 또는 정해 둔 횟수를 다 쓸 때까지 초안을 고치게 만들 수 있습니다.

한 런의 스레드는 세션의 샌드박스를 공유합니다. 파일은 다 같이 보고 대화 이력만 각자 따로 갖습니다.

## 중간 결과가 컨텍스트에서 변수로 옮겨 간 이유

서브에이전트 위임과 무엇이 다른지가 이 기능의 핵심입니다. Claude Code 문서는 그 차이를 **계획을 누가 들고 있는가**로 정리했습니다. 서브에이전트에서는 모델이 턴마다 다음에 무엇을 띄울지 결정하고 결과가 전부 컨텍스트 윈도로 들어옵니다. 워크플로에서는 반복과 분기와 중간 결과를 스크립트가 직접 갖고 있어서 모델의 컨텍스트에는 최종 답만 남습니다.

계획이 코드로 내려가면 규모만 늘어나는 게 아닙니다. 같은 품질 패턴을 매번 똑같이 적용할 수 있습니다. 서로 독립된 에이전트가 상대의 발견을 반박하게 만든 다음 살아남은 것만 보고하게 하거나, 계획을 여러 각도에서 따로 작성해 견주게 만드는 방식입니다. Claude Code 에 내장된 `/deep-research` 가 그 모양으로 돌고 교차 검증을 통과하지 못한 주장은 보고서에서 빠집니다. 검증 자체가 안 된 주장은 반박된 것으로 세지 않고 미확인으로 남겨 둡니다.

반대쪽 한도도 분명합니다. Managed Agents 에서 위임은 한 단계까지만 내려가고 세션이 동시에 가질 수 있는 자식 스레드는 유휴 상태까지 합쳐 25개입니다. 워크플로 런의 스레드는 그 한도에서 빠집니다.

## Claude Code 와 Managed Agents 의 한도 비교

같은 기능이지만 두 표면의 숫자가 다릅니다. 로컬 CPU 를 쓰는 쪽과 서버가 돌리는 쪽이라 그렇습니다.

| | Claude Code | Managed Agents |
|---|---|---|
| 동시 실행 | 기본 16대, `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` 로 1~256 | 한 런에서 64대 |
| 런당 총 에이전트 | 1,000대 | 1,000대 |
| 한 호출에 넘기는 목록 | `parallel()`·`pipeline()` 에 4,096개 | 문서에 수치 없음 |
| 런 수명 | 세션이 끝나면 멈춘다(백그라운드로 넘기면 유지) | 기본 24시간 |
| 동시에 열린 런 | 문서에 수치 없음 | 세션당 기본 10개 |
| 규모가 커지면 | 25대 초과 또는 예상 토큰 150만 초과면 경고 | 세션 예산에 닿으면 일시 정지 |

런에는 자기 가격이 따로 없습니다. 에이전트들이 쓴 토큰이 모델별 단가로 그대로 청구됩니다. 세션 예산에 닿으면 열려 있던 런이 전부 멈추고 세션은 `budget_reached` 와 함께 유휴로 바뀝니다. 각 스레드는 이미 시작한 모델 요청을 마치므로 **일하던 스레드 수만큼 예산을 넘길 수 있습니다.** 예산을 올리거나 없애면 멈춰 있던 런이 다시 실행됩니다.

![워크플로 런의 상태 전이. 실행 중과 유휴와 종료 사이를 무엇이 옮기는지 보여 준다](REHOST:https://platform.claude.com/docs/images/workflow-run-states.svg)

## 워크플로 코드를 읽는 두 가지 방법

여기서 두 표면의 차이가 가장 큽니다. 모델이 쓴 그 프로그램을 읽는 방법이 서로 다릅니다.

Claude Code 는 **그 스크립트를 파일로 남깁니다.** 런마다 스크립트를 세션 디렉터리(`~/.claude/projects/` 아래)에 기록하고 그 경로를 모델에게 넘깁니다. 실행 승인 화면에 계획된 페이즈 목록이 뜨고 거기서 raw 스크립트를 열어 볼 수 있습니다. 마음에 들면 `/workflows` 에서 `s` 를 눌러 `.claude/workflows/` 에 저장합니다. 그러면 그다음부터 `/<이름>` 커맨드로 다시 실행됩니다. 이전 런의 스크립트와 비교하거나 고쳐서 실행하는 것도 됩니다.

Managed Agents 문서는 반대로 적어 뒀습니다. **워크플로의 코드는 보이지 않습니다.** 런을 시작하고 관리하는 도구 호출도, 각 스레드가 프로그램에 돌려준 결과도 API 로는 나오지 않습니다. 대신 런이 끝나고 세션이 유휴가 된 다음 에이전트에게 직접 물어보라고 적혀 있고 물어볼 문장까지 문서가 제시합니다.

```text
Print the workflow that you started the run with, word for word, in one code block.
Do not start another run.
```

스레드가 어느 페이즈에서 일하는지 알려 주는 필드도 없습니다. 진행 상황은 페이즈 이벤트로 확인하고 스레드는 `session_thread_id` 로 구분합니다. 무인 파이프라인을 설계하는 관점에서 보면 이 대목이 가장 신경 쓰입니다. 결정이 모델의 문장에서 프로그램으로 내려간 건 분명한 진전인데 그 프로그램이 API 쪽에서는 사후에 모델의 진술로만 확인된다는 뜻이거든요.

## 사람 없이 돌리기 전에 확인할 것

재실행을 같은 순서로 반복시키기 위해 Claude Code 는 스크립트 안에서 `Date.now()` 와 `Math.random()`, 인자 없는 `new Date()` 를 아예 예외로 던지게 만들어 뒀습니다. 시각이 필요하면 `args` 로 넘깁니다. 다시 실행하면 완료된 에이전트는 저장된 결과를 돌려주고 프롬프트가 이전과 달라진 첫 에이전트부터 다시 실행됩니다. 그 뒤 순서의 에이전트는 이미 끝났어도 함께 다시 돌아갑니다.

도구 쪽에도 조건이 붙습니다. 한 런이 같은 작업에 스레드를 두 개 만들 수 있으니, 에이전트가 부르는 도구는 **두 번 불려도 안전해야 합니다.** 결제·발송·쓰기처럼 되돌릴 수 없는 동작을 워크플로에 넣을 때는 이 문장을 먼저 봐야 합니다.

규모는 미리 정해 둘 수 있습니다. Claude Code 의 사이즈 가이드라인은 `small` 5대 미만, `medium` 10대 미만, `large` 50대 미만이고 기본값은 `medium` 입니다. 한도가 아니라 조언으로 모델에게 전달되므로 작업이 더 큰 규모를 요구하면 그 숫자를 넘어갑니다. 조직 차원에서 아예 막으려면 관리 설정의 `disableWorkflows` 를 씁니다.

정리하면 확인할 것은 세 가지입니다. 예산과 한도를 먼저 걸어 둡니다. 에이전트가 부르는 도구를 두 번 불려도 안전하게 만듭니다. 그리고 런이 끝난 뒤 그 프로그램을 어디서 읽을지 정해 둡니다. 앞의 두 가지는 설정으로 끝나지만 마지막은 어느 표면을 쓸지 고르는 문제입니다. 같은 기능을 쓰면서도 검증 방식이 여기서 달라집니다.

## 참고 자료

- [Claude API release notes](https://platform.claude.com/docs/en/release-notes/api) — 2026년 10월 9일 dynamic workflows 항목
- [Multiagent orchestration — Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration)
- [Workflow runs — Claude Managed Agents](https://platform.claude.com/docs/en/managed-agents/workflow-runs) — 본문 다이어그램 2장의 출처
- [Orchestrate subagents at scale with dynamic workflows — Claude Code](https://code.claude.com/docs/en/workflows)
