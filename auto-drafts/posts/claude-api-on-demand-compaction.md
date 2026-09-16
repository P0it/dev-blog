---
title: 컨텍스트 압축은 더 이상 대화를 멈추지 않는다
slug: claude-api-on-demand-compaction
tags: [Claude API, 컨텍스트 압축]
category: insights
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/6e2cf532.svg
---

> 9월 14일 Claude API 에 두 번째 압축 방식이 베타로 올라왔습니다. 요약만 따로 받아서 원래 메시지들과 바꿔 넣는 방식입니다. 문서에 적힌 동작과 비용 계측이 어긋나는 대목을 정리했습니다.

에이전트를 몇 시간씩 실행하다 보면 응답이 유난히 늦어지는 순간이 옵니다. 컨텍스트가 한도 가까이 차서 API 가 그 요청 안에서 지금까지의 대화를 요약하는 중입니다. 그럼 이 요약을 대화가 진행되는 동안 미리 만들어 둘 수는 없을까요? 9월 14일 Claude Platform 릴리스 노트에 올라온 `compact-2026-09-04` 베타가 그 방법을 내놓았습니다. 요청 하나에 `"compaction": {"type": "summarize"}` 를 넣으면 답변 없이 요약 블록 하나만 돌아옵니다. 이 차이를 이해하면 긴 세션에서 지연과 비용을 어디에서 조절할 수 있는지 알게 됩니다.

## 임계치에 닿으면 요청 안에서 만들던 요약

지금까지 Claude API 의 압축은 한 가지였습니다. `compact_20260112` 로 임계치를 정해 두면 입력 토큰이 그 값에 닿는 순간 API 가 요약을 만듭니다. 기본값은 15만 토큰이고 최소 5만 토큰부터 지정할 수 있습니다.

![임계치 압축의 흐름. 입력 토큰이 지정한 값에 닿으면 Claude 가 요약을 compaction 블록에 쓰고 그대로 응답을 이어 간다](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/6e2cf532.svg)

중요한 건 이 요약이 **내 요청 안에서** 만들어진다는 점입니다. 답을 받으려고 보낸 요청이 도중에 요약 한 번을 더 거칩니다. 그래서 그 요청은 평소보다 오래 걸립니다. 문서는 이 방식을 threshold compaction 이라고 부릅니다.

## 답변 없이 서명 블록만 돌아오는 요청

새 베타는 요약을 만드는 일을 대화 밖으로 꺼냈습니다. 최상위 `compaction` 파라미터를 보내면 API 는 그 요청에 실린 메시지 전부를 한 번 요약하고 답변은 만들지 않습니다. 돌아오는 것은 `signature` 가 붙은 `compaction` 블록 하나이고 `stop_reason` 은 `"compaction"` 입니다.

여기서 두 방식이 달라집니다. 임계치 압축의 블록은 요약한 메시지들 **뒤에** 붙습니다. 반면 서명된 블록은 그 메시지들을 **대체**합니다. 그래서 다음 요청부터는 원본 메시지를 지우고 블록을 맨 앞에 보내야 하고 원본이 앞에 남아 있으면 400 에러(`compaction_block_misplaced`)가 납니다.

![단순 압축. 앞선 요청은 턴마다 thinking 이 붙은 전체 기록을 보내지만 다음 요청은 1~4 턴을 요약한 메시지 하나와 다음 지시만 보내므로 앞선 thinking 이 전혀 실리지 않는다](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/ff3265d8.svg)

저도 처음엔 호출 방식만 바꾼 편의 기능인 줄 알았습니다. 그런데 요약 요청이 대화에서 떨어져 나오면 **그 요청을 기다리지 않아도 된다**는 성질이 따라옵니다. 요약이 만들어지는 동안 대화는 원래 기록 그대로 진행하다가 블록이 도착하면 그때 바꿔 넣습니다. 문서가 async 또는 background compaction 이라고 부르는 형태입니다.

## threshold 압축과 on-demand 압축 비교

두 방식을 항목별로 비교해 보면 아래와 같습니다. `context_management` 와 `compaction` 은 한 요청에 같이 보낼 수 없으니 둘 중 하나를 고르게 됩니다.

