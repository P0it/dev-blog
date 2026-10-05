---
title: Strands Decider 2B 가 텍스트 대신 돌려주는 숫자
slug: strands-decider-2b-calibrated-confidence
tags: [AI 에이전트, LLM 서빙, 업무 자동화]
category: insights
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-05/400be554.svg
---

> AWS Strands Labs 가 10월 1일 공개한 Strands Decider 2B 는 문장을 만들지 않고 주어진 선택지 중 하나를 골라 그 선택에 붙은 confidence 를 함께 돌려줍니다. 저장소에 공식 figure 21장과 preregistration 14건이 같이 올라와 있어 이 모델이 무엇을 잘하고 어디서 멈추는지를 발표 문구가 아니라 측정값으로 확인할 수 있습니다.

에이전트 파이프라인을 직접 조립해 보면 중간에 판정만 하는 칸이 꼭 생깁니다. 들어온 문의를 어느 팀으로 보낼지, 방금 만든 답변이 질문에 답하고 있는지, 이 작업을 사람에게 넘길지 같은 것입니다. 그 칸에도 문장을 생성하는 모델을 세워야 할까요? AWS 의 Strands Labs 가 10월 1일 공개한 `strands-decider` 는 그 칸을 다르게 채웁니다. 텍스트를 한 글자도 만들지 않고 주어진 선택지 중 하나를 골라 그 선택의 confidence 를 같이 돌려줍니다. 호출은 이렇게 생겼습니다.

```bash
strands-decider ask StrandsAgents/strands-decider-2B-hobson-v21 \
  --state "Help! My payouts have been failing for 3 days!" \
  --choice "Which team should handle this?=billing,sales,retail"
```

`billing` 이라는 답과 함께 얼마나 확신하는지가 숫자로 따라옵니다. 판정 계층을 이렇게 떼어 두면 비용과 지연만 줄어드는 것이 아닙니다. 큰 모델을 언제 불러야 하는지를 임계값 하나로 정할 수 있게 됩니다.

## 생성 헤드를 버리고 붙인 pointer head

구조부터 보면 이 모델이 왜 빠른지 설명이 됩니다. 사전학습된 decoder 모델은 보통 입력을 torso 에 통과시킨 뒤 language-modelling head 를 거쳐 단어를 하나씩 만들어 냅니다. Strands Decider 는 torso 를 그대로 두고 그 head 를 버립니다. 대신 파라미터 100만 개 정도의 pointer head 를 붙입니다.

![Hobson 구조 — 사전학습 torso 는 두고 language-modelling head 를 버린 뒤 pointer head 로 선택지별 logit 을 만든다](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-05/400be554.svg)

pointer head 가 하는 계산은 한 줄입니다. `<answer>` 위치의 hidden state 를 query 로 쓰고 각 선택지 텍스트의 마지막 토큰 hidden state 를 key 로 써서 둘을 견줍니다.

```
logit_k = ⟨q(h_answer), k(h_opt k)⟩ / √256
```

선택지가 K 개면 logit 도 K 개가 나오고 그 위에 softmax 를 한 번 씌운 것이 답입니다. forward pass 한 번으로 끝나고 디코딩 루프가 없습니다. 모델은 1.9B 규모이고 베이스는 Qwen3.5-2B-Base 입니다. 학습은 torso 의 projection 레이어에 rank-16 LoRA 를 걸고 head 만 fp32 로 두는 방식이라 v14 기준 체크포인트가 88MB 정도입니다.

여기서 설계 하나가 눈에 걸립니다. pointer head 는 **선택지별 파라미터를 하나도 갖지 않습니다**. 그래서 "첫 번째 선택지가 보통 정답이다" 같은 것을 배울 수 없고 한 질문에 선택지를 몇 개까지 넣을지에 구조적 상한이 생기지 않습니다. 스키마가 막는 255개가 상한입니다.

## 같은 softmax 에서 나오는 세 가지 질문 형식

읽는 방법만 바꿔서 같은 masked softmax 에서 질문 형식 세 가지를 꺼냅니다. 세 가지를 견주면 아래와 같습니다.

| | `noul` | `choice` | `score` |
|---|---|---|---|
| 선택지 | 2개(예·아니오) | N개 중 1개 | 순서 있는 2~10단계 |
| 돌려주는 값 | `P(true)` | argmax 와 선택지별 확률 | 기대값과 분포 |
| confidence 계산 | 확률 그대로 | `(N·p_max − 1) / (N − 1)` | 정규화한 표준편차 |
| 쓰는 곳 | 통과·차단 판정 | 라우팅·분류 | 품질 채점 |

