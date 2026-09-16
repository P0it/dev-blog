---
title: 첫 글자는 늦고 그다음은 빠른 이유, Prefill·Decode·KV Cache
slug: prefill-decode-kv-cache
tags: [KV Cache, Prefill, Decode, LLM 추론, LLM 인프라 입문]
category: ai
published_at: 2026-06-03
series: llm-infra-basics
series_order: 3
cover_image: https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/6a3e424f.webp
---
> 챗봇에 긴 문서를 붙여 넣으면 첫 글자가 나오기까지 한참 걸립니다. 일단 나오기 시작하면 줄줄 흘러나옵니다. 앞부분이 **Prefill**, 뒷부분이 **Decode** 이고 둘 사이에 **KV Cache** 가 있습니다. 긴 문맥이 GPU 메모리를 잡아먹는 이유도 여기서 나옵니다.

## 답이 한 번에 안 나오는 이유

2편에서 본 대로 LLM 은 다음 토큰 하나를 고르는 기계입니다. 문장을 만들려면 고른 토큰을 입력 끝에 붙이고 다시 다음 토큰을 고르는 일을 반복해야 합니다. 이 방식을 **자기회귀 생성**(autoregressive generation)이라고 부릅니다. 답변 300 토큰이면 모델을 300번 통과합니다.

이때 모델이 매번 보는 입력 전체 — 시스템 프롬프트, 대화 이력, 붙여 넣은 문서, 지금까지 생성한 답 — 를 **컨텍스트**라고 합니다. 모델마다 컨텍스트 상한이 있습니다. Qwen2.5-7B 의 `max_position_embeddings` 는 131,072 토큰입니다.

## Prefill — 프롬프트 전체를 한 번에

사용자가 보낸 프롬프트는 토큰 수천 개일 수 있습니다. 이 토큰들은 이미 다 알고 있으니 한 토큰씩 처리할 필요가 없습니다. 2편의 Attention 계산을 **모든 토큰에 대해 한 번에** 행렬 곱으로 처리합니다. 이 단계가 **Prefill** 입니다.

행렬과 행렬을 곱하는 일은 GPU 가 가장 잘하는 일이라 이 단계는 GPU 연산 능력을 거의 다 씁니다. 그래서 Prefill 은 **compute-bound**, 계산 속도가 병목입니다. 프롬프트가 길수록 이 단계가 길어지고 그만큼 첫 토큰이 늦게 나옵니다.

## KV Cache — 계산한 Key·Value 를 저장

Prefill 이 끝나면 첫 토큰이 나옵니다. 문제는 두 번째 토큰입니다. 방금 나온 토큰을 붙여 다시 Attention 을 하려면 앞선 토큰들의 Key 와 Value 가 전부 필요한데, 이건 Prefill 때 이미 계산한 값입니다. 다시 계산하면 낭비입니다.

![NVIDIA 기술 블로그의 KV 캐싱 그림 — 앞 토큰의 K·V 를 저장해 두고 새 토큰만 계산](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/6a3e424f.webp)

그래서 각 층에서 계산한 Key·Value 를 GPU 메모리에 그대로 둡니다. 이것이 **KV Cache** 입니다. 새 토큰이 들어오면 그 토큰의 K·V 만 계산해 캐시 끝에 붙입니다. Attention 은 캐시 전체를 읽어 계산합니다.

Query 는 왜 캐시하지 않을까요. Attention 에서 Query 는 "지금 토큰이 무엇을 볼지"를 정하는 값이라 **지금 토큰의 것만** 씁니다. 앞 토큰들의 Query 는 그 토큰 차례에 이미 쓰고 끝났습니다. 반면 Key·Value 는 뒤에 오는 모든 토큰이 계속 참조하니 저장할 가치가 있습니다.

## Decode — 한 토큰씩, 메모리를 읽으며

첫 토큰 이후는 한 번에 토큰 하나씩 만듭니다. 이 단계가 **Decode** 입니다. 입력이 토큰 하나뿐이니 계산은 행렬 × 벡터 수준으로 작습니다. 그런데 그 작은 계산을 위해 매번 76억 개 가중치 전부와 KV Cache 전체를 GPU 메모리에서 읽어 와야 합니다.

