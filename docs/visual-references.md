# 시각 설명 레퍼런스

`/study` 가 글마다 레퍼런스를 탐색하고 여기에 쌓는다. 기록하는 것은 **설명 방식**이다.
그림체·색·레이아웃은 가져오지 않는다. 실제로 열어 본 것만 적고, 열지 못한 것은 `미확인` 칸에 둔다.
재사용을 강제하려는 목록이 아니다. 다음 글을 쓸 때 고를 수 있는 선택지를 넓히려는 목록이다.

| 레퍼런스 | 설명 기법 | 쓸 때 | 확인일 | 쓴 글 |
|---|---|---|---|---|
| [Transformer Explainer](https://poloclub.github.io/transformer-explainer/) | 실제 GPT-2 위에서 temperature 슬라이더·top-k/top-p 토글로 다음 토큰 확률을 바로 다시 그린다. 토큰에 마우스를 올리면 attention 가중치 강조 | 실제 모델 값으로 보여 주고 싶을 때 | 2026-10-12 | llm-temperature-sampling, self-attention-qkv |
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
| [Red Blob Games, Introduction to A*](https://www.redblobgames.com/pathfinding/a-star/introduction.html) | (다른 분야·지도 탐색) 시작점·목표를 끌어서 옮기고, 탐색 경계가 퍼지는 과정을 단계별로 본다. 루프를 한 번씩 넘기는 Step 버튼 옆에 그 루프의 상태를 같이 둔다 | 공간 위 탐색을 조작하게 할 때, 반복문을 한 바퀴씩 따라가게 할 때 | 2026-10-14 | rag-retrieval-pipeline, ai-agent-vs-chatbot |
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
| 분할 히어로(글 + 살아 있는 그림) | 두 칸 / 그림 먼저 쌓기 | 첫 화면에서 원리를 한 번 움직여 보일 때 | self-attention-qkv, content-addressing-merkle-tree |
| 옆에 붙어 다니는 조작판 | 본문 + 오른쪽 sticky 패널 / 위쪽 sticky 바 | 변수 하나가 모든 그림을 움직일 때 | llm-temperature-sampling |
| 그림 고정 스크롤리텔링 | 그림 sticky + 옆으로 지나가는 단계 / 그림 위에 단계 카드 | 한 그림이 단계별로 변하는 계산 과정 | self-attention-qkv |
| 가로 스크롤 띠 | 세로 스크롤을 가로 이동으로 / 스와이프 | 순서·파이프라인·규모 비교 | rag-retrieval-pipeline |
| 장 표지 띠(전폭 색 띠) | 본문을 끊는 화면 전체 폭 띠 / 같음 | 글이 두세 개의 큰 장으로 나뉠 때 | rag-retrieval-pipeline |
| 지그재그 비대칭 | 그림·글이 좌우를 번갈아 / 위아래 | 짧은 개념 여러 개를 하나씩 그림으로 | utf8-encoding-mojibake |
| 비교 나란히 | 같은 입력, 두 결과 / 탭·위아래(세 칸이면 옆으로 밀기) | 방식 A vs B | utf8-encoding-mojibake, ai-agent-vs-chatbot |
| 제목 \| 글 머리 | 왼쪽 큰 h2, 오른쪽 본문 / 위아래 | 그림 없이 글로 여는 섹션, 참고 자료 | ai-agent-vs-chatbot |
| 글 \| 그림 2단 | 글 왼쪽, 세로로 쌓은 그림 오른쪽 / 위아래 | 짧은 설명 + 조작 그림 하나 | ai-agent-vs-chatbot |
| 코드 \| 해설 짝 | 코드·터미널 왼쪽, 번호 해설 오른쪽(sticky), 다음 짝은 좌우 뒤집기 / 위아래 | 코드 해부(5-7) | ai-agent-vs-chatbot |
| 실험판 전폭 띠 | 화면 끝까지 닿는 회색 띠 안에 조작 그림 / 같음 | 독자가 직접 눌러 보는 실험 | ai-agent-vs-chatbot |
| 인용 \| 설명 지그재그 | 큰 따옴표 인용 왼쪽, 풀이 오른쪽 / 위아래 | 정의·원문 인용을 풀 때 | ai-agent-vs-chatbot |

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