`score` 의 confidence 만 계산식이 다른 것은 이유가 있습니다. 순서가 있는 척도에서는 가장 높은 확률 하나를 보는 방식이 잘 맞지 않습니다. 3점과 4점 사이에서 갈리는 것과 1점과 5점 사이에서 갈리는 것은 전혀 다른 상태인데 최대 확률만 보면 둘이 비슷하게 읽히거든요. 그래서 분포가 얼마나 퍼졌는지를 confidence 로 씁니다.

## 선택지 개수가 달라도 같은 뜻인 confidence

`choice` 의 confidence 식을 다시 보겠습니다.

```
confidence = (N · p_max − 1) / (N − 1)
```

이 식의 목적은 **N 을 지우는 것**입니다. 3지선다에서 가장 높은 확률이 0.5 인 것과 10지선다에서 0.5 인 것은 의미가 다릅니다. 3지선다는 찍어도 0.33 이 나오고 10지선다는 0.1 이 나오니까요. 위 식으로 정규화하면 두 경우가 같은 축에 올라옵니다. 라우팅 임계값을 한 번 정해 두면 선택지가 3개인 질문과 10개인 질문에 그대로 쓸 수 있습니다.

이게 실무에서 갖는 뜻은 분명합니다. 판정마다 임계값을 따로 맞추는 작업이 사라집니다. `confidence < 0.6 이면 큰 모델에 넘긴다` 같은 규칙 하나로 파이프라인 전체의 escalation 을 관리할 수 있습니다.

그래서 이 모델에서 정확도보다 먼저 볼 숫자는 보정 오차입니다. 저장소는 세대별 ECE 를 그대로 공개해 뒀습니다.

![세대별 JevBench 보정 오차(ECE) — primitive 별 temperature 를 맞춘 뒤 held-out 분류에서 측정한 값](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-05/27d9d37b.svg)

그래프를 읽을 때 조건 하나를 함께 봐야 합니다. 여기 적힌 ECE 는 **primitive 별로 temperature 를 맞춘 뒤**의 값입니다. 모델이 날것으로 그만큼 보정돼 나온다는 뜻이 아니고 보정 단계를 한 번 거친 결과입니다. 기준 모델 v21 의 Brier 는 0.323, ECE 는 0.064 입니다. 직전 기준이던 v19 는 0.342 와 0.052 였습니다. 정확도와 Brier 는 v21 이 좋아졌는데 ECE 는 오히려 나빠졌습니다. 둘을 같이 올리지는 못했다는 뜻입니다.

## JevBench 231문항에서 나온 점수

정확도는 JevBench 공개 과제 231문항으로 잽니다. v21 이 176문항을 맞춰 0.762 입니다. 난이도 구간을 나눠 보면 쉬운 쪽 48문항은 1.000, 표준 72문항은 0.931, 어려운 쪽 111문항은 0.550 입니다.

![난이도 구간별 JevBench 정확도 — 쉬운 구간은 v5 에서 이미 포화됐고 그 뒤의 개선은 어려운 구간에서 나왔다](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-05/36856d3e.svg)

그래프가 말하는 바가 figure 부제에 그대로 적혀 있습니다. 쉬운 구간은 v5 에서 이미 1.0 에 닿았고 그 뒤 세대들이 벌어 온 점수는 전부 어려운 구간에서 나왔습니다. 그 어려운 구간이 아직 0.55 입니다. 절반을 겨우 넘깁니다.

배포 모델을 시드 6개로 다시 재 본 결과도 같이 공개돼 있습니다. 231문항 중 평균 175.0개에 표준편차 2.4, 범위는 171~177개입니다. 같은 모델을 같은 벤치마크에 돌려도 여섯 문항 정도는 시드에 따라 움직인다는 뜻이라 소수점 둘째 자리로 모델을 고를 숫자는 아닙니다.

## 2,000토큰 상태에 질문을 여러 개 걸 때의 지연

지연은 RTX 3090 에서 중앙값 115ms, 95분위 299ms 입니다. Apple silicon 에서도 돌아갑니다. M3 Pro 에서 300토큰 이하 요청을 반복했을 때 중앙값이 153ms 로 측정됐고 10월 2일에 들어간 MLX 백엔드는 M4 Pro 에서 MPS 보다 1.4~1.6배 빠릅니다.

실제 파이프라인에서는 상태 하나를 두고 질문을 여러 개 겁니다. 이 문의가 어느 팀 것인지, 긴급한지, 환불 요청을 포함하는지를 같은 대화에 대해 동시에 묻는 식입니다. 그 경우의 지연이 어떻게 늘어나는지도 측정해 뒀습니다.

