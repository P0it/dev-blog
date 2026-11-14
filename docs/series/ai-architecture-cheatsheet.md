# 한 장으로 보는 AI 시스템 설계 — 시리즈 계획

ByteByteGo 처럼 **그림 한 장으로 구조와 흐름이 보이는** 치트시트 시리즈다. 요즘 AI 시스템의 설계(Agent·LangGraph·RAG·MCP·서빙·운영)를
편마다 하나씩 다룬다. 이 문서가 시리즈의 원본이다. 편을 만들 때마다 상태 칸을 고친다.

- **series 슬러그:** `ai-architecture-cheatsheet`. frontmatter 에 `series: ai-architecture-cheatsheet`, `series_order: N`. 슬러그 접두어는 두지 않는다.
- **형식:** `POSTING.md` 5-10 한 장 그림 치트시트. 시각 규약(아이콘 노드 + 옅은 구역 면, 실제 로고, 번호 배지·hover 효과 없음)이 거기 있다. 1편 `auto-drafts/posts/ai-app-architecture-map.html` 이 견본이다.
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

상태: `계획` → `초안`(적재됨) → `발행`.

| # | 주제 (슬러그) | 이 편의 한 질문 | 대표 그림 | 자세히 푼 글(ai-agent 등) | 상태 |
|---|---|---|---|---|---|
| 1 | AI 앱 전체 구조 (`ai-app-architecture-map`) | AI 서비스에는 모델 말고 무엇이 더 필요할까요? | 세 구역 구조도 + 요청 하나의 시퀀스 + 4단계 확장 | ai-agent-vs-chatbot, rag-retrieval-pipeline, mcp-host-client-server-primitives | 초안 |
| 2 | 워크플로와 Agent, 다섯 패턴 | 정해진 순서로 충분한 일과 Agent 가 필요한 일은 어디서 갈릴까요? | Anthropic 5패턴(체이닝·라우팅·병렬·오케스트레이터-워커·평가자-최적화) 작은 그림 나란히 + Agent | workflow-vs-agent-chaining-routing, workflow-parallel-orchestrator-evaluator | 계획 |
| 3 | Agent 루프와 Tool Calling | 모델은 도구를 직접 실행하지 않는데 Agent 는 어떻게 일을 할까요? | 사용자·앱·모델·도구 시퀀스, stop_reason 갈림길 | llm-tool-calling-json-schema, ai-agent-loop-stop-conditions | 계획 |
| 4 | RAG 구조의 변천 | Naive RAG 에서 Agentic RAG·GraphRAG 까지 무엇이 더해졌을까요? | 네 가지 파이프라인을 같은 축에 겹쳐 그림 | rag-retrieval-pipeline, agentic-rag-search-as-tool-langchain | 계획 |
| 5 | LangGraph 한 장 | 그래프로 짠 Agent 는 상태를 어디에 두고 어떻게 멈췄다 다시 갈까요? | State·Node·Edge·Checkpointer·interrupt·Send 한 장 | langgraph-state-node-edge-intro, langgraph-interrupt-human-approval-checkpoint | 계획 |
| 6 | Multi-Agent 패턴 | Agent 를 여럿 둘 때 일을 맡기는 방식은 몇 가지일까요? | Subagents·Handoffs·Skills·Router·Custom 다섯 배치 | multi-agent-when-to-split, subagent-vs-handoff-langchain | 계획 |
| 7 | MCP 와 A2A | 도구를 잇는 규격과 Agent 끼리 잇는 규격은 무엇이 다를까요? | Host·Client·Server 와 Agent Card·Task 를 한 화면에 | mcp-host-client-server-primitives | 계획 |
| 8 | Agent 메모리와 Context Engineering | 컨텍스트 창에는 무엇이 어떤 순서로 들어갈까요? | 컨텍스트 창 구성 막대 + write·select·compress·isolate | langchain-agent-memory-context-engineering, context-engineering-claude-md-agents-md | 계획 |
| 9 | LLM 서빙 스택 | 요청이 GPU 에 닿기까지 서빙 엔진은 무엇을 할까요? | 스케줄러·continuous batching·prefill/decode·KV cache(paged) | prefill-decode-kv-cache, pytorch-to-vllm-serving | 계획 |
| 10 | LLM Gateway | 모델이 여럿일 때 요청은 누가 나누고 막힐 때 누가 돌릴까요? | 인증·한도·라우팅·폴백·캐시·비용 집계 | — | 계획 |
| 11 | 가드레일과 보안 계층 | 문서 한 장이 Agent 를 조종하지 못하게 하려면 어디에 무엇을 둘까요? | 입력·도구 권한·샌드박스·출력 검사 층, lethal trifecta | agent-security-prompt-injection-trifecta | 계획 |
| 12 | 평가와 관측 파이프라인 | Agent 가 잘하는지 어떻게 숫자로 볼까요? | trace·span → 데이터셋 → 오프라인/온라인 평가 → 개선 고리 | agent-evaluation-tracing-trajectory | 계획 |
| 13 | 코딩 Agent 의 구조 | Claude Code 같은 코딩 Agent 안에는 무엇이 들어 있을까요? | 하네스·도구·권한·컨텍스트 파일·서브에이전트·훅·스킬·샌드박스 | agent-skills-subagents-hooks, context-engineering-claude-md-agents-md | 계획 |
| 14 | 오래 일하는 Agent | 몇 시간짜리 조사를 맡겨도 길을 잃지 않으려면? | 계획·병렬 하위 Agent·파일 메모·durable execution·인용 | deep-agents-plan-files-skills | 계획 |
| 15 | Voice Agent 파이프라인 | 말로 대화하는 Agent 는 무엇 때문에 느려질까요? | STT→LLM→TTS 연쇄 vs 음성-음성 모델, 지연 예산·끼어들기 | — | 계획 |

편마다 다시 확인할 것: 해당 라이브러리 버전(langgraph·MCP 스펙·vLLM 등), 공식 문서의 현재 권장 패턴 이름.
