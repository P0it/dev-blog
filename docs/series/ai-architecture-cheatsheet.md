# 한 장으로 보는 AI 시스템 설계 — 시리즈 계획

ByteByteGo 처럼 **그림 한 장으로 구조와 흐름이 보이는** 치트시트 시리즈다. 요즘 AI 시스템의 설계(Agent·LangGraph·RAG·MCP·서빙·운영)를
편마다 하나씩 다룬다. 이 문서가 시리즈의 원본이다. 편을 만들 때마다 상태 칸을 고친다.

- **series 슬러그:** `ai-architecture-cheatsheet`. frontmatter 에 `series: ai-architecture-cheatsheet`, `series_order: N`. 슬러그 접두어는 두지 않는다.
- **형식:** `POSTING.md` 5-10 — 보드 한 장 + 공통 예시 하나. 시각 규약(아이콘 노드 + 옅은 구역 면, 실제 로고, 번호 배지·hover 효과 없음)도 거기 있다. 견본은 1·2편.
- **독자:** AI 앱을 처음 설계해 보는 개발자. `/study` 의 중학생 눈높이보다 한 단계 위라 비유를 늘어놓지 않고 용어를 한 줄로 푼다.
  깊은 설명은 `ai-agent` 시리즈 해당 편으로 링크한다(그 시리즈와 겹치는 주제는 "한눈에 보기"만 맡는다).
- **근거:** 공식 문서·스펙·원저자 글. 편마다 쓰기 직전에 버전과 현재 권장 방식을 다시 확인한다.
- **provider 균형:** 모델 로고·예시를 한 회사로 몰지 않는다(Claude·GPT·Gemini·오픈 모델을 함께).

## 2026-11-14 시안에서 정한 것 (사용자 지적 순)

| 지적 | 반영 |
|---|---|
| 글자 칩만 든 상자 지도는 AI slop 같다 | 칸마다 Lucide 아이콘 + 실제 제품 로고(`npm run icons`) |
| 클릭도 못 하는데 hover 시 다른 칸이 흐려진다 | 정적 그림에 hover 효과를 두지 않는다 |
| 상표 고지 문단·시리즈 15편 목록이 군더더기 | 뺀다. 이전·다음 편은 사이트가 붙인다. 끝 섹션은 "더 읽어 보기" 두 줄 |
| "지도·칸·여덟 칸" 같은 표현이 어색하다 | 평범한 말로: 구성 요소·구조도·운영 계층 |
| 역할 색 옅은 바탕 + 같은 색 테두리 블록이 AI slop 같다 | 블록 바탕·테두리에 역할 색을 쓰지 않는다. 색은 아이콘에만 |
| 숫자 번호 배지도 필요 없다 | 구조도에 번호 배지 없음. 순서가 뜻인 시퀀스 그림의 단계 번호만 둔다 |
| 블록이 빽빽하다 → 시안 A~E, D1~D3 비교 | **아이콘 노드 + 옅은 구역 면(D1)** 채택. 구성 요소 하나에 상자를 씌우지 않고 큰 구역(사용자 쪽 / 우리가 운영하는 서비스 / 바깥에서 불러 쓰는 것)만 면으로 묶는다 |
| 단계 그림의 화살표가 어색하다 | 블록 사이 연결선을 없애고 화살표는 단계 사이에만. 새로 추가되는 항목만 색 |

## 편 목록

**기준 (2026-11-14 사용자 지시): 편마다 AI 시스템 하나의 구성 요소와 요청이 흐르는 길을 한 장에 보여 준다.** 블로그 글감으로 흔한
제품·개념 비교(프레임워크 6종 비교, MCP vs Skills 등)는 아키텍처가 아니라서 편으로 두지 않는다. 주제 빈도 조사(ByteByteGo 2025-01~2026-11 글 436개,
Daily Dose of DS 577개, Chip Huyen "AI Engineering" 목차, Anthropic·OpenAI·LangGraph·MCP·A2A 공식 문서)는 그 시스템이 실제로 많이 다뤄지는지 확인하는 데만 썼다.

상태: `계획` → `초안`(적재됨) → `발행`.

| # | 아키텍처 (슬러그) | 한 장에 보일 것 | 근거·메모 | 상태 |
|---|---|---|---|---|
| 1 | AI 앱 전체 (`ai-app-architecture-map`) | 클라이언트 → API → 오케스트레이션 → 모델·지식·도구, 운영 계층 | ByteByteGo EP171·EP218, Chip 1·10장 | 초안 |
| 2 | 워크플로·Agent 흐름 패턴 (`workflow-agent-patterns-map`) | 패턴 6가지의 흐름 구조 | Anthropic Building effective agents | 초안 |
| 3 | Agent 런타임 | 루프·모델·도구·메모리·가드레일이 맞물리는 구조, 멈추는 조건 | ByteByteGo EP218·"The Agent Loop" | 계획 |
| 4 | RAG 시스템 | 적재 파이프라인(청킹·임베딩·색인)과 질의 파이프라인(검색·리랭킹·생성), Agentic·Graph 변형 | 출처 전체에서 가장 많이 반복 | 계획 |
| 5 | Multi-Agent 시스템 | 오케스트레이터·서브에이전트·공유 상태, 결과 종합 | Anthropic multi-agent research system | 계획 |
| 6 | MCP 연결 구조 | Host·Client·Server, 전송 방식, 인증, Tasks(2026-07-28 스펙) | MCP가 반복 빈도 2위 | 계획 |
| 7 | Agent 간 연결 (A2A) | Agent Card로 찾기 → Task 주고받기, MCP와 놓이는 자리 | 6과 합칠지 미정 | 계획 |
| 8 | 메모리·컨텍스트 | 컨텍스트 창 구성과 단기·장기 저장소 | Anthropic context engineering·agent memory | 계획 |
| 9 | LLM 서빙 | 라우터·스케줄러·prefill/decode·KV cache·GPU | Chip 9장, ByteByteGo Inference Engineering | 계획 |
| 10 | LLM Gateway | 인증·한도·라우팅·폴백·캐시·비용 집계가 놓이는 자리 | 비용(라우팅·캐싱) 주제를 여기서 | 계획 |
| 11 | 보안 | 입력 검사 → 권한 → 샌드박스 → 출력 검사 층 | Anthropic sandboxing, ByteByteGo 위협 모델 | 계획 |
| 12 | 평가·관측 | trace 수집 → 저장 → 오프라인/온라인 평가 → 개선 | Chip 3·4장, Anthropic agent evals | 계획 |
| 13 | 코딩 Agent | 요청이 harness를 지나는 길: 도구·권한·훅·서브에이전트 | harness 개념을 여기에 흡수 | 계획 |
| 14 | 장기 실행 Agent | 체크포인트·작업 큐·재시작(durable execution) | Anthropic long-running harness, MCP Tasks, LangGraph | 계획 |
| 15 | Voice Agent | STT → LLM → TTS 연쇄와 음성-음성 모델, 지연이 생기는 곳 | 다룬 글은 적지만 실제 시스템 구조 | 계획 |

뺀 것: 프레임워크 비교·MCP vs Skills 비교(아키텍처 아님), Fine-tuning(모델 학습 쪽). harness·비용은 13·10편 안의 구성 요소로.

편마다 다시 확인할 것: 해당 라이브러리 버전(langgraph·MCP 스펙·vLLM 등), 공식 문서의 현재 권장 패턴 이름.
