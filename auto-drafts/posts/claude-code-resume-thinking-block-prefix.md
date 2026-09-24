---
title: Claude Code 를 --resume 하면 앞의 추론을 기억할까요?
slug: claude-code-resume-thinking-block-prefix
tags: [Claude Code, thinking 블록, AI 에이전트]
category: insights
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-24/2a3b1103.svg
---

> Claude Code v2.1.282 가 9월 24일에 고친 항목 가운데 네 건이 전부 이어서 연 세션의 thinking 블록 문제였습니다. 공식 changelog 와 Claude API 문서, 재현 절차가 붙은 GitHub 이슈를 확인해 한 가지 규칙이 왜 네 가지 증상으로 나타나는지 정리했습니다.

어제 하던 작업을 오늘 `claude --resume` 으로 다시 여는 분들이 많을 겁니다. 터미널에는 어제 주고받은 대화가 그대로 올라옵니다. 그러면 모델도 어제 하던 생각을 그대로 이어받을까요? 조건이 맞을 때만 이어받습니다. thinking 블록에 붙어 오는 `signature` 가 그 블록 하나에만 걸려 있지 않고 **그 앞에 보낸 것 전부**에 묶여 있기 때문입니다. 시스템 프롬프트나 도구 목록이나 앞선 메시지 가운데 하나라도 달라지면 그 뒤의 추론은 무효가 됩니다. 9월 24일 릴리스에도 그런 항목이 있었습니다. `--tools` 목록에서 도구 하나가 빠진 채로 세션을 다시 열면 앞 턴 추론이 전부 사라지던 것을 고쳤습니다. 이 규칙을 알면 에이전트를 직접 만들 때 `messages` 배열을 어떻게 쌓아야 하는지 정할 수 있습니다.

## 9월 24일 릴리스에 몰린 수정 네 건

