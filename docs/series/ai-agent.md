# AI Agent 시리즈 계획

`/study docs/series/ai-agent.md N편` 으로 한 편씩 만든다. 이 문서가 시리즈의 원본이다. 편을 만들 때마다
상태 칸을 고치고, 만들다 바뀐 내용(질문·소주제·용어)이 있으면 여기에도 반영한다.

- **series 슬러그:** `ai-agent`. frontmatter 에 `series: ai-agent`, `series_order: N` 을 넣는다. `/admin/series` 에 행이 있어야 한다.
- **독자:** Agent 를 처음 접하는 개발자. Python 은 읽지만 LLM·Agent 용어는 모른다. 설명은 `POSTING.md` 5-0 중학생 눈높이를,
  코드는 5-7 코드 해부를 따른다.
- **공통 실습:** 가상 IT 헬프데스크 Agent. 편마다 앞 편의 결과물을 키운다. 데이터(FAQ·매뉴얼·티켓)는 전부 새로 만든다.
- **코드:** 글 속 발췌만 싣고 별도 레포는 없다. 모델은 `init_chat_model` 로 교체할 수 있게 쓴다. 코드는 scratchpad 에서 모의 서버로 호출 형태를 확인한다.
- **provider 균형 (2026-10-16 사용자 지시):** 특정 회사 모델을 기본값으로 굳히지 않는다. 사용자는 Claude 도 좋아한다. 1·2편은 OpenAI SDK(`openai`)로 썼으니
  3편 raw SDK 루프는 Anthropic SDK(`anthropic`)를 기본으로 쓰고 OpenAI 판은 접힌 블록으로 둔다. 4편부터는 `init_chat_model` 로 예제마다
  Claude·GPT 를 섞어 쓴다. 본문 예시("ChatGPT에 물으면")도 한쪽만 들지 않는다. 한쪽 기능 차이(Claude 의 OpenAI SDK 호환 주소에서 strict 무시,
  Opus·Sonnet 5.5 의 도구 강제 미지원 등)는 그 편 주제와 닿으면 접힌 블록으로 짚는다.
- **용어: "Agent 프로그램" (2026-10-16 사용자 지시):** 모델을 부르고 메시지 목록을 들고 도구를 실행하는 쪽은 **"Agent 프로그램"**(개발자가 짠 코드로,
  사용자와 모델 사이 뒤쪽에서 돈다)이라고 부른다. "내 코드"는 쓰지 않는다 — 그림에 사용자(직원)가 따로 나와 "내"가 사용자 쪽으로 읽힌다.
  Agent 가 되기 전 단계(챗봇 코드)나 독자가 직접 쓰는 코드 줄을 가리킬 때만 "우리가 짠 프로그램/코드"를 쓴다. 1·2편은 이 규칙으로 고쳤다.
  페이지는 실제 API 를 부르지 않고, 실행 결과는 터미널 칸의 예시 출력을 "실행해 보기" 버튼으로 찍어 보인다(POSTING 5-7).
- **근거 자료 (2026-10-14 사용자 지시):** 최신 기준이면서 믿을 만한 1차 자료로만 쓴다. 우선순위는 다음과 같다.
  1. 공식 문서·스펙: docs.langchain.com(LangChain·LangGraph), modelcontextprotocol.io 스펙과 공식 블로그, 각 provider 공식 문서
  2. 버전과 패키지 상태: PyPI, 공식 GitHub 릴리스 노트
  3. 원저자 글·논문: Anthropic Engineering("Building effective agents", "Effective context engineering"), ReAct 논문, Simon Willison(lethal trifecta) 등
  4. 2차 해설은 1차 자료로 확인될 때만 쓴다
- **사내 PDF 두 권은 근거로 쓰지 않는다.** 사내에 돌던 학습용 자료라 신뢰도가 낮다(옛 모델 id, 비표준 장기 기억 구현, 사실 오류가 실제로 있었다).
  커리큘럼을 짤 때 범위만 한 번 대조했고, 글을 쓸 때는 열지 않는다.
- **버전 기준(2026-10-13 조사):** langchain 1.4.x, langgraph 1.2.x, langchain-mcp-adapters 0.3.x, deepagents 0.7.x,
  MCP 스펙 2026-07-28(공식 Python SDK v2 는 RC). **편마다 쓰기 직전에 PyPI·공식 문서로 다시 확인한다.**

## 커리큘럼을 이렇게 짠 이유

