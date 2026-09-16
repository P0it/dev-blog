---
title: 76억 개 숫자가 문장을 읽는 순서, Token·Embedding·Attention
slug: transformer-attention-how-llm-reads
tags: [Transformer, Attention, Token, Embedding, LLM 인프라 입문]
category: ai
published_at: 2026-05-26
series: llm-infra-basics
series_order: 2
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/83ad411a.webp
---
> LLM 은 문장을 통째로 이해하지 않습니다. 글자를 토큰으로 자른 뒤 토큰마다 숫자 벡터를 붙이고 벡터끼리 얼마나 관련 있는지를 Attention 으로 계산해 **다음 토큰 하나**를 고릅니다. 1편의 `q_proj`·`k_proj`·`v_proj` 라는 이름이 여기서 풀립니다.

## 토큰 — 모델이 보는 글자 단위

모델은 한글도 영어도 직접 읽지 못합니다. 먼저 **토크나이저**가 글을 자주 나오는 조각 단위로 자릅니다. 이 조각이 **토큰**이고 조각마다 번호가 붙어 있습니다. 1편에서 본 `tokenizer.json` 이 이 사전입니다.

![Tiktokenizer 에서 한국어·영어 문장을 GPT-4o 토크나이저로 자른 결과 — 30 토큰](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/b1856b6b.webp)

위 화면은 GPT-4o 토크나이저에 한 문장을 넣어 본 결과입니다. 영어는 단어 하나가 대체로 토큰 하나인데 한국어는 `문장을`·`단위로` 처럼 어절 단위로 잘리거나 더 잘게 쪼개집니다. 같은 뜻이라도 한국어가 토큰을 더 많이 씁니다. API 요금과 속도가 토큰 수 기준이니 이 차이는 비용으로 이어집니다. 아래 줄의 숫자 열(`200264, 17360, …`)이 모델에 실제로 들어가는 입력입니다.

## 임베딩 — 번호를 좌표로

토큰 번호는 그냥 이름표라서 번호끼리 계산할 수가 없습니다. 그래서 번호마다 숫자 묶음을 하나씩 배정합니다. 이것이 **임베딩**이고 그 숫자 묶음이 **벡터**입니다. 1편의 `model.embed_tokens.weight` 가 `[152064, 3584]` 크기였던 이유가 여기 있습니다. 어휘 152,064 개마다 3,584 차원 벡터가 한 줄씩 들어 있는 표입니다.

이 벡터는 학습 과정에서 뜻이 비슷한 토큰끼리 가까운 값을 갖도록 정해집니다. 그래서 "왕 − 남자 + 여자 ≈ 여왕" 같은 계산이 대충 맞아떨어집니다. 8편의 벡터 DB 는 이 성질을 그대로 문서 검색에 쓰는 것입니다.

## Transformer — 같은 블록을 28번

임베딩된 벡터 열은 **Transformer** 블록을 차례로 통과합니다. 2017년 6월 Google 연구진이 "Attention Is All You Need" 논문에서 제안한 구조입니다. 지금 나오는 LLM 은 거의 전부 이 구조의 변형입니다.

![Hugging Face LLM 코스의 Transformer 구조 그림 — 인코더·디코더 블록](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/318304bd.svg)

원래 논문은 입력을 읽는 인코더와 출력을 만드는 디코더 두 덩어리였습니다. GPT 계열과 Qwen·Llama 같은 요즘 LLM 은 **디코더만** 쌓습니다. 블록 하나는 Attention 층과 MLP 층으로 되어 있습니다. Qwen2.5-7B 는 이 블록을 28개 쌓았습니다. 1편 파일의 `model.layers.0` ~ `model.layers.27` 이 그 28개입니다.

## Attention — 어느 토큰을 얼마나 볼까

블록의 핵심은 **Attention** 입니다. 문장 안의 각 토큰이 다른 토큰들을 얼마나 참고할지 가중치를 매기는 계산입니다. "그것을 먹었다"에서 "그것"이 앞의 "사과"를 가리킨다는 걸 알아내는 장치라고 생각하면 됩니다. 문장 안 토큰들끼리 서로 보는 것이라 **Self-Attention** 이라고 부릅니다.

![Transformer Explainer 에서 본 GPT-2 의 Q·K·V 와 Attention 계산 흐름](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/83ad411a.webp)