[v2.1.282 changelog](https://code.claude.com/docs/en/changelog) 에서 thinking 을 건드린 항목만 뽑으면 네 건입니다.

- 이어서 열거나 다시 연 세션(`--continue`, `--resume`)이 앞선 메시지를 바뀐 형태로 다시 보내, API 가 앞의 추론을 버리던 경우
- 모델이 작업하는 중에 `/model`·`/rename`·`/artifacts` 같은 즉시 실행 커맨드를 쓰면 앞선 thinking 이 빠지던 경우
- 대화 초반에 있던 기본 도구가 빠진 `--tools` 목록으로 다시 열면 앞 턴 thinking 을 잃던 경우
- `Invalid \`data\` in \`redacted_thinking\` block` 오류로 매 턴이 실패하던 경우

증상은 넷으로 갈리지만 걸린 곳은 한 군데입니다. 전부 **앞서 만들어 둔 thinking 블록을 다시 보내는 대목**입니다.

## thinking 블록이 들고 오는 signature

thinking 블록은 응답에서 `text` 블록보다 앞에 오는 내용 블록입니다. 모델이 답을 내기 전에 문제를 정리하고 방법을 시도해 본 내용이 여기 담깁니다.

![Claude 가 요청을 받아 생각할지 판단하고 도구를 쓰는 경우 도구 호출 사이에 다시 생각하며 한 응답에 thinking 블록과 text 블록을 함께 돌려주는 흐름](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-24/2a3b1103.svg)

블록에는 `signature` 필드가 같이 붙어 옵니다. [공식 문서](https://platform.claude.com/docs/en/build-with-claude/thinking)는 여기에 전체 추론이 암호화되어 들어 있다고 적어 뒀습니다. 블록을 되돌려 보내면 API 가 이 값으로 Claude 가 만든 블록이 맞는지 확인합니다. 문서는 이 값을 불투명한 값으로 다루라고 분명히 적어 뒀습니다. 직접 해석하거나 파싱하지 말라는 뜻입니다.

## 그대로 돌려줘야 하는 마지막 어시스턴트 메시지

첫 번째 규칙은 좁습니다. 마지막 어시스턴트 메시지 안에 연속으로 들어 있는 thinking 블록은 모델이 만든 그대로여야 합니다. 순서를 바꾸거나 내용을 고치거나 일부만 빼면 안 되고 `redacted_thinking` 블록도 똑같이 적용됩니다. 고친 블록은 400 오류로 거절됩니다.

이 규칙이 실제로 어떻게 깨졌는지는 [GitHub 이슈 #63147](https://github.com/anthropics/claude-code/issues/63147) 이 디스크 수준에서 보여 줍니다. 트랜스크립트에 저장된 블록이 이런 모양이었습니다.

```json
{ "type": "thinking", "thinking": "", "signature": "<base64 signature>" }
```

추론 텍스트는 빈 문자열로 비워졌는데 서명은 그대로 남았습니다. 세션을 다시 열면 이 모양 그대로 재조립되어 API 로 갑니다. 서명은 원래의 텍스트를 기준으로 만들어진 값이라 검증이 실패합니다. 그다음부터는 매 턴이 같은 400 으로 떨어집니다. 원래 텍스트가 이미 없으니 되돌릴 방법도 없습니다. 2026년 5월 28일에 v2.1.153 기준으로 등록된 이슈입니다. v2.1.282 가 넣은 방어책이 바로 이 대목입니다. `redacted_thinking` 블록의 `data` 가 유효하지 않으면 그 대화의 thinking 블록을 버리고 한 번 다시 시도합니다.

## signature 가 함께 묶는 앞쪽 전부

두 번째 규칙이 넷을 한꺼번에 설명합니다. [preserved thinking 문서](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking)를 보면 Claude Fable 5.1 부터 API 가 모든 `thinking`·`redacted_thinking` 블록의 서명을 두 가지로 확인합니다. 하나는 어떤 모델이 만든 블록인가입니다. 다른 하나는 **그 앞에 보낸 것이 전부 그대로인가**입니다.

여기서 "앞에 보낸 것"에 들어가는 항목은 세 가지입니다. 최상위 `system` 프롬프트, `tools` 배열, 그리고 그 블록보다 앞에 있는 `messages` 전부입니다. 셋 중 하나라도 달라지면 그 블록과 **그 뒤의 thinking 블록이 전부** 무효가 됩니다. 요청은 400 으로 거절됩니다. 설정을 바꿔 두면 거절 대신 해당 블록들이 오류 표시 없이 빠진 채로 처리됩니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>앞쪽 세 항목이 그대로일 때와 tools 가 바뀌었을 때 thinking 블록의 유효 여부가 갈리는 모습</title>
  <text x="60" y="86" style="fill: var(--fg-neutral); font-size: 17px">앞쪽이 그대로일 때</text>
  <rect x="60" y="110" width="120" height="64" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="120" y="148" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17px">system</text>
  <rect x="196" y="110" width="120" height="64" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="256" y="148" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17px">tools</text>
  <rect x="332" y="110" width="140" height="64" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="402" y="148" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17px">messages</text>
  <path d="M482 142 H516 M506 134 L516 142 L506 150"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="530" y="110" width="210" height="64" rx="14"
    style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <text x="635" y="148" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17px">thinking 유효</text>

  <text x="60" y="256" style="fill: var(--fg-neutral); font-size: 17px">tools 가 바뀌었을 때</text>
  <rect x="60" y="280" width="120" height="64" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="120" y="318" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17px">system</text>
  <rect x="196" y="280" width="120" height="64" rx="14"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="256" y="318" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17px">tools</text>
  <rect x="332" y="280" width="140" height="64" rx="14"
    style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="402" y="318" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17px">messages</text>
  <path d="M482 312 H516 M506 304 L516 312 L506 320"
    style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none"
    stroke-linecap="round" stroke-linejoin="round" />
  <rect x="530" y="280" width="210" height="64" rx="14"
    style="fill: var(--diag-red-fill); stroke: var(--diag-red-stroke); stroke-width: 2.5" />
  <text x="635" y="318" text-anchor="middle" style="fill: var(--fg-strong); font-size: 17px">thinking 무효</text>
</svg>
```

## --tools 하나가 빠지면 벌어지는 일

이제 앞의 네 건이 같은 규칙으로 읽힙니다. `--tools` 목록을 좁혀서 세션을 다시 열면 `tools` 배열이 달라집니다. 배열에서 도구를 더하거나 빼거나 고치는 것은 전부 앞쪽을 바꾸는 동작입니다. 그 대화에 쌓여 있던 thinking 블록이 한꺼번에 무효가 됩니다. 도구를 하나 줄였을 뿐인데 어제까지의 추론이 사라지는 이유가 여기 있습니다.

앞선 메시지를 바뀐 형태로 다시 보내던 경우도 같습니다. 문서는 앞선 `user`·`assistant`·`system` 메시지를 고치거나 순서를 바꾸거나 지우는 것, 도구 결과를 짧게 자르는 것, 이미지를 그 자리에서 다시 인코딩하는 것을 전부 앞쪽 변경으로 셉니다. 반대로 메시지를 뒤에 덧붙이는 것, `cache_control` 표시를 옮기는 것, `max_tokens` 나 `tool_choice` 를 바꾸는 것은 앞쪽 변경이 아닙니다.

## 모델마다 갈리는 앞 턴 thinking 보관

앞 턴 thinking 블록을 기본으로 들고 갈지는 모델마다 다릅니다. 비교해 보면 아래와 같습니다.

| | 전부 보관 | 마지막 턴만 보관 |
|---|---|---|
| Opus | Opus 4.5 이후 | 그 이전 Opus |
| Sonnet | Sonnet 4.6 이후 | 그 이전 Sonnet |
| Haiku | 없음 | Haiku 4.5 까지 전부 |
| 그 밖 | Fable 5.1 · Mythos 5.1 · Fable 5 · Mythos 5 · Mythos Preview | — |
| 컨텍스트 | 긴 대화에서 계속 쌓임 | 턴마다 빠짐 |

아래 다이어그램은 마지막 턴만 보관하는 쪽을 그린 것입니다. thinking 이 도구 결과와 함께 그 어시스턴트 턴 동안만 남아 있다가 다음 사용자 턴에서 빠지는 모습입니다.

![앞 턴 thinking 블록을 버리는 모델에서 thinking 이 도구 결과와 함께 유지되다가 다음 사용자 턴에서 빠지는 흐름을 그린 다이어그램](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-24/20af05a9.svg)

대화 도중에 모델을 바꿀 때는 방향이 중요합니다. Claude Opus 5.5 는 Claude Opus 5 와 그 이전 Opus·Sonnet·Haiku 의 블록을 읽지만 Claude Fable·Mythos 계열의 블록은 읽지 못합니다. 반대로 Claude Fable 5.1 은 Claude API 에서 Opus 5.5 의 블록을 읽습니다. 위로 올려 바꾸면 앞선 추론이 유지되고 아래로 내려 바꾸면 빠집니다. 읽지 못하는 블록은 오류 없이 빠지고 과금도 되지 않습니다.

## 편집 대신 쓰라고 만들어 둔 것들

앞쪽을 손대지 말라고만 하면 곤란한 상황이 많습니다. 시스템 프롬프트에 오늘 날짜를 넣어야 할 때가 있습니다. 세션 중간에 도구를 하나 막아야 하거나 길어진 대화를 줄여야 할 때도 있습니다. 문서는 그 각각을 대신할 방법을 따로 정해 뒀습니다.

| 하려던 편집 | 대신 쓸 것 |
|---|---|
| 최상위 `system` 문자열 갱신 | 대화 중간 `system` 메시지를 뒤에 덧붙이기 |
| 첫 `user` 메시지를 새 값으로 다시 렌더 | 바뀐 내용을 최신 턴에 적기 |
| `tools` 배열 수정 | `tool_addition`·`tool_removal` 블록 |
| 매 턴 리마인더를 넣었다 지우기 | `clear_at` 을 붙인 턴 스코프 `system` 메시지 |
| 최상위 `output_config.effort` 변경 | 메시지별 `output_config` |
| 클라이언트에서 오래된 턴 잘라내기 | 서버 쪽 compaction·context editing |

공통점은 하나입니다. 이미 보낸 것을 고치는 대신 새 내용을 뒤에 덧붙이는 형태로 바꿉니다. 문서가 권하는 형태도 그것입니다. `system` 과 `tools` 는 세션 내내 고정해 두고 `messages` 에는 덧붙이기만 합니다. 어시스턴트 턴은 받은 그대로 돌려보냅니다. 추론 텍스트가 비어 있는 thinking 블록이라도 그대로 돌려보내라고 적혀 있습니다.

## 내 계정이 이미 걸리는지 확인하는 법

이 검사가 모든 계정에 같은 방식으로 적용되지는 않습니다. **2026년 8월 31일 00:00 UTC 이후에 만들어진 계정**은 기본으로 검사가 돌고 어긋나면 400 을 받습니다. 그 전에 만든 계정은 요청에 `thinking.block_binding.prefix_mismatch_behavior` 를 직접 설정했을 때만 검사가 돕니다.

확인은 간단합니다. 베타 헤더 없이 앞쪽을 바꾼 요청을 한 번 보내 보고 400 이 돌아오면 기본 적용되는 계정입니다. 더 자세히 보려면 `thinking-binding-controls-2026-08-01` 베타 헤더를 붙입니다. 응답의 `input_transformations` 배열에 빠진 블록과 그 이유가 실려 옵니다. `prefix_binding_mismatch` 면 앞쪽이 바뀐 것이고 `model_binding_mismatch` 면 현재 모델이 읽지 못하는 블록이라 빠진 것입니다.

계정 생성일을 따지는 대신 처음부터 덧붙이기만 하는 형태로 만들어 두면 이 구분 자체가 필요 없어집니다. 문서도 계정 나이와 무관하게 같은 코드가 돌게 하라고 권합니다.

## 한 릴리스가 같은 곳을 네 번 고친 이유

9월 24일 changelog 를 처음 봤을 때는 관련 없는 버그 네 개로 읽혔습니다. 규칙을 놓고 다시 보면 하나입니다. 세션을 이어서 여는 동작은 화면에 대화를 다시 띄우는 것으로 끝나지 않습니다. 앞선 요청을 바이트 단위로 똑같이 재구성하는 일까지 포함합니다. 재구성이 조금이라도 어긋나면 서명이 맞지 않고 그 뒤의 추론이 통째로 빠집니다.

에이전트를 직접 만들어 `messages` 를 손으로 쌓는 쪽에서 보면 여기서 제일 걸리기 쉬운 처리가 따로 있습니다. 요청마다 시스템 프롬프트를 다시 만들어 넣는 코드입니다. 오늘 날짜나 현재 브랜치 같은 값을 매번 새로 렌더하면 그 자체로 앞쪽이 매번 달라집니다. 동작은 멀쩡해 보이는데 모델은 매 요청마다 앞선 추론을 잃은 상태로 답하게 됩니다. 내 코드가 그런 모양인지는 `input_transformations` 를 한 번 찍어 보면 바로 알 수 있습니다.

## 참고 자료

- [Claude Code changelog — Claude Code Docs](https://code.claude.com/docs/en/changelog)
- [Thinking — Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/thinking)
- [Preserved thinking — Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking)
- [Extended thinking — Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
- [Issue #63147 — anthropics/claude-code](https://github.com/anthropics/claude-code/issues/63147)