```illustration
<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <title>프롬프트가 Prefill 을 거쳐 KV Cache 를 만들고, Decode 가 토큰을 하나씩 이어 붙이는 흐름</title>
  <rect x="40" y="185" width="130" height="80" rx="14" style="fill: var(--diag-teal-fill); stroke: var(--diag-teal-stroke); stroke-width: 2.5" />
  <text x="105" y="232" text-anchor="middle" style="fill: var(--fg-strong); font-size: 20px">프롬프트</text>
  <path d="M180 225 H 218" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M210 217 L 220 225 L 210 233" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <rect x="230" y="165" width="150" height="120" rx="14" style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="305" y="218" text-anchor="middle" style="fill: var(--fg-strong); font-size: 22px">Prefill</text>
  <text x="305" y="248" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15px">전체 한 번에</text>
  <path d="M305 295 V 333" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M297 325 L 305 335 L 313 325" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <rect x="230" y="345" width="410" height="66" rx="14" style="fill: var(--diag-mute-fill); stroke: var(--diag-mute-stroke); stroke-width: 2.5" />
  <text x="435" y="385" text-anchor="middle" style="fill: var(--fg-strong); font-size: 20px">KV Cache (GPU 메모리)</text>
  <path d="M390 225 H 428" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M420 217 L 430 225 L 420 233" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <rect x="440" y="165" width="150" height="120" rx="14" style="fill: var(--diag-blue-fill); stroke: var(--diag-blue-stroke); stroke-width: 2.5" />
  <text x="515" y="218" text-anchor="middle" style="fill: var(--fg-strong); font-size: 22px">Decode</text>
  <text x="515" y="248" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15px">한 토큰씩 반복</text>
  <path d="M515 295 V 333 M515 345 V 335" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M507 305 L 515 295 L 523 305" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M600 225 H 638" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M630 217 L 640 225 L 630 233" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <rect x="650" y="195" width="36" height="60" rx="8" style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <rect x="694" y="195" width="36" height="60" rx="8" style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5" />
  <rect x="738" y="195" width="36" height="60" rx="8" style="fill: var(--diag-green-fill); stroke: var(--diag-green-stroke); stroke-width: 2.5; stroke-dasharray: 6 6" />
  <text x="712" y="140" text-anchor="middle" style="fill: var(--fg-neutral); font-size: 15px">토큰 → 토큰 → …</text>
  <path d="M665 265 C 665 320 620 330 590 330" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M600 322 L 588 330 L 600 338" style="stroke: var(--fg-neutral); stroke-width: 2.5; fill: none" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

GPU 는 계산은 빠른데 메모리에서 데이터를 가져오는 속도는 그보다 훨씬 느립니다. Decode 단계는 계산량 대비 읽어야 할 데이터가 너무 많아서 **memory-bandwidth-bound**, 메모리 대역폭이 병목입니다. NVIDIA 문서도 이 단계의 지연은 계산 속도가 아니라 가중치·K·V 를 메모리에서 옮기는 속도가 결정한다고 적고 있습니다. 4편에서 양자화가 속도에도 도움이 되는 이유가 이것입니다. 읽을 바이트가 줄기 때문입니다.

## 긴 컨텍스트가 VRAM 을 잡아먹는 계산

KV Cache 는 토큰마다 쌓입니다. 토큰 하나당 크기는 이렇습니다.

```
토큰당 KV Cache = 2(K, V) × 층 수 × (KV 헤드 수 × 헤드 차원) × 바이트 수
```

NVIDIA 문서의 예시인 Llama 2 7B(32층, hidden 4096, FP16)로 계산하면 토큰당 2 × 32 × 4096 × 2 = **512KB** 입니다. 컨텍스트 4,096 토큰이면 약 2GB 입니다. 요청 하나가 그렇고 동시 요청 열 개면 20GB 입니다. 가중치 14GB 와 별개로 말입니다.

2편에서 본 Qwen2.5-7B 의 GQA 가 여기서 효과를 냅니다. KV 헤드가 4개뿐이라 토큰당 2 × 28 × (4 × 128) × 2 = **56KB**, Llama 2 7B 의 1/9 수준입니다. 그래도 128K 컨텍스트를 다 채우면 요청 하나에 약 7GB 가 필요합니다.

![NVIDIA 기술 블로그의 MHA·MQA·GQA 비교 그림 — KV 헤드를 줄여 캐시를 줄인다](https://wzaqtubtqwpddouevwbk.supabase.co/storage/v1/object/public/post-images/2026-09-16/4ea8a314.webp)

## TTFT · TPOT · Tokens/sec

이 두 단계를 사용자 체감 지표로 옮기면 세 개가 나옵니다.

| | 뜻 | 어느 단계가 결정 |
|---|---|---|
| TTFT | Time To First Token — 첫 토큰까지 걸린 시간 | Prefill (프롬프트 길이) |
| TPOT | Time Per Output Token — 토큰 하나 만드는 시간 | Decode (메모리 대역폭) |
| Tokens/sec | 초당 생성 토큰 수 = 1 / TPOT | Decode |

긴 문서를 붙여 넣었을 때 첫 글자가 늦는 건 TTFT 가 커진 것입니다. 그 뒤로 글자가 흘러나오는 속도는 TPOT 입니다. 두 지표는 병목이 달라서 따로 최적화합니다. 6편에서 다룰 llm-d 가 Prefill 과 Decode 를 아예 다른 GPU 에서 돌리는 이유가 이것입니다.

## 정리

프롬프트는 Prefill 로 한 번에 처리해 KV Cache 를 만듭니다. 답은 Decode 로 한 토큰씩 만들며 캐시를 늘려 갑니다. Prefill 은 계산이, Decode 는 메모리 읽기가 병목입니다. 그 메모리에 가중치와 KV Cache 가 함께 올라가야 하니, 다음 편은 GPU 메모리 자체와 그 메모리를 줄이는 양자화입니다.

## 참고 자료

- 그림·수식: [Mastering LLM Techniques: Inference Optimization — NVIDIA Technical Blog](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/)
- 설정 값: [Qwen/Qwen2.5-7B config.json](https://huggingface.co/Qwen/Qwen2.5-7B/blob/main/config.json)