| 2026-10 사실 | 반영 |
|---|---|
| LangChain 1.x 의 표준은 `create_agent` + middleware. LCEL·legacy chain 은 `langchain-classic` 으로 밀려남 | LCEL 단독 편 없음. Structured Output·Middleware 를 독립 편으로 |
| `create_react_agent` deprecated | 한 줄 언급만 |
| `langgraph-supervisor` 관리 중단. 공식 문서는 Subagents·Handoffs·Skills·Router·Custom 5패턴 | Multi-Agent 파트를 5패턴 기준으로 |
| MCP 2026-07-28: 세션 제거, MRTR, Tasks·Apps extension, Sampling·Roots deprecated | MCP 파트를 새 스펙 기준으로 |
| MS·Kaggle·HF 커리큘럼 모두 Context Engineering·Memory·평가·보안을 독립 강의로 둠 | 각각 독립 편 |
| Agent Skills(SKILL.md) 업계 공통 형식화, Deep Agents 성장 | Deep Agents 편 추가 |
| Anthropic "Building effective agents" 5패턴은 여전히 기준 | 워크플로 2편 |
| 프레임워크부터 배우면 무엇을 대신해 주는지 모른다 | 1~3편은 프레임워크 없이 루프를 직접 짠다. 이후 편은 "3편 루프의 어디를 대신하나"로 설명 |

## 편 목록

상태: `계획` → `초안`(적재됨) → `발행`.

### Part 1. Agent 의 뼈대 — 프레임워크 없이

| # | 제목(가안) | 이 편의 한 질문 | 소주제 | 처음 나오는 용어 | 코드 결과물 | 선행 | 상태 |
|---|---|---|---|---|---|---|---|
| 1 | AI Agent는 더 똑똑한 챗봇이 아니다 (`ai-agent-vs-chatbot`) | 질문에 답하는 프로그램과 일을 해 주는 프로그램은 어디서 갈리나? | 챗봇→워크플로→Agent 스펙트럼 · 4요소(모델·지시·도구·상태) · LLM 은 글만 낸다 · 헬프데스크 실습 소개 | LLM, 프롬프트, 메시지(role), 토큰, 컨텍스트, Agent, 워크플로 | SDK 로 LLM 한 번 호출(`model`·`messages`·`temperature` 해설) | — | 초안 |
| 2 | Tool Calling에서 함수는 누가 실행할까? (`llm-tool-calling-json-schema`) | 글만 쓰는 모델이 어떻게 티켓을 조회하나? | 모델은 실행을 요청만 한다 · JSON Schema 는 메뉴판 · 요청서도 글(채팅 템플릿 → API 서버가 `tool_calls` 로 정리) · 메뉴판도 토큰 · `tool_choice` · 두 번 호출 · `tool_call_id` 번호표(parallel) · 요청서 확인과 strict | Tool Calling(Function Calling), JSON Schema, API 서버, 도구 결과 메시지, tool_choice, parallel tool calls | raw SDK 로 티켓 조회 도구 1개(`ask_tool.py`·`run_tool.py`, openai 3.31) | 1 | 초안 |
| 3 | Agent의 while 루프는 무엇이 멈추게 할까요? (`ai-agent-loop-stop-conditions`) | Agent 는 언제 멈추나? | 호출 횟수를 코드가 모른다 · messages 카드가 바퀴마다 두 장씩 쌓인다 · stop_reason 갈림길(tool_use·end_turn·max_tokens·refusal) · 바퀴 수 한도와 비용 · 도구 오류는 is_error 결과로 · ReAct 대응 · OpenAI 와 tool runner(접힘) | Agent 루프, stop_reason, ReAct, 종료 조건 | 25줄 루프(도구 2개, `agent.py`, anthropic 1.15) | 2 | 발행 |

### Part 2. LangChain v1 으로 Single Agent

