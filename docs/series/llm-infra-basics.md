# LLM 인프라 입문 시리즈 계획 — 전면 재생산 (2026-10-14)

`/study docs/series/llm-infra-basics.md N편` 으로 한 편씩 만든다. 이 문서가 시리즈의 원본이다.

- **왜 다시 만드나 (2026-10-14 사용자 지시):** 12편 모두 `/study` 규약 이전(2026-09-16)에 마크다운으로 만든 글이다.
  그림·인터랙션·레이아웃 다변화가 없고 한 편이 짧고 빈약하다. **주제만 가져오고** 내용은 다시 조사해서 HTML 학습 페이지로 새로 쓴다.
  옛 글의 문장·구성은 옮기지 않는다. 옛 글에 실은 이미지(공식 문서 캡처)는 그림을 대신하지 않는 범위에서 다시 써도 된다.
- **series 슬러그:** `llm-infra-basics`. 슬러그는 옛 글 그대로 두고(링크 보존) 원고를 `.md` → `.html` 로 바꾼다.
- **독자:** 처음 접하는 중학생(`POSTING.md` 5-0). 코드는 거의 없고, 명령 한두 줄(vLLM 띄우기 등)만 5-7 형식으로.
- **겹치는 학습 글:** `self-attention-qkv`(Q·K·V 계산), `llm-temperature-sampling`(온도·샘플링), `rag-retrieval-pipeline`(RAG 전체 흐름·청킹)은
  이미 학습 페이지로 있다. 이 시리즈는 그 내용을 되풀이하지 않고 링크한다 — 2편은 Attention 계산을 깊이 다루지 않고, 8편은 RAG 흐름 대신 벡터 검색 자체를 판다.
- **공통 예시 모델:** 가능하면 Qwen2.5-7B(또는 그 시점 대표 7B 오픈 모델) 하나로 1~5편의 숫자를 잇는다 — 파라미터 수 → 파일 크기 → VRAM → KV Cache.
  편마다 쓰기 직전에 Hugging Face 모델 카드·config 로 다시 확인한다.

## 편 목록

상태: `계획` → `초안`(원고 완성, 적재 전) → `발행`(적재됨).

