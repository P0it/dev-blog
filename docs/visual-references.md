# 시각 설명 레퍼런스

`/study` 가 글마다 레퍼런스를 탐색하고 여기에 쌓는다. 기록하는 것은 **설명 방식**이다.
그림체·색·레이아웃은 가져오지 않는다. 실제로 열어 본 것만 적고, 열지 못한 것은 `미확인` 칸에 둔다.
재사용을 강제하려는 목록이 아니다. 다음 글을 쓸 때 고를 수 있는 선택지를 넓히려는 목록이다.

| 레퍼런스 | 설명 기법 | 쓸 때 | 확인일 | 쓴 글 |
|---|---|---|---|---|
| [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) | 실제 GPT-2 위에서 temperature 슬라이더·top-k/top-p 토글로 다음 토큰 확률을 바로 다시 그린다. 토큰에 마우스를 올리면 attention 가중치 강조 | 실제 모델 값으로 보여 주고 싶을 때 | 2026-10-12 | llm-temperature-sampling, self-attention-qkv, transformer-attention-how-llm-reads |
| [HF, How to generate text](https://huggingface.co/blog/how-to-generate) | 분포가 평평한 문맥과 뾰족한 문맥을 나란히 놓아, 같은 k가 한쪽에서는 너무 많고 한쪽에서는 너무 적음을 보인다 | 고정값 방식의 약점을 보일 때 | 2026-10-12 | llm-temperature-sampling |
| [Boltzmann distribution](https://en.wikipedia.org/wiki/Boltzmann_distribution) | (다른 분야) softmax 와 같은 꼴. 에너지 층 사이를 오가는 입자로 온도를 보여 준다 | 이름의 유래·물리 비유가 이해를 돕는 개념 | 2026-10-12 | llm-temperature-sampling |
| [3Blue1Brown, Attention](https://www.3blue1brown.com/lessons/attention) | Query×Key 격자에서 점 크기로 점수 → 행마다 softmax → 마스크 칸을 −∞ 로. 형용사가 명사 벡터를 고치는 예시 | 행렬 계산을 단계별로 쌓을 때 | 2026-10-12 | self-attention-qkv |
| [Jay Alammar, Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) | 단어 하나를 따라 점수→÷8→softmax→V 가중합 6단계, 그다음 같은 일을 행렬로 압축. "it → animal" 예문 | 한 토큰을 따라가며 계산을 보일 때 | 2026-10-12 | self-attention-qkv |
| [Nicky Case, The Wisdom and/or Madness of Crowds](https://ncase.me/crowds/) | (다른 분야·사회 연결망) 사람을 노드로, 독자가 연결을 긋고 끊으면 영향이 이웃 비율로 퍼진다 | 가중 평균·정규화된 영향을 직관으로 보일 때 | 2026-10-12 | |
| [Distill, Attention and Augmented RNNs](https://distill.pub/2016/augmented-rnns/) | soft attention 을 "모든 곳을 보되 정도만 다르게"로 설명 | attention 을 "고르기"로 오해할 때 | 2026-10-12 | |
| [Anthropic, Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) | 주어가 빠진 청크 예시("매출이 3% 늘었다") + 단계를 더할 때마다 줄어드는 실패율 막대 | 기법을 한 겹씩 더하는 효과를 보일 때 | 2026-10-12 | rag-retrieval-pipeline |
| [Weaviate, Vector Search Explained](https://weaviate.io/blog/vector-search-explained) | 질의를 표적 공, 문서를 공으로 두는 비유. HNSW 위층은 긴 연결, 아래층은 짧은 연결 | 벡터 검색·ANN 을 그림으로 보일 때 | 2026-10-12 | rag-retrieval-pipeline |
| [Pinecone, Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/) | 청크가 너무 작을 때와 너무 클 때 무엇이 망가지는지 글로 정리(그림 없음) | 청킹 실험의 판정 문구를 쓸 때 | 2026-10-12 | rag-retrieval-pipeline |
| [Jay Alammar, Illustrated Word2vec](https://jalammar.github.io/illustrated-word2vec/) | 임베딩을 색 칸 띠로 그려 비슷한 단어는 같은 열 색이 겹쳐 보이게 한다 | 임베딩 벡터의 "비슷함"을 보일 때 | 2026-10-12 | |
| [Red Blob Games, Introduction to A*](https://www.redblobgames.com/pathfinding/a-star/introduction.html) | (다른 분야·지도 탐색) 시작점·목표를 끌어서 옮기고, 탐색 경계가 퍼지는 과정을 단계별로 본다. 루프를 한 번씩 넘기는 Step 버튼 옆에 그 루프의 상태를 같이 둔다 | 공간 위 탐색을 조작하게 할 때, 반복문을 한 바퀴씩 따라가게 할 때 | 2026-10-14 | rag-retrieval-pipeline, ai-agent-vs-chatbot, prompt-engineering-roles-few-shot |
| [Lost in the Middle](https://arxiv.org/abs/2307.03172) | 정답 문서 위치에 따른 정확도 U자 곡선 | 긴 컨텍스트에서 위치 효과를 보일 때 | 2026-10-12 | rag-retrieval-pipeline |
| [UTF-8 Playground (vishnuharidas)](https://github.com/vishnuharidas/utf8-playground) | 상태의 주체가 비트다. 독자가 비트를 눌러 뒤집으면 글자가 따라 바뀐다. 제어비트는 진한 색, 데이터비트는 연한 색으로 갈라 "앞 몇 비트는 길이 표지판"이 설명 없이 보인다. overlong 경고 배너로 "같은 글자를 가리키는 바이트열이 여럿"이라는 오해를 깬다 | 비트·플래그가 값의 일부인 형식을 보일 때 | 2026-10-13 | utf8-encoding-mojibake |
| [utf8splain (ThinkR-open)](https://github.com/ThinkR-open/utf8splain) | 한 글자를 행 단위 표로 분해한다. 칸은 byte(hex)·decimal·binary(8비트). 이모지 하나가 표에서 4행을 차지하는 모습으로 "글자 1개 = 바이트 1개" 오해를 깬다 | 글자와 바이트의 개수가 어긋나는 것을 보일 때 | 2026-10-13 | utf8-encoding-mojibake |
| [chardet](https://github.com/chardet/chardet) | 정답 하나가 아니라 신뢰도 순위가 매겨진 후보 목록을 보여 준다. 한 바이트열에 Windows-1252·ISO-8859-15·ISO-8859-1 이 0.31 로 거의 동점이 뜬다 | "데이터만 보면 형식을 알 수 있다"는 오해를 숫자로 깰 때 | 2026-10-13 | utf8-encoding-mojibake |
| [ftfy (rspeer)](https://github.com/rspeer/python-ftfy) | 깨진 글자와 복구본을 before/after 쌍으로 늘어놓은 카탈로그. 복구되는 사례만이 아니라 복구가 깨지는 경계(no-break space 가 보통 공백으로 합쳐지는 자리)도 같이 적는다 | 되돌릴 수 있는 손상과 없는 손상을 가를 때 | 2026-10-13 | utf8-encoding-mojibake |
| [charset-normalizer (Ousret)](https://github.com/Ousret/charset_normalizer) | 모호함을 chaos(깨진 정도)·coherence(언어다움) 두 수치로 재고 `alternative_encodings` 를 같이 준다. "두 표가 같은 글자를 만들 수 있다"를 전제로 "덜 깨진 쪽 고르기"임을 드러낸다 | 추측에 눈금을 달 때 | 2026-10-13 | |
| [Morse Code Visualizer (Berkanktk)](https://github.com/Berkanktk/morse-code) | (다른 분야·모스 부호) 코드북을 7단 이진 결정트리로 그리고, 입력하는 동안 경로에 실시간으로 불이 들어온다. 조회표가 아니라 "지금 어디까지 왔는지" 보이는 상태 기계로 제시한다 | 해독 과정을 단계별 경로로 보일 때 | 2026-10-13 | |
| [Enigma Forge (systemslibrarian)](https://github.com/systemslibrarian/crypto-lab-enigma-forge) | (다른 분야·암호) 키 하나를 누를 때마다 lampboard·로터창·신호경로 세 뷰가 동시에 갱신된다. 독자가 만지는 것은 코드북 설정 자체(로터·링·플러그보드)라, 같은 입력이 설정에 따라 다른 출력이 되는 것을 조작으로 겪는다 | 같은 입력에 다른 약속을 끼우는 구조를 보일 때 | 2026-10-13 | utf8-encoding-mojibake |

| [Anthropic, Redesigning source control](https://www.anthropic.com/engineering/redesigning-source-control) | Scion 의 설계 원칙을 "클라이언트는 늘 온라인", "모든 데이터는 내용 주소이고 불변 → 어느 서버든 조율 없이 캐시" 처럼 한 줄 원칙으로 먼저 세우고 구조를 뒤에 푼다 | 시스템 설계를 원칙 → 구조 순으로 설명할 때 | 2026-10-14 | content-addressing-merkle-tree |
| [Pro Git 10.2 Git Objects](https://raw.githubusercontent.com/progit/progit2/main/book/10-git-internals/sections/objects.asc) | `blob <크기>\0` 헤더를 붙여 SHA-1 을 손으로 계산하고 `git hash-object` 결과와 맞춰 보인다 | 이름이 내용에서 계산된다는 것을 처음 납득시킬 때 | 2026-10-14 | content-addressing-merkle-tree |
| [IPFS docs, Merkle DAG](https://raw.githubusercontent.com/ipfs/ipfs-docs/main/docs/concepts/merkle-dag.md) | `A=Hash(B)→B=Hash(C)` 한 줄로 "잎부터만 만들 수 있다·바꾸면 조상이 다 바뀐다·고리가 없다"를 한꺼번에 보인다 | 그림 다음에 규칙을 한 줄로 요약할 때 | 2026-10-14 | |
| [merkle-db-sync](https://github.com/mohitmishra786/merkle-db-sync) | 원본·복제본 두 트리를 나란히 놓고 루트부터 비교해 다른 가지로만 내려가며 아낀 전송량을 숫자로 보인다 | "지문만 비교하면 된다"를 체감시킬 때 | 2026-10-14 | content-addressing-merkle-tree |
| [gitlet (Mary Rose Cook)](https://github.com/maryrosecook/gitlet) | 명령보다 `.git` 안 객체를 먼저 보여 주는 "안에서 밖으로" 순서, 주석 단 1000줄 구현 | "진짜로는 어떻게 저장돼?"에 답할 때 | 2026-10-14 | |
| [Anthropic, Building effective agents](https://www.anthropic.com/research/building-effective-agents) | 같은 부품(LLM·도구·메모리)을 두고 "경로를 코드가 미리 정했나, 모델이 정하나" 하나만 바꿔 워크플로와 Agent 를 가른다 | 비슷해 보이는 시스템을 결정 주체 하나로 가를 때 | 2026-10-14 | ai-agent-vs-chatbot |
| [LangChain, What is an agent?](https://www.langchain.com/blog/what-is-an-agent) | 자율성 사다리(손 코드 → LLM 1회 → chain → router → state machine → 자율 agent)의 칸마다 "출력·다음 단계·쓸 수 있는 단계를 누가 정하나"를 사람/코드/LLM 으로 칠한다 | "누가 정하나" 축을 단계별로 보일 때 | 2026-10-14 | ai-agent-vs-chatbot |
| [Claude 문서, Working with the Messages API](https://platform.claude.com/docs/en/build-with-claude/working-with-messages) | 요청 본문의 messages 배열이 왕복마다 길어지는 실제 예시와 입력 토큰 증가 | API 가 기억이 없다는 것을 증명할 때 | 2026-10-14 | ai-agent-vs-chatbot |
| [Nicky Case, The Evolution of Trust](https://ncase.me/trust/) | (다른 분야·게임이론) 결과를 보여 주기 전에 독자에게 먼저 예상을 고르게 하고, 한 장에 규칙 하나만 바꾼다 | 독자의 직관이 틀리는 실험 결과를 보일 때 | 2026-10-14 | prompt-engineering-roles-few-shot |
| [Jay Alammar, How GPT3 Works](https://jalammar.github.io/how-gpt3-works-visualizations-animations/) | 프롬프트와 출력을 색으로 나누고, 가중치를 바꾸는 학습과 그대로 두는 추론을 따로 그린다 | "퓨샷은 학습이 아니다"를 보일 때 | 2026-10-14 | prompt-engineering-roles-few-shot |
| [Zhao 외, Calibrate Before Use](https://arxiv.org/abs/2102.09690) | 같은 예시를 순서·개수만 바꿔 정확도가 54.3%~93.4%로 흔들리는 것을 표로 보인다(표 1은 모델 크기 × 예시 수) | 예시 수·순서 효과를 실제 숫자로 그릴 때 | 2026-10-14 | prompt-engineering-roles-few-shot |
| [Min 외, Rethinking the Role of Demonstrations](https://arxiv.org/abs/2202.12837) | 예시의 정답·입력·답 후보·형식을 하나씩 망가뜨려 무엇이 성능을 떠받치는지 가른다 | "예시가 실제로 가르치는 것"을 보일 때 | 2026-10-14 | prompt-engineering-roles-few-shot |
| [Jay Alammar, Illustrated GPT-2](https://jalammar.github.io/illustrated-gpt2/) | 임베딩 행렬을 "한 행이 한 단어"인 표로 그리고, 위치 벡터를 더하는 장면을 따로 뗀다. 출력을 입력 끝에 붙이는 되먹임 GIF | 토큰 id → 임베딩 → 위치 구간을 보일 때 | 2026-10-15 | transformer-attention-how-llm-reads |
| [3Blue1Brown, GPT 레슨](https://www.3blue1brown.com/lessons/gpt) | "예측 → 하나 고르기 → 붙이기 → 다시"를 고리 하나로 묶는다 | 자기회귀를 한 그림으로 보일 때 | 2026-10-15 | transformer-attention-how-llm-reads |
| [HF LLM Course 6장, BPE](https://huggingface.co/learn/llm-course/chapter6/5) | 단어 다섯 개 장난감 말뭉치에서 쌍을 세고 가장 흔한 쌍부터 합친다(ug 20 → un 16 → hug 15) | BPE 를 손으로 해 보게 할 때 | 2026-10-15 | transformer-attention-how-llm-reads |
| [nostalgebraist, the logit lens](https://www.lesswrong.com/posts/AcKRB8wDpdaN6v6ru/interpreting-gpt-the-logit-lens) | 중간 층 상태에 마지막 출력 투영을 씌워 층마다 "지금 멈추면 무엇을 고를지"를 보인다 | "블록을 거치며 답이 다듬어진다"를 실제 값으로 보일 때 | 2026-10-15 | transformer-attention-how-llm-reads |
| [EleutherAI, Rotary Embeddings](https://blog.eleuther.ai/rotary-embeddings/) | (다른 분야·광학) 1/4 파장판처럼 크기는 두고 각도만 돌린다. 두 위치를 같이 옮겨도 사이 각이 같음 | 상대 위치를 보일 때 | 2026-10-15 | transformer-attention-how-llm-reads |
| [Anthropic, A Mathematical Framework](https://transformer-circuits.pub/2021/framework/index.html) | 잔차 흐름을 각 층이 읽고 결과를 더해 쓰는 통로로 설명 | 잔차 연결을 "덮어쓰기 아님"으로 보일 때 | 2026-10-15 | transformer-attention-how-llm-reads |
| [Petrov 외, Tokenizers Introduce Unfairness](https://arxiv.org/abs/2305.15425) | 같은 문장을 언어별로 넣어 토큰 수 배율을 비교(cl100k: 이탈리아어 1.6배 ~ 샨어 15배) | 언어별 토큰 비용을 보일 때 | 2026-10-15 | transformer-attention-how-llm-reads |
| [Karpathy, minbpe](https://github.com/karpathy/minbpe) | `aaabdaaabac` 를 세 번 합쳐 `XdXac`, 새 id 를 256·257·258 로 붙인다 | 바이트에서 시작하는 BPE 를 보일 때 | 2026-10-15 | |
| [NVIDIA, Mastering LLM Techniques: Inference Optimization](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/) | Prefill 을 matrix-matrix(GPU 포화), Decode 를 matrix-vector(memory-bound)로 가르고 KV Cache 크기를 토큰당 공식 하나로 적는다 | 추론 두 단계와 캐시 크기를 처음 세울 때 | 2026-10-15 | prefill-decode-kv-cache, gpu-vram-fp16-int4-quantization (Figure 9 반올림·클리핑 그림을 가져와 씀) |
| [Databricks, LLM Inference Performance Engineering](https://www.databricks.com/blog/llm-inference-performance-engineering-best-practices) | latency = TTFT + TPOT × 토큰 수로 체감 지표를 쪼개고, 배치를 키울 때 처리량-지연 곡선이 눕는 실측 그래프(Figure 7)를 보인다 | 지표 정의와 배치 트레이드오프를 실제 값으로 보일 때 | 2026-10-15 | prefill-decode-kv-cache |
| [Ainslie 외, GQA](https://arxiv.org/abs/2305.13245) | MHA·GQA·MQA 를 Query·Key·Value 막대 세 줄로 나란히 그려 "Key·Value 칸 수만 줄어든다"를 한 장에 보인다(Figure 2) | KV 헤드 공유를 보일 때 | 2026-10-15 | prefill-decode-kv-cache |
| [DistServe](https://arxiv.org/abs/2401.09670) | Prefill 과 Decode 를 TTFT·TPOT 두 지표에 하나씩 대응시키고 서로 간섭한다는 이유로 GPU 를 나눈다 | 두 단계 분리 서빙을 한 줄로 소개할 때 | 2026-10-15 | prefill-decode-kv-cache |
| [Float Exposed (Bartosz Ciechanowski)](https://float.exposed/) | 비트 패턴과 값을 양방향으로 바꾸고 "다음에 적을 수 있는 값까지의 간격"을 함께 보인다. half·bfloat·float·double 을 바꿔 끼운다 | 부동소수점 칸 배분과 정밀도를 직접 만져 보게 할 때 | 2026-10-15 | gpu-vram-fp16-int4-quantization |
| [Maarten Grootendorst, A Visual Guide to Quantization](https://www.maartengrootendorst.com/blog/quantization/) | absmax 로 3.08·3.02 가 같은 정수 36이 되는 예, zero-point, 이상치가 눈금을 몰아 버리는 장면과 클리핑, GGUF 블록 구조를 차례로 그린다. 이미지 8색 줄이기 비유 | 양자화를 대칭 → 비대칭 → 이상치 → 묶음 순서로 쌓을 때 | 2026-10-15 | gpu-vram-fp16-int4-quantization |
| [Hugging Face Hub 문서, GGUF](https://huggingface.co/docs/hub/gguf) | GGUF 파일을 바이트 띠 하나로 그리고 헤더·메타데이터·표 정보·본문에 점선 상자로 풀이를 단다(gguf-spec.png). 형식별 bits-per-weight 표 | 파일 형식 구조를 보일 때. 원 그림은 글자가 6~7px이라 그대로 싣지 말고 한국어 띠 그림으로 다시 그린다 | 2026-10-15 | gpu-vram-fp16-int4-quantization |
| [llama.cpp PR #1684, k-quants](https://github.com/ggml-org/llama.cpp/pull/1684) · [quantize README](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md) | 같은 모델을 형식만 바꿔 perplexity·파일 크기·생성 속도를 한 표에 둔다(LLaMA-7B, Llama-3.1-8B) | "비트를 줄이면 얼마나 잃나"를 실측 막대로 그릴 때 | 2026-10-15 | gpu-vram-fp16-int4-quantization |
| [Qwen 문서, Performance of Quantized Models](https://qwen.readthedocs.io/en/stable/getting_started/quantization_benchmark.html) | 0.5B~72B 크기마다 BF16·GPTQ-Int8·Int4·AWQ 점수를 같은 표에 둬 "작은 모델이 더 잃는다"가 보인다 | 모델 크기와 양자화 손실의 관계를 보일 때 | 2026-10-15 | gpu-vram-fp16-int4-quantization |
| [Kwon 외, PagedAttention 논문](https://arxiv.org/abs/2309.06180) | 기존 서버의 메모리 한 줄을 띠로 그리고 칸마다 낭비 종류(reserved·internal·external) 이름을 단다(Figure 3). 실측은 방식별 누적 막대 하나로(Figure 2: 토큰이 든 칸 20.4~38.2% vs 96.3%). 운영체제 대응을 "블록=페이지, 토큰=바이트, 요청=프로세스" 한 줄로 | 메모리 낭비를 종류별로 가르고 실제 값으로 확인시킬 때 | 2026-10-15 | pytorch-to-vllm-serving |
| [vLLM Blog, PagedAttention 공개 글](https://vllm.ai/blog/2023-06-20-vllm) | 블록 테이블을 논리 블록 → 물리 블록 연결 애니메이션으로, 토큰이 하나 늘 때마다 블록이 차고 새 블록을 받는 장면을 따라간다 | 동적 할당·주소 변환을 단계로 보일 때 | 2026-10-15 | pytorch-to-vllm-serving |
| [Anyscale, Continuous batching](https://www.anyscale.com/blog/continuous-batching-llm-inference) | 같은 자리 네 줄 × 시간 칸 격자에서 정적 배치는 먼저 끝난 칸이 빈 채로, Continuous는 빈 칸에 새 시퀀스가 바로 들어가는 두 그림을 나란히 | 스케줄링 방식 비교를 칸 채움으로 보일 때 | 2026-10-15 | pytorch-to-vllm-serving |
| [OSTEP 18장 Paging](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf) | (다른 분야·운영체제) 64바이트 주소 공간, 16바이트 페이지 4개처럼 손으로 셀 수 있는 아주 작은 예로 페이징을 먼저 보이고 실제 크기는 나중에 | 큰 시스템의 원리를 장난감 크기로 줄여 보일 때 | 2026-10-15 | pytorch-to-vllm-serving |

## 미확인

열어 봤지만 내용을 확인하지 못했거나 열리지 않은 곳. 다음에 다시 시도한다.

- [bbycroft.net/llm](https://bbycroft.net/llm) — 3D LLM 시각화. 제목만 읽혔다
- [BertViz](https://github.com/jessevig/bertviz) — README 로 head/model/neuron 뷰가 있다는 것만 확인
- ByteByteGo RAG 글 — 404
- [sixfoisneuf.fr/text-encoding](https://sixfoisneuf.fr/text-encoding) — 검색상 가장 유망했던 인코딩 인터랙티브 데모. DNS 차단으로 열지 못했다. 외부 망에서 다시 시도할 것
- unicodefyi.com 인코딩 시각화, codeshack.io UTF-8 디코더, utf8-playground 라이브 데모(netlify) — 전부 차단
- `*.github.io`·observablehq.com·distill.pub·setosa.io·pudding.cool·explorabl.es — 인터랙티브 explainer 생태계 대부분이 이 샌드박스에서 막힌다. 레퍼런스 탐색을 GitHub 저장소 README·소스로 돌려야 했다
- 유전 암호(코돈·리딩프레임), 악보 기보, 지도학 축 — 확인된 레퍼런스를 하나도 확보하지 못했다
- maryrosecook.com "Git from the inside out", dag.ipfs.tech(IPFS DAG Builder), shattered.io, git-scm.com — 2026-10-14 차단. 내용 주소·Merkle tree 를 다시 다룰 때 외부 망에서 볼 것

## 잘 먹힌 기법

- **온도계 하나로 모든 그림 연동** (llm-temperature-sampling) — 같은 변수 하나가 확률표·수직선·샘플링·물리 비유를 동시에 바꾸니, 그림 여러 개가 한 원리로 묶여 보였다
- **값을 색으로 섞기** (self-attention-qkv) — Value 를 색으로 두면 가중 평균 결과가 "섞인 색"으로 바로 보인다
- **바이트는 고정, 약속만 바꿔 끼우기** (utf8-encoding-mojibake) — 입력을 고정해 두고 해석 규칙만 갈아 끼우게 하니, "데이터는 그대로인데 뜻이 달라진다"가 조작 자체에 들어갔다. 다섯 중 넷이 오류 없이 엉뚱한 답을 내놓는 것도 같은 장치에서 한 번에 보인다
- **비가역성은 선언하지 말고 충돌로 보이기** (utf8-encoding-mojibake) — "되돌릴 수 없다"를 문장으로 말하는 대신, 서로 다른 일곱 글자가 같은 결과로 합쳐지는 표를 놓고 11,172 → 398 이라는 수를 적었다. 주장이 아니라 산수가 됐다
- **되돌리기 버튼을 꺼 둔 채로 두기** (utf8-encoding-mojibake) — 끄고 "장치의 한계가 아니라 이 사고의 성질"이라고 적으니, 비활성 버튼 자체가 설명이 됐다
- **기본값을 실패 상태로** (rag-retrieval-pipeline) — 청킹 실험을 답이 잘린 상태로 시작해 독자가 슬라이더로 고치게 했다
- **약속마다 바이트를 묶는 괄호를 다르게 그리기** (utf8-encoding-mojibake, 다시 만든 판) — 같은 네 바이트 아래 1·2바이트 괄호를 렌즈마다 다시 그리니 "인코딩 = 바이트를 끊어 읽는 규칙"이 글 없이 보였다. 첫 판은 같은 장치를 버튼+문장 상자로 만들어 Critic 3점, 괄호 그림 판은 4점
- **비둘기집을 깔때기로** (utf8-encoding-mojibake) — 서로 다른 일곱 글자에서 나온 선이 상자 하나로 모이는 그림이 "되돌릴 수 없다"를 표보다 빨리 전한다
- **실제 계산값을 그림에 쓰고 진짜 도구 결과와 맞춰 두기** (content-addressing-merkle-tree) — 히어로 나무의 지문을 브라우저에서 git 과 같은 방식(SHA-1, `blob <크기>\0`, tree 항목 형식)으로 계산하고, 같은 파일로 만든 저장소의 `git write-tree` 값과 맞춰 캡션에 적었다. "예시 값" 대신 "독자가 터미널에서 재현할 수 있는 값"이 됐다
- **색은 상태 하나에만** (content-addressing-merkle-tree) — 첫 판은 지문에서 색을 뽑아 "같은 색 = 같은 지문"으로 썼는데, 서로 다른 지문이 비슷한 색을 받아 Critic 3점. 색을 "바뀜(주황)/그대로(회색)/건너뜀(점선)" 상태로만 쓰고, blob 구분은 그림 안에서 차례로 붙인 팔레트로 바꾸니 4점
- **예시 프로젝트 하나로 글 전체 잇기** (content-addressing-merkle-tree) — 히어로의 6파일 프로젝트가 2층 목록, 3층 커밋의 tree(9349304)까지 그대로 이어져 "층을 쌓는다"가 끊기지 않았다. 섹션마다 다른 예시를 쓴 첫 판은 이야기가 세 갈래로 갈렸다는 지적을 받았다
- **같은 입력을 세 갈래로 흘리고 상황 토글 하나만 바꾸기** (ai-agent-vs-chatbot) — 같은 요청을 챗봇·워크플로·Agent 세 칸에 나란히 두고 "이미 같은 티켓이 있음" 상황만 켜고 끄게 했다. 두 칸은 같은 길로 가고 Agent 칸만 길이 바뀌어, 정의 문장 없이 차이가 보였다. 단계마다 "그 단계를 정한 쪽"을 색 칩(사람·코드·모델)으로 달아 글 전체의 시각 언어로 썼다. Critic 4점
- **모든 메시지를 한 줄 띠로 이어 붙이기** (prompt-engineering-roles-few-shot) — 메시지 목록이 역할 표시를 끼운 글 한 줄로 이어지고 끝에 assistant 표시가 열린 채 놓이는 그림 하나로, 역할·예시·대화 기록이 모두 "이어 쓸 글의 앞부분"이라는 것을 한 번에 보였다. 같은 띠를 히어로·퓨샷 두 방법 비교에서 다시 써 글 전체의 시각 언어가 됐다. 히어로에 "바뀐 가중치 0개"를 함께 두니 "퓨샷은 학습이 아니다"가 문장 없이 전해졌다. Critic 4점
- **먼저 예상을 고르게 하고 결과 공개** (prompt-engineering-roles-few-shot) — 첫 판은 흐린 미리보기에 숫자 라벨이 비쳐 답이 새어 나갔다는 지적을 받았다. 대기 상태에서는 막대 길이와 라벨을 모두 숨긴다
- **실제 모델을 돌린 값으로 노선도 한 바퀴** (transformer-attention-how-llm-reads) — 파이프라인 여섯 단계를 순환선 정거장으로 놓고, 정거장마다 Qwen2.5-1.5B 를 직접 돌린 판독값(토큰·id·벡터 색 칸·확률 상위 5)을 달았다. ▶ 한 번이 토큰 하나라서 "한 바퀴 = 한 토큰"이 조작 자체에 들어간다. 정거장 색이 섹션 표지 색으로 글 끝까지 이어진다
- **logit lens 두 기둥** (transformer-attention-how-llm-reads) — 같은 질문을 한국어·영어로 넣고 층마다 1등 후보를 나란히 세우니, 한국어 쪽이 24층 '哪个' → 25층 ' Seoul' → 마지막 ' 서울'로 가는 길이 글 없이 보였다
- **실제 시간으로 재생하는 세 줄 시간 띠** (prefill-decode-kv-cache) — 같은 질문에 붙인 글 길이만 다른 세 줄을 같은 시간축에 놓고 직접 잰 시간 그대로 재생했다. 파란 눈금 간격(Decode)은 세 줄이 거의 같고 주황 덩어리(Prefill)만 0.07초 → 9.88초로 늘어나, "첫 글자만 늦다"가 길이로 보였다
- **두 막대 경주로 roofline 대신하기** (prefill-decode-kv-cache) — 로그축 roofline 대신 "가중치 나르는 시간"과 "계산 시간" 막대 둘을 두고 한 번에 처리할 토큰 수를 늘리게 했다. 나르기 막대는 그대로, 계산 막대만 자라 역전되는 지점이 계산 강도의 기준선이 된다
- **사양 숫자로 하한을 계산하고 실측과 맞춰 두기** (prefill-decode-kv-cache) — M4 대역폭 120GB/s ÷ 3.1GB = 26ms 하한과 실측 43ms 를 나란히 적어 "Decode 속도는 대역폭이 정한다"를 산수로 확인시켰다
- **비트 칸 색을 끝까지 같은 뜻으로** (gpu-vram-fp16-int4-quantization) — 부호·지수·가수·정수 칸 색을 히어로 비트 띠, 비트 탐색기, 범위 띠, 눈금 자까지 같은 뜻으로 썼다. 히어로에서 형식 하나를 바꾸면 숫자 하나의 칸과 GPU 다섯 장 막대가 같이 바뀌어 "칸 크기 × 76억 = 메모리"가 곱셈 없이 보인다
- **사진 색 단계로 양자화 먼저 겪기** (gpu-vram-fp16-int4-quantization, 2판) — 히어로에서 노을 사진 절반의 색 단계를 비트 수만큼 줄이고 같은 비트의 실제 GGUF 파일 크기를 옆에 적었다. 첫 판의 형식 탭 + GPU 막대가 1편 바이트 탭과 겹친다는 Critic 지적으로 바꿨다
- **실험판 아래에 한 값만 따라가는 작은 그림** (gpu-vram-fp16-int4-quantization) — 점 40개가 눈금으로 끌려가는 실험판 다음에 0.29 하나가 ÷scale → 반올림 → ×scale 로 0.24가 되는 세 단계를 따로 그렸다. 전체 모습과 한 값의 계산을 나눠 보여 준다
- **좌석표 하나에 할당 방식 토글** (pytorch-to-vllm-serving) — 같은 요청 열 개를 같은 메모리 칸 96개에 태우고 "최대 길이만큼 미리 잡기 ↔ 블록씩 필요할 때"만 바꾸게 했다. 같은 스텝(8)에서 비교하도록 토글이 스텝을 유지하니, 점선(잡았지만 빈 칸)·빗금(끼인 틈) 면적과 "지금 답하는 요청 3명 ↔ 6명"이 한 번에 바뀐다. 같은 칸·색·점선·빗금 언어를 극장 한 줄, 블록 테이블, prefix 블록 줄까지 이어 썼다
- **버스 두 대 시간 격자** (pytorch-to-vllm-serving) — 정적 배치와 Continuous Batching을 같은 자리 4줄 × 스텝 17칸 격자 두 개로 겹쳐 같이 재생했다. 빗금 빈자리 비율과 끝나는 스텝(17 vs 12)이 같은 눈금 위에서 보인다

## 페이지 레이아웃

그림 하나가 아니라 **페이지 구조**를 고를 때 본다. `/study` 3단계 스토리보드에서 글마다 하나를 고르고,
같은 시리즈 앞 편과 겹치지 않게 한다. 기준: `POSTING.md` 5-2(섹션마다 다른 배치, 가운데 한 열은 절반 이하).
2026-10-13 조사. "열었음"은 이 세션에서 페이지를 열어 본 것이다(WebFetch 는 글만 받아 와서 화면 구조는 설명으로 짐작한 것).

### 갤러리

| 곳 | 쓸모 | 확인 |
|---|---|---|
| [Awwwards](https://www.awwwards.com/websites/) | 상위 수준 사이트. Single page·Scrolling·Storytelling 태그 | 열었음 |
| [One Page Love](https://onepagelove.com) | 원페이지 전문, 섹션 예시가 많다 | 열었음 |
| [SiteInspire](https://www.siteinspire.com) | 타이포 위주·미니멀 | 열었음 |
| [Landingfolio](https://www.landingfolio.com) | 히어로·기능 섹션별 예시 | 열었음 |
| [Made in Webflow](https://webflow.com/made-in-webflow) | Scroll animation·Parallax·GSAP 필터, 구조를 뜯어 볼 수 있는 Cloneable | 열었음 |
| [The Pudding](https://pudding.cool) | 데이터 스토리텔링의 기준점 | 열었음 |
| [Bartosz Ciechanowski](https://ciechanow.ski) | 한 열 + 끌어서 돌리는 그림. 이 블로그 형식과 가장 가깝다 | 열었음 |
| [scroll-driven-animations.style](https://scroll-driven-animations.style) | CSS 만으로 만든 진행 바·가로 섹션·카드 쌓기 데모 | 열었음 |
| [Scrollama](https://github.com/russellsamora/scrollama) | sticky-side·sticky-overlay·모바일 패턴 | README 열었음 |
| [v0 Community](https://v0.app/community) · [Lovable Discover](https://lovable.dev/discover) | AI 생성 페이지가 어디서 비슷해지는지 보는 반면교사 | 열었음 |
| Land-book · Lapa Ninja · Codrops · Godly | — | 미확인(403·리다이렉트) |

### 구조 패턴

| 패턴 | 데스크톱 / 모바일 | 맞는 개념 | 쓴 글 |
|---|---|---|---|
| 분할 히어로(글 + 살아 있는 그림) | 두 칸 / 그림 먼저 쌓기 | 첫 화면에서 원리를 한 번 움직여 보일 때 | self-attention-qkv, content-addressing-merkle-tree, prompt-engineering-roles-few-shot |
| 옆에 붙어 다니는 조작판 | 본문 + 오른쪽 sticky 패널 / 위쪽 sticky 바 | 변수 하나가 모든 그림을 움직일 때 | llm-temperature-sampling |
| 그림 고정 스크롤리텔링 | 그림 sticky + 옆으로 지나가는 단계 / 그림 위에 단계 카드 | 한 그림이 단계별로 변하는 계산 과정 | self-attention-qkv, llm-parameters-7b-explained, prefill-decode-kv-cache |
| 가로 스크롤 띠 | 세로 스크롤을 가로 이동으로 / 스와이프 | 순서·파이프라인·규모 비교 | rag-retrieval-pipeline |
| 장 표지 띠(전폭 색 띠) | 본문을 끊는 화면 전체 폭 띠 / 같음 | 글이 두세 개의 큰 장으로 나뉠 때 | rag-retrieval-pipeline, prompt-engineering-roles-few-shot |
| 지그재그 비대칭 | 그림·글이 좌우를 번갈아 / 위아래 | 짧은 개념 여러 개를 하나씩 그림으로 | utf8-encoding-mojibake |
| 비교 나란히 | 같은 입력, 두 결과 / 탭·위아래(세 칸이면 옆으로 밀기) | 방식 A vs B | utf8-encoding-mojibake, ai-agent-vs-chatbot, llm-parameters-7b-explained, transformer-attention-how-llm-reads |
| 제목 \| 글 머리 | 왼쪽 큰 h2, 오른쪽 본문 / 위아래 | 그림 없이 글로 여는 섹션, 참고 자료 | ai-agent-vs-chatbot, transformer-attention-how-llm-reads, prefill-decode-kv-cache, gpu-vram-fp16-int4-quantization |
| 글 \| 그림 2단 | 글 왼쪽, 세로로 쌓은 그림 오른쪽 / 위아래 | 짧은 설명 + 조작 그림 하나 | ai-agent-vs-chatbot, transformer-attention-how-llm-reads, prefill-decode-kv-cache, gpu-vram-fp16-int4-quantization, pytorch-to-vllm-serving |
| 코드 \| 해설 짝 | 코드·터미널 왼쪽, 번호 해설 오른쪽(sticky), 다음 짝은 좌우 뒤집기 / 위아래 | 코드 해부(5-7) | ai-agent-vs-chatbot, pytorch-to-vllm-serving |
| 실험판 전폭 띠 | 화면 끝까지 닿는 회색 띠 안에 조작 그림 / 같음 | 독자가 직접 눌러 보는 실험 | ai-agent-vs-chatbot, llm-parameters-7b-explained, transformer-attention-how-llm-reads, prefill-decode-kv-cache, gpu-vram-fp16-int4-quantization, pytorch-to-vllm-serving |
| 인용 \| 설명 지그재그 | 큰 따옴표 인용 왼쪽, 풀이 오른쪽 / 위아래 | 정의·원문 인용을 풀 때 | ai-agent-vs-chatbot |
| 벤토 히어로 | 제목·리드 칸, 숫자 하나 칸, 아래 전폭 결과 칸을 한 격자에 / 위아래 | 작은 단위 하나(숫자 하나)와 큰 결과(76억 개)를 한 화면에서 이을 때 | gpu-vram-fp16-int4-quantization |

벤토 격자·잡지형·장 표지의 실제 예시는 아직 열어 보지 못했다. 다음 조사 때 브라우저로 직접 본다.

**접은 패턴: 카드 쌓기(겹쳐 쌓이는 sticky 층).** content-addressing-merkle-tree 에서 파일→폴더→커밋 세 층을 sticky 로 겹쳐 쌓았다가 뺐다(2026-10-14 피드백). 층마다 글·그림·조작판이 들어 있어 화면보다 길었고, 아직 읽고 있는 층을 다음 층이 올라와 덮었다. 본문이 든 섹션에는 쓰지 않는다. 쓴다면 한 화면 안에 다 들어가는 짧은 카드(그림 한 장·한 줄 문구)일 때만이다. 층 순서는 층 표시(`ca-floor`)와 섹션 구분선으로 충분히 보인다.

### 싸게 만드는 효과와 주의

- `animation-timeline: view()/scroll()` — Chrome·Edge 115+, Safari 26. Firefox 는 미지원이니 효과 없이도 최종 상태가 보이게.
- `position: sticky` — 부모에 `overflow: hidden` 이 있으면 안 붙는다. 모바일 높이는 `svh`.
- 커서 반응은 `@media (hover: hover)` 에서만. 계속 움직이는 것은 멈춤 장치. `prefers-reduced-motion` 이면 위치·크기 변화를 끈다.

### 템플릿처럼 보이게 하는 것 (피한다)

같은 회색 둥근 카드 반복 · 위에 색 띠를 두른 카드와 이모지 아이콘 · 모든 섹션이 같은 폭·같은 순서(제목→부제→카드) ·
보라→파랑 그라데이션 히어로 · 숫자 통계 3칸 띠 · 모든 요소가 똑같이 fade-up · 그림 자리에 장식 blob.
한 페이지에 폭을 2~3가지(글 열, 넓은 그림, 전폭 띠) 섞고, 움직임은 상태가 바뀔 때만 쓴다.