| # | 제목(가안) | 이 편의 한 질문 | 소주제 | 처음 나오는 용어 | 코드 결과물 | 선행 | 상태 |
|---|---|---|---|---|---|---|---|
| 4 | GPT를 Claude로 바꾸는 데 필요한 코드 한 줄, LangChain 첫걸음 (`langchain-init-chat-model-switch-provider`) | 모델을 바꿀 때마다 코드를 다 고쳐야 하나? | `init_chat_model` · Message 종류 · `ChatPromptTemplate`(짧게) · `invoke`/`stream`/`batch` · `content_blocks` · provider 교체 · LCEL 은 예전 방식(한 줄) | 프레임워크, provider, 스트리밍 | 모델 선택 가능한 호출 모듈 | 3 | 발행 |
| 5 | 모델 답을 프로그램이 믿고 쓰려면 어떤 양식이 필요할까요? (`llm-structured-output-pydantic-langchain`) | 자유로운 글을 어떻게 프로그램이 믿고 쓰는 데이터로 받나? | Pydantic 모델 · `response_format` · ToolStrategy vs ProviderStrategy · 실패와 재시도 | Structured Output, Pydantic, 스키마 검증 | 요청 의도 분류기 | 4 | 발행 |
| 6 | 모델이 도구를 잘못 고르는 이유는 설명서에 있다 (`ai-agent-tool-design-description-schema`) | 모델이 도구를 잘못 고르는 건 누구 탓인가? | `@tool` · docstring=설명서, 타입힌트=스키마 · 이름·설명·반환 크기·에러 메시지 설계 · ToolRuntime·`context_schema` 로 사용자 정보 받기 | 도구 설명(description), 인자 스키마 | FAQ 검색·계산·티켓 조회 3도구 | 5 | 발행 |
| 7 | 직접 짠 루프 24줄은 create_agent 안 어디에 있을까요? (`langchain-create-agent-loop-anatomy`) | 3편의 50줄은 한 줄로 어떻게 줄어드나? | 루프를 맡기기 · `system_prompt` · 스트리밍으로 단계 보기 · recursion limit · 속은 그래프(11편 예고) | system prompt, recursion limit | 3도구 헬프데스크 Agent | 3, 6 | 발행 |
| 8 | Agent 루프에 코드를 끼워 넣는 여섯 곳, Middleware (`langchain-middleware-hooks-guardrails`) | 루프를 고치지 않고 동작을 끼워 넣을 수 있나? | 훅 위치(before/after model, wrap tool) · 내장(Summarization·HITL·PII·CallLimit·ModelFallback·ToolRetry) · 커스텀(데코레이터 훅) · Guardrail(`jump_to` 로 막기, 답 고쳐 쓰기) | Middleware, 훅, Guardrail | 호출 제한·PII 가림·재시도 붙인 Agent | 7 | 발행 |
| 9 | 책상 위와 서랍 속, Agent의 단기 기억과 장기 기억 (`langchain-agent-memory-context-engineering`) | Agent 는 어제 대화를 어떻게 기억하고, 무엇을 잊어야 하나? | 단기 기억(checkpointer·`thread_id`) · 장기 기억(Store) · 컨텍스트 창=책상 크기 · write/select/compress/isolate | 단기·장기 기억, checkpointer, thread, Context Engineering | 대화를 이어 가는 Agent | 8 | 발행 |
| 10 | 검색을 도구로 바꾸면 달라지는 것, Agentic RAG (`agentic-rag-search-as-tool-langchain`) | 검색할지, 다시 검색할지는 누가 정하나? | 리트리버를 도구로 · 청킹·임베딩·벡터 DB 요약(기존 RAG 글 링크) · 근거 표시 · 검색 실패·재검색 | Agentic RAG, 리트리버, 청크, 임베딩, 벡터 DB | IT 매뉴얼 검색 도구 | 9 | 발행 |

### Part 3. LangGraph 로 흐름 직접 설계

| # | 제목(가안) | 이 편의 한 질문 | 소주제 | 처음 나오는 용어 | 코드 결과물 | 선행 | 상태 |
|---|---|---|---|---|---|---|---|
| 11 | x (`langgraph-state-node-edge-intro`) | 흐름을 왜 그래프로 그리나? | `create_agent` 도 그래프 · StateGraph · TypedDict 상태 · reducer · START/END | 그래프, State, Node, Edge, reducer | 3노드 그래프 | 7 | 발행 |
| 12 | x (`langgraph-rebuild-agent-graph-by-hand`) | `create_agent` 속을 직접 열면 무엇이 있나? | LLM 노드 + ToolNode · conditional edge · 루프 · `Command` | conditional edge, ToolNode, Command | 그래프판 헬프데스크 Agent | 11 | 발행 |
| 13 | x (`workflow-vs-agent-chaining-routing`) | 정해진 순서로 충분한 일에 Agent 가 필요한가? | 워크플로 vs Agent(Anthropic) · 순차 체이닝 · 계정·장비·SW 라우팅 | Prompt Chaining, Routing | 문의 유형별 분기 | 12 | 발행 |
| 14 | x (`workflow-parallel-orchestrator-evaluator`) | 일을 나눠 맡기고 다시 모으려면? | 병렬 분기 · `Send` 로 나눠 주기(map-reduce) · 평가자-생성자 반복과 종료 조건 | Parallelization, Orchestrator-Worker, Evaluator-Optimizer, Send | 여러 문서 병렬 분석 후 통합 | 13 | 발행 |
| 15 | x (`langgraph-interrupt-human-approval-checkpoint`) | 사람 승인을 기다리는 동안 Agent 는 어디에 있나? | checkpointer · `interrupt`/`Command(resume=)` · 승인 흐름 · state history·time travel · durable execution | Human-in-the-loop, interrupt, time travel, durable execution | 승인 후 처리하는 Agent | 9, 12 | 발행 |
| 16 | 실무형 그래프: 실패에 강하게, 고치기 쉽게 | 요구사항 문장을 어떻게 노드와 상태로 바꾸나? | 상태 설계 · RetryPolicy·에러 경로 · Studio·스트리밍 디버깅 · 미니 프로젝트 | RetryPolicy, 상태 스키마 | 이메일 문의 분류·검색·답변 초안 | 15 | 계획 |