Georgia Tech 의 Transformer Explainer 화면입니다. 왼쪽 임베딩에서 토큰마다 세 갈래(Q·K·V)가 나오고 가운데 격자에서 Attention 이 계산되며 오른쪽 끝에서 다음 토큰 확률이 나옵니다. "Data visualization empowers users to" 다음에 **visualize** 가 54.67% 로 1등입니다.

## Q · K · V — 세 벡터가 필요한 이유

토큰 벡터 하나를 그대로 쓰지 않고 세 가지 역할로 변환합니다. 이 변환 표가 1편에서 본 `q_proj`·`k_proj`·`v_proj` 가중치입니다.

- **Query** — 내가 찾는 것. "나는 무엇을 참고해야 하지?"
- **Key** — 내가 가진 것의 색인. "나는 이런 정보를 갖고 있어"
- **Value** — 실제로 넘겨줄 내용

각 토큰의 Query 를 모든 토큰의 Key 와 내적하면 **Attention Score** 가 나옵니다. 점수가 높을수록 그 토큰을 많이 참고한다는 뜻입니다. 점수를 softmax 로 0~1 비율로 바꾼 뒤 그 비율대로 Value 를 섞어 새 벡터를 만듭니다. 검색과 비슷합니다. 검색어(Q)를 색인(K)에 대조해 점수를 내고 점수 순으로 본문(V)을 가져오는 구조입니다.

셋을 나눈 이유는 역할이 다르기 때문입니다. "찾는 기준"과 "찾히는 기준"과 "실제 내용"이 같은 벡터일 필요는 없습니다. 따로 학습시키는 편이 표현력이 큽니다. Explainer 화면에서 Q·K·V 가 색이 다른 세 갈래로 나뉘어 나가는 것이 바로 이 세 표를 통과한 결과입니다.

## Multi-Head — 같은 계산을 여러 관점으로

Attention 을 한 번만 하지 않고 여러 벌을 병렬로 합니다. 각각을 **헤드**라고 부릅니다. 한 헤드는 문법 관계를, 다른 헤드는 지시 관계를 보는 식으로 역할이 갈립니다. Explainer 의 GPT-2 는 헤드가 12개, Qwen2.5-7B 는 `num_attention_heads: 28` 입니다.

Qwen 의 `config.json` 에는 `num_key_value_heads: 4` 도 있습니다. Query 헤드는 28개인데 Key·Value 헤드는 4개만 두고 여러 Query 가 나눠 쓰는 방식(GQA)입니다. 1편 뷰어에서 `q_proj.weight` 가 `[3584, 3584]` 인데 `k_proj.weight` 는 `[512, 3584]` 로 작았던 이유입니다. 이 설계가 3편의 KV Cache 크기를 결정합니다.

## 다음 토큰 예측 — 결국 확률 하나

28개 블록을 다 지나면 마지막 토큰 자리의 벡터를 어휘 152,064 개 각각에 대한 점수로 바꿉니다. softmax 를 거치면 확률이 됩니다. 가장 높은 것을 고르거나 확률대로 뽑습니다. 이것이 **다음 토큰 예측**입니다.

![Hugging Face LLM 코스의 causal language modeling 그림 — 앞 토큰들로 다음 토큰을 맞힌다](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/cc2a00cb.svg)

LLM 이 하는 일은 이것뿐입니다. 고른 토큰을 입력 끝에 붙이고 같은 계산을 다시 해 다음 토큰을 고릅니다. 문장 하나를 만들려면 이 과정을 토큰 수만큼 반복해야 합니다. 그래서 답변이 한 번에 나오지 않고 한 글자씩 흘러나옵니다. 이 반복을 어떻게 빠르게 하느냐가 다음 편, Prefill·Decode·KV Cache 이야기입니다.

## 참고 자료

- [Attention Is All You Need — Vaswani et al., 2017](https://arxiv.org/abs/1706.03762)
- 그림: [How do Transformers work? — Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/4) (Apache-2.0)
- 화면 캡처: [Transformer Explainer — Polo Club of Data Science, Georgia Tech](https://poloclub.github.io/transformer-explainer/) (MIT)
- 화면 캡처: [Tiktokenizer](https://tiktokenizer.vercel.app/)
- 설정 값: [Qwen/Qwen2.5-7B config.json](https://huggingface.co/Qwen/Qwen2.5-7B/blob/main/config.json)