![질문 개수에 따른 지연 — 약 2,000토큰 상태에 choice 질문을 N개 걸었을 때, prefix 를 공유하는 기본 설정과 prefix 캐시 없이 배치로 돌린 경우](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-05/42412f79.svg)

기본 설정은 상태 부분의 prefix 를 공유합니다. 상태는 한 번만 읽고 질문마다 뒷부분만 다시 계산하므로 질문을 늘려도 비용이 비례해서 늘지 않습니다. prefix 캐시 없이 배치로 돌린 쪽과 벌어지는 간격이 그 효과입니다. 판정 여러 개를 한 상태에 몰아서 묻는 설계가 유리하다는 이야기입니다. 🙂

## 질문을 바꿔도 답이 같은 구간

여기까지는 좋은 쪽입니다. 저장소가 숨기지 않은 반대쪽도 같이 봐야 합니다.

![질문을 바꿨을 때의 답 변화 — held-out choice 과제에서 상태와 선택지는 고정하고 질문만 first·last·NOT·무관한 질문으로 바꿔 측정](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-10-05/66b1b142.svg)

이 figure 가 재는 것은 **모델이 질문을 실제로 읽고 있는지**입니다. 상태와 선택지를 그대로 두고 질문만 바꿉니다. 첫 번째를 고르라는 질문, 마지막을 고르라는 질문, 부정(`NOT`)이 들어간 질문, 아예 무관한 질문으로 바꿔 보고 답이 따라 움직이는지 확인합니다. 세대를 거치며 개선된 항목이지만 그래프가 따로 존재한다는 사실 자체가 이 모델에서 그게 자동으로 보장되지 않는다는 뜻입니다.

연구 기록은 더 직접적입니다. `research/history.md` 에는 preregistration 14건의 성패가 수정 없이 남아 있습니다. 미리 적어 둔 기준을 통과한 것은 v19 하나이고 v14·v16·v17·v18·v20 은 기준을 못 넘겼는데 판단으로 승격된 것까지 적혀 있습니다. 그중 한 줄이 이 모델의 성격을 가장 잘 설명합니다.

> The model learned to do RuleTaker; it did not learn to reason.

템플릿으로 만든 합성 데이터가 실제 문서로 옮겨 가지 않았다는 기록도 같이 있습니다. 즉 이 모델에 추론을 맡기면 안 됩니다. 선택지가 분명하고 상태가 짧은 분류·채점 판정을 빠르게 처리하는 부품입니다.

## 판정만 따로 내려 둔다는 선택

Apache-2.0 이고 1.9B 이라 이 계층을 자기 하드웨어에 두는 선택이 가능합니다. 그러면 파이프라인의 모든 칸을 같은 크기 모델로 채우지 않아도 됩니다. 분기 판정만 2B 로 내리면 그 칸에서 토큰 요금과 네트워크 왕복이 사라지고 대신 confidence 라는 관측값이 생깁니다. 지금까지 에이전트 파이프라인에서 가장 보이지 않던 부분이 "모델이 이 분기를 얼마나 확신했는가"였습니다. 생성 모델에 분기를 맡기면 그 숫자가 아예 나오지 않습니다.

그 숫자가 생기면 할 수 있는 일이 늘어납니다. 임계값 아래의 판정만 큰 모델로 올려 비용을 쓰고 임계값 아래 비율을 지표로 삼아 프롬프트와 선택지 설계를 고칠 수 있습니다. 어려운 구간 정확도 0.55 와 보정 전 단계가 필요하다는 조건을 알고 쓰면 판정 계층을 따로 두는 설계는 1인 개발자에게도 충분히 현실적인 선택으로 보입니다.

## 참고 자료

- [strands-labs/strands-decider — GitHub](https://github.com/strands-labs/strands-decider) (Apache-2.0)
- [docs/architecture.md — pointer head 와 confidence 식](https://github.com/strands-labs/strands-decider/blob/main/docs/architecture.md)
- [evaluation/results.md — 시드별 결과와 지연 측정](https://github.com/strands-labs/strands-decider/blob/main/evaluation/results.md)
- [research/history.md — preregistration 기록](https://github.com/strands-labs/strands-decider/blob/main/research/history.md)
- 본문 그림 5장은 모두 같은 저장소의 `research/figures/` 에 공개된 공식 figure 입니다 — [research/figures](https://github.com/strands-labs/strands-decider/tree/main/research/figures)
