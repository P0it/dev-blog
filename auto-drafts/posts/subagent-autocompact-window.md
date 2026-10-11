---
title: 서브에이전트에 일을 넘긴 뒤 따로 도는 컨텍스트 창
slug: subagent-autocompact-window
tags: [Claude Code, AI 에이전트, 컨텍스트 엔지니어링]
category: insights
cover_image: REHOST:https://platform.claude.com/docs/images/context-window.svg
---

> 2026년 10월 9일 Claude Code 2.1.296 이 `autoCompactWindow` 를 서브에이전트 프런트매터에 추가했습니다. 서브에이전트의 컨텍스트 창이 부모 세션과 어떤 점에서 다르게 도는지, 자동 압축이 언제 시작되고 압축 뒤에 무엇이 돌아오지 않는지를 공식 문서에 적힌 범위로 정리했습니다.

조사나 테스트 실행을 서브에이전트에 넘겨 보셨다면 그 이유도 비슷하실 겁니다. 중간 결과를 메인 대화에 쌓지 않으려는 것입니다. 그러면 서브에이전트 안쪽 창은 어떻게 차는 걸까요? 부모와 따로 찹니다. 창 크기도 압축 시점도 그 서브에이전트가 쓰는 모델을 기준으로 정해집니다. 예를 들어볼까요? 메인 대화를 Opus 로 돌리면서 서브에이전트에만 `model: haiku` 를 적어 두면 그 서브에이전트는 Haiku 의 창을 받습니다. 이 구조를 알면 사람이 보지 않는 파이프라인에서 어느 창이 먼저 차는지 알게 됩니다.

## 서브에이전트 창 크기를 정하는 모델

공식 문서는 이 점을 한 줄로 적어 뒀습니다. 서브에이전트의 컨텍스트 창은 **자기 모델 크기로 정해지고** 부모의 것을 물려받지 않습니다. 창이 더 작은 모델에 일을 넘기면 그 서브에이전트는 작은 창을 받습니다.

모델은 네 단계로 결정됩니다. 호출할 때 넘긴 `model` 인자가 가장 앞입니다. 그다음이 서브에이전트 정의의 `model` 프런트매터이고 거기에 `inherit` 를 적으면 메인 대화의 모델을 씁니다. 둘 다 없으면 `CLAUDE_CODE_SUBAGENT_MODEL` 환경변수를 봅니다. 그것도 없으면 메인 대화의 모델로 떨어집니다.

모델이 창 크기만 정하는 것은 아닙니다. 그 창에 무엇이 남는지도 모델에 따라 다릅니다. Claude Opus 4.5 이후, Sonnet 4.6 이후, Haiku 5.5, Fable 5.1 같은 모델은 앞 턴의 thinking 블록을 기본으로 남기고 그만큼 입력 토큰으로 셉니다. 그 앞 세대의 Opus·Sonnet 과 Haiku 4.5 까지의 모델은 되돌려 보낸 thinking 블록을 API 가 알아서 떼어 냅니다. 아래 도식이 떼어 내는 쪽 모델의 동작입니다.