| | threshold 압축 | on-demand 압축 |
|---|---|---|
| 베타 헤더 | `compact-2026-01-12` | `compact-2026-09-04` |
| 요약 시점 | 입력 토큰이 임계치에 닿을 때 | 내가 요청을 보낼 때 |
| 블록 위치 | 요약한 메시지들 뒤에 붙음 | 요약한 메시지들을 대체 |
| 대화 진행 | 그 요청이 끝날 때까지 기다림 | 백그라운드로 분리 가능 |
| 제공 범위 | Claude API·Bedrock·Google Cloud | Claude API 만 |

## 최근 턴과 그 thinking 을 살리는 keep-tail

세 번째 성질이 실무에서는 가장 크게 다가옵니다. 요약 요청에 **옛 턴만 보내면** 보내지 않은 최근 턴은 요약되지 않고 남습니다. 그 턴들을 블록 뒤에 그대로 붙이면 최근 대화는 원문으로 유지됩니다. keep-tail compaction 이라고 부르는 방식입니다.

그럼 남긴 턴에 들어 있던 thinking 은 어떻게 될까요? preserved thinking 이 걸린 모델은 앞선 thinking 블록이 지금 대화와 맞는지 검사합니다. 요약으로 앞이 통째로 바뀌면 이 검사에 걸립니다.

![keep-tail 압축. 1~2 턴을 요약한 뒤 3~5 턴을 원문 그대로 붙이면 3·4 턴의 thinking 이 검사에 걸리지만 같은 요청을 prefix_mismatch_behavior drop_block 으로 보내면 API 가 해당 블록을 떼고 input_transformations 에 기록한 뒤 통과시킨다](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/cbf1aeae.svg)

문서는 남긴 턴의 thinking 이 그대로 유효할 조건을 두 가지로 적어 뒀습니다. 남긴 턴이 요약한 메시지들 바로 뒤에 이어져 있을 것, 그리고 `system` 과 `defer_loading` 이 걸리지 않은 `tools` 가 요약 요청 때와 같을 것입니다. 이 조건을 맞추면 긴 세션이 압축을 겪고도 직전까지의 추론을 이어서 씁니다.

## 0 으로 찍히는 input_tokens

요약 호출도 과금되고 레이트리밋도 소모합니다. 그런데 응답의 최상위 `input_tokens` 와 `output_tokens` 는 **0** 입니다. 답변을 만들지 않았으니 0 이라는 설명입니다.

```json
"usage": {
  "input_tokens": 0,
  "output_tokens": 0,
  "iterations": [{ "type": "compaction", "input_tokens": 144, "output_tokens": 276 }]
}
```

실제로 쓴 토큰은 `usage.iterations` 안에만 들어있습니다. 최상위 값으로 비용을 집계해 온 코드는 압축을 켜는 순간부터 그 호출을 통째로 빠뜨립니다. 문서도 총량을 구하려면 `iterations` 전체를 합산하라고 적어 뒀습니다. 사용량 대시보드를 직접 만들어 쓰는 쪽이라면 여기를 먼저 고쳐야 합니다. 🧾

이미지와 문서는 블록이 원본을 대체하는 순간 사라집니다. `container_upload` 블록과 가져온 URL 도 마찬가지입니다. 요약은 그 내용을 들고 오지 못하니 뒤 턴에서 다시 필요하면 다시 올려야 합니다.

## 압축 시점을 고르는 쪽이 바뀐 것

같은 주에 Claude Code 2.1.273(9월 15일)이 LLM 게이트웨이용 요청 헤더를 추가했습니다. 다섯 개 중 `x-claude-code-compaction` 과 `x-claude-code-context-compacted` 두 개가 압축과 직접 관련됩니다. 게이트웨이가 압축 요청을 일반 요청과 구분해서 볼 수 있게 된 것입니다.

두 변경이 가리키는 방향은 같습니다. 압축이 한도에 닿으면 알아서 일어나는 일에서 내가 시점과 범위를 정하는 호출로 옮겨 오는 중입니다. 1인 개발자가 에이전트를 길게 실행하는 입장에서는 이제 언제 요약할지, 어디까지를 원문으로 남길지, 그 비용을 어느 항목으로 집계할지를 직접 정하게 됩니다.

## 참고 자료

- [Compaction — Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/compaction)
- [Preserved thinking — Claude Platform Docs](https://platform.claude.com/docs/en/build-with-claude/preserved-thinking)
- [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview)
- [Claude Code changelog](https://code.claude.com/docs/en/changelog)