### Part 4. Multi-Agent

| # | 제목(가안) | 이 편의 한 질문 | 소주제 | 처음 나오는 용어 | 코드 결과물 | 선행 | 상태 |
|---|---|---|---|---|---|---|---|
| 17 | 에이전트를 여러 개로 나눠야 할 때 | Agent 를 하나 더 두면 정말 나아지나? | 싱글로 충분한 경우 · 비용·지연 · 컨텍스트 격리 · 공식 5패턴 지도(Subagents·Handoffs·Skills·Router·Custom) | Multi-Agent, 컨텍스트 격리 | 역할 분리 설계도 | 16 | 계획 |
| 18 | Subagent 와 Handoff 구현 | 일을 맡길 때와 넘길 때는 무엇이 다른가? | 하위 Agent 를 도구로(supervisor) · 제어권 넘기기(handoff) · 공유 상태·메시지 전달 · supervisor 라이브러리가 접힌 이유 | Subagent, Supervisor, Handoff | 분류 Agent + 해결 Agent | 17 | 계획 |
| 19 | Deep Agents: 계획하고 파일에 적는 Agent | 긴 일을 하는 Agent 는 어떻게 길을 잃지 않나? | `write_todos` 계획 · filesystem 오프로딩 · 서브에이전트 격리 · Agent Skills(SKILL.md)와 단계적 공개 | Deep Agent, Agent Skills, progressive disclosure | 계획 세우는 장애 조사 Agent | 18 | 계획 |

### Part 5. MCP 로 바깥 세상과 연결

| # | 제목(가안) | 이 편의 한 질문 | 소주제 | 처음 나오는 용어 | 코드 결과물 | 선행 | 상태 |
|---|---|---|---|---|---|---|---|
| 20 | MCP 란 무엇인가 | 도구를 이미 부를 수 있는데 MCP 는 왜 필요한가? | USB-C 비유와 한계 · Host/Client/Server · Tools/Resources/Prompts · Tool Calling 과의 관계 · 2026-07-28 변화(stateless·MRTR·Tasks) · A2A 의 자리 | MCP, Host, Client, Server, Resource, A2A | 구조도(코드 최소) | 6 | 계획 |
| 21 | Python 으로 MCP Server 만들기 | 내 사내 시스템을 어떤 Agent 든 쓰게 하려면? | FastMCP · 도구·입력 스키마 · stdio vs Streamable HTTP · Inspector 테스트 | stdio, Streamable HTTP, Inspector | 티켓 MCP 서버 | 20 | 계획 |
| 22 | Agent 에 MCP 연결하기 | 남이 만든 도구를 내 Agent 에 꽂으면 무엇을 조심하나? | `MultiServerMCPClient` · 도구 발견 · 타임아웃·인증(OAuth)·권한 · 실패 처리 | OAuth, 권한 범위 | MCP 연동 헬프데스크 Agent | 12, 21 | 계획 |

### Part 6. 운영과 최종 프로젝트

| # | 제목(가안) | 이 편의 한 질문 | 소주제 | 처음 나오는 용어 | 코드 결과물 | 선행 | 상태 |
|---|---|---|---|---|---|---|---|
| 23 | Agent 를 평가하고 들여다보기 | Agent 가 "잘한다"는 걸 어떻게 숫자로 보이나? | 트레이싱(LangSmith·OTel GenAI) · 데이터셋 · 최종 답 vs 궤적 평가 · LLM-as-judge · `LLMToolEmulator` 로 도구 흉내 내 테스트 · 비용·지연 | trace, span, eval, 궤적(trajectory), LLM-as-judge | 평가 데이터셋 + 실행 기록 | 16 | 계획 |
| 24 | Agent 보안 | 문서 한 장이 Agent 를 조종할 수 있나? | Prompt Injection · lethal trifecta · 최소 권한·승인·샌드박스 · PII · MCP 서버 신뢰 | Prompt Injection, 최소 권한, 샌드박스 | 위험 도구 승인·권한 통제 | 22, 23 | 계획 |
| 25 | 최종 프로젝트 ①: 설계와 조립 | 지금까지의 부품은 한 서비스에서 어떻게 맞물리나? | 요구사항 → 아키텍처 · 부품 조립(RAG·그래프·MCP·HITL) · FastAPI 스트리밍 API | API, SSE | 헬프데스크 서비스 API | 1~24 | 계획 |
| 26 | 최종 프로젝트 ②: 배포·평가·회고 | 만든 Agent 를 남에게 넘기려면 무엇이 더 필요한가? | Docker · 평가 결과 · 설계 의사결정 기록(ADR) · README | Docker, ADR | 실행 환경 + 평가 리포트 | 25 | 계획 |