| # | 슬러그 | 이 편의 한 질문 | 소주제 | 처음 나오는 용어 | 상태 |
|---|---|---|---|---|---|
| 1 | `llm-parameters-7b-explained` | 모델 이름 뒤 "7B"는 무엇을 70억 개 센 것인가? | AI·머신러닝·딥러닝·LLM 의 포함 관계 · 파라미터=가중치(손잡이 비유) · 학습=숫자 고치기, 추론=숫자 쓰기 · safetensors 파일 속 텐서 · 파라미터 수→파일 크기 · 파라미터 vs 벡터 DB | 모델, 파라미터, 가중치, 학습, 추론, 텐서 | 발행 |
| 2 | `transformer-attention-how-llm-reads` | LLM 은 문장을 받아 어떤 순서로 다음 단어 하나를 만들까? | 토큰화(BPE, 한국어가 토큰을 더 먹는 이유) · 토큰 id → 임베딩 · 위치 정보 · 같은 블록 수십 번(Attention+MLP, 잔차) · 마지막 확률표 · 한 글자씩 되먹이는 자기회귀. Attention 계산·온도는 기존 글 링크 | 토큰, 토크나이저, 임베딩, Transformer 블록, 자기회귀 | 발행 |
| 3 | `prefill-decode-kv-cache` | 답의 첫 글자만 유독 늦게 나오는 이유는? | Prefill(한꺼번에) vs Decode(한 개씩) · KV Cache 가 아끼는 계산 · 계산이 막히나 메모리가 막히나 · KV Cache 크기 계산과 GQA · TTFT·TPOT·처리량 | Prefill, Decode, KV Cache, TTFT, TPOT, 메모리 대역폭 | 계획 |
| 4 | `gpu-vram-fp16-int4-quantization` | 7B 모델을 돌리려면 왜 GPU 메모리가 14GB 나 필요할까? | GPU 가 필요한 이유(병렬 곱셈) · VRAM · 숫자 형식(FP32·BF16·FP8·INT4 비트 배분) · 양자화(눈금 줄이기, 오차) · VRAM 계산기(가중치+KV Cache+여유) · 너무 줄이면 생기는 일 | GPU, VRAM, 부동소수점, 양자화, GGUF | 계획 |
| 5 | `pytorch-to-vllm-serving` | 모델 하나로 여러 사람의 질문을 동시에 받으려면? | PyTorch 로 한 명 답하기 · 동시 요청에서 생기는 낭비(메모리 조각·기다림) · PagedAttention(블록 테이블) · Continuous Batching · OpenAI 호환 서버 한 줄 · 다른 엔진(SGLang·TGI·llama.cpp) | 추론 엔진, 배치, PagedAttention, Continuous Batching | 계획 |
| 6 | `enterprise-llm-serving-kubernetes-llm-d-mig` | GPU 한 장이 모자라거나 남을 때 회사는 어떻게 나눌까? | Tensor·Pipeline Parallel · Kubernetes 로 여러 서버 묶기 · MIG 로 한 장 쪼개기 · 요청을 아는 라우터(llm-d: KV 캐시 인지 라우팅, Prefill/Decode 분리) · MaaS | Tensor Parallel, Kubernetes, MIG, 라우터, 오토스케일 | 계획 |
| 7 | `fine-tuning-lora-qlora-peft` | 모델 전체를 다시 학습하지 않고 말투·지식을 고칠 수 있을까? | 사전학습 vs 파인튜닝 · 전체 학습이 비싼 이유(가중치+기울기+옵티마이저) · PEFT · LoRA(얇은 행렬 두 장, rank) · 어댑터 크기 계산 · QLoRA · 파인튜닝 vs RAG vs 프롬프트 | 파인튜닝, 기울기, PEFT, LoRA, rank, QLoRA | 계획 |
| 8 | `rag-embedding-vector-db` | 벡터 DB 는 수백만 개 문서 중 비슷한 것을 어떻게 순식간에 찾을까? | 임베딩 모델(뜻→좌표) · 거리와 코사인 유사도 · 전부 재기(정확·느림) vs ANN · HNSW(층 있는 지름길 그래프) · IVF · 키워드 검색과 하이브리드 · 리랭킹. RAG 전체 흐름은 `rag-retrieval-pipeline` 링크 | 임베딩 모델, 코사인 유사도, ANN, HNSW, 하이브리드 검색, 리랭커 | 계획 |
| 9 | `air-gapped-rag-on-premise-llm` | 인터넷이 끊긴 회사 안에서 생성형 AI 를 돌리려면 무엇을 들여와야 할까? | Air Gap·폐쇄망·온프레미스 · 안에 있어야 할 것(모델·엔진·임베딩·벡터 DB·패키지) · 반입 절차(검사·해시·서명) · 들어온 뒤 구조 · 끊겨도 남는 유출 경로 · 갱신이 가장 어렵다 | 폐쇄망, 온프레미스, 반입, 해시, 미러 저장소 | 계획 |
| 10 | `ai-data-platform-lake-iceberg-spark-starrocks` | AI 가 쓰는 데이터는 어디에 어떤 모양으로 쌓일까? | DB·DW·Data Lake · Object Storage · 행 저장 vs 열 저장(Parquet) · 파일 더미의 문제 → 테이블 형식(Iceberg: 스냅샷·메타데이터 층) · Lakehouse · Spark(나눠 처리) · StarRocks(빠른 질의) | Data Lake, Object Storage, Parquet, Iceberg, Lakehouse, Spark | 계획 |
| 11 | `beyond-llm-xgboost-timesfm-two-tower` | 모든 AI 문제에 LLM 이 정답일까? | 문제 종류가 모델을 고른다 · 표 데이터 → 결정 트리 앙상블(XGBoost) · 시계열 → 기초 모델(TimesFM) · 추천 → Two-Tower 와 2단계 검색 · 비용·지연 비교 | 결정 트리, 부스팅, 시계열, 추천, Two-Tower | 계획 |
| 12 | `ai-in-production-drift-precision-recall-tco-sbom` | 배포한 모델은 왜 시간이 지나면 조용히 나빠질까? | 모델 코드는 작은 상자 · Data Drift·Concept Drift · 오탐·미탐(precision·recall, 문턱 조절) · 운영 비용 TCO · 공급망: SBOM·SAST · 시리즈 마무리 | Drift, precision, recall, 문턱값, TCO, SBOM | 계획 |

각 편은 만든 뒤 상태 칸을 고치고, 만들다 바뀐 질문·소주제가 있으면 여기에 반영한다.