![thinking 블록을 떼어 내는 모델의 턴 구조. 각 턴의 thinking 블록은 출력에서 생성되고 다음 턴의 입력으로는 넘어가지 않는다](REHOST:https://platform.claude.com/docs/images/context-window-thinking.svg)

부모를 Opus 로 두고 서브에이전트를 Haiku 4.5 로 내려 두면 두 창은 크기가 다르고 누적되는 내용도 다릅니다.

## 모델마다 다른 자동 압축 시작 시점

창을 따로 정하지 않으면 Claude Code 는 모델의 컨텍스트 한도에 닿을 때 압축합니다. 다만 예외가 여러 가지 있습니다.

- 클라우드 세션은 한도에 가까워지면 압축합니다
- 네이티브 1M 창으로 도는 모델은 창이 다 차기 전, 기본값으로 **약 967K 토큰**에서 압축합니다. Fable 계열, Sonnet 5 이후, Haiku 5.5, Opus 4.7 이후가 여기에 듭니다
- extended context 를 쓰지 않는 Sonnet 4.6 과 Opus 4.6 은 200K 경계에서 압축합니다
- `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` 을 걸면 네이티브 1M 모델도 200K 경계에서 압축합니다
- Claude Code 가 모르는 모델 ID 로 도는 세션은 그 ID 에 가정된 창 크기에서 압축합니다

![턴이 쌓이면서 컨텍스트 창이 토큰 한도에 가까워지는 과정](REHOST:https://platform.claude.com/docs/images/context-window.svg)

목록을 보면 서브에이전트 하나가 어디서 압축될지는 그 서브에이전트의 모델을 확인해야 알 수 있습니다. 메인 대화가 967K 에서 압축되는 세션이라도, 창이 200K 인 모델에 넘긴 서브에이전트는 그 200K 한도에서 압축됩니다.

## 프런트매터 한 줄로 내려온 창 설정

10월 9일 2.1.296 이 더한 것이 이 대목입니다. `autoCompactWindow` 를 서브에이전트 프런트매터와 `--agents` 정의에 적을 수 있게 됐습니다. 공식 설명은 서브에이전트가 메인 대화의 창보다 먼저 auto-compact 할 수 있도록 하는 것이라고 적혀 있습니다.

그전까지 이 창을 정하는 곳은 네 군데였습니다. 비교해 보면 아래와 같습니다.

| | 적는 곳 | 적용 범위 |
|---|---|---|
| `/autocompact 500k` | 사용자 설정의 `modelSettings` | 현재 모델, 이후 세션까지 |
| `autoCompactWindow` | 설정 파일 | 모든 모델 |
| `--autocompact` | 실행 플래그 | 그 실행 한 번 |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | 환경변수 | 명령·플래그·설정보다 우선 |

값의 범위는 100K 에서 1M 토큰 사이이고 모델의 컨텍스트 창을 넘지 못합니다. 환경변수는 `500000` 같은 플레인 토큰 수만 받습니다. `500k` 로 적으면 `500` 으로 읽혀 최소값인 100K 로 떨어집니다.

압축 시점을 더 앞당기는 설정도 있습니다. `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` 는 이 창의 몇 퍼센트에서 압축을 시작할지를 1 에서 100 사이로 정합니다. 기본보다 높은 값은 무시되니 시점을 앞당기는 쪽으로만 쓰는 변수입니다. 문서는 이 변수가 메인 대화와 서브에이전트에 모두 적용된다고 적어 뒀습니다.

## 압축 뒤에 돌아오지 않는 스킬 본문

압축은 오래된 대화를 요약으로 바꿔 넣습니다. 무엇이 되살아나는지는 그 내용이 어떻게 실렸는지에 따라 다릅니다. 프로젝트 루트의 CLAUDE.md 와 오토 메모리는 디스크에서 다시 주입되고 git 상태는 새로 읽어 옵니다. Claude 가 읽거나 고친 파일은 최근 수정된 것부터 다섯 개까지 다시 읽습니다.

스킬은 사정이 다릅니다. 호출된 스킬 본문도 다시 주입되지만 **스킬당 5,000 토큰, 합계 25,000 토큰**으로 묶이고 넘치면 오래된 것부터 버려집니다. 잘릴 때는 파일 앞부분이 남습니다.

여기에 하루 앞선 2.1.295 의 변경을 겹쳐 읽으면 서브에이전트에서 이 상한이 특히 빨리 걸립니다. 서브에이전트는 `skills` 필드에 적은 스킬을 최대 32개까지 시작할 때 본문째로 싣거든요. 32개를 적어 둔 서브에이전트가 한 번 압축되면, 문서에 적힌 두 규칙대로라면 합계 25,000 토큰에 들어가는 만큼만 돌아옵니다. 스킬 본문 앞쪽에 중요한 지시를 두라는 권고의 근거가 이 상한입니다.

## 무인 세션에서 먼저 볼 값

사람이 보지 않는 세션에서는 압축이 일어났다는 사실이 드러나지 않습니다. 서브에이전트 기록에는 압축된 곳이 `compact_boundary` 로 남고 `preTokens` 에 압축 직전 토큰 수가 들어갑니다. 무인으로 도는 파이프라인이라면 이 값부터 확인합니다.

10월 9일의 변경을 한 줄로 줄이면 이렇습니다. 서브에이전트의 창은 원래부터 부모와 따로 돌고 있었고 이제 그 창 크기를 서브에이전트 정의 쪽에서 적을 수 있습니다. 메인 대화를 아끼려고 일을 넘긴 것이라면 아껴진 쪽보다 넘겨받은 쪽의 창을 확인해 볼 만합니다.

## 참고 자료

- [Context windows — Claude API](https://platform.claude.com/docs/en/build-with-claude/context-windows) — 본문 공식 도식 2장의 출처
- [Subagents — Claude Code](https://code.claude.com/docs/en/sub-agents) — 모델 결정 순서, 자기 모델 기준 창, `compact_boundary`
- [Model configuration — Claude Code](https://code.claude.com/docs/en/model-config) — 창을 정하는 네 곳과 기본 압축 시점
- [Context window — Claude Code](https://code.claude.com/docs/en/context-window) — 압축이 되살리는 것과 스킬 본문 상한
- [Claude Code changelog](https://code.claude.com/docs/en/changelog) — 2026년 10월 9일 2.1.296 의 `autoCompactWindow` 항목
