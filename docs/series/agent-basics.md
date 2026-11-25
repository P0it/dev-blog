| 초안 || 초안 || 초안 || 초안 || 5 | LLM의 답을 프로그램이 그대로 믿고 써도 될까요? (`llm-structured-output-schema-validation`) || 4 | Agent는 언제 멈추고 한 번 일하는 데 얼마나 들까요? (`agent-loop-stop-reason-cost-caching`) || 3 | LLM은 어떤 도구를 쓸지 무엇을 보고 고를까요? (`tool-description-json-schema-design`) || 2 | ChatGPT는 방금 한 말을 어떻게 기억할까요? (`llm-api-messages-tokens-stateless`) || 1 | 말만 하는 AI는 어떻게 떡볶이를 주문할까요? (`llm-tool-agent-first-step`) |# AI Agent, 기초부터 하나씩 — 시리즈 계획

LLM·Agent·RAG 를 처음 접하는 사람이 개발자로서 직접 짤 수 있는 데까지 가는 입문 트랙이다. 사용자가 2026-11-24 에
"기존 시리즈는 잘 안 읽힌다"고 해서 시안을 만들었고,
2026-11-25 에 기존 26편(`ai-agent`)을 고치지 않고 **새 트랙으로** 쓰기로 했다. 이 문서가 시리즈의 원본이다. 편을 만들 때마다 상태 칸을 고친다.

- **series 슬러그:** `agent-basics`. frontmatter 에 `series: agent-basics`, `series_order: N`.
  `/admin/series` 의 행은 1편을 적재할 때 만든다(빈 시리즈가 목록에 먼저 뜨지 않게).
- **독자:** 예상 독자는 개발자지만 LLM 용어는 처음이다. 도입과 흐름은 처음 접하는 사람 눈높이로, 본문은 개발자가 실제로 쓸 핵심까지(`POSTING.md` 5-0, 2026-11-24).
- **기존 `ai-agent` 시리즈와의 관계:** 주제가 겹치는 편은 끝에 "더 깊이 보기"로 그 편을 잇는다. 기존 글은 고치지 않는다.
- **근거:** 공식 문서·스펙·원저자 글(`ai-agent.md` 의 근거 우선순위와 같다). 편마다 쓰기 직전에 버전·필드 이름·권장 방식을 공식 문서로 다시 확인한다.
- **provider 균형:** 예시와 코드는 Claude 와 OpenAI 를 섞는다. 필드 이름이 다르면 둘 다 적는다(`stop_reason` / `finish_reason`).

## 형식 — 시안에서 정한 것

| 사용자 지적 (2026-11-24) | 반영 |
|---|---|
| 좌우에 다른 요소가 있어 시선이 번갈아 간다 | **한 열(680px), 모든 블록이 같은 왼쪽 선.** 위에서 아래로만 읽는다 |
| 개념을 모르니 그림도 안 들어온다 | **같은 그림 하나를 시리즈 끝까지 키운다.** 세로 줄 세 개(나 · 프로그램 · LLM)와 그 사이를 오가는 칸. 편마다 새 칸 하나만 "새로 등장"으로 얹는다 |
| 흐름은 좋아졌지만 교재 같다 | 안내 줄(먼저 알아야 할 것·새 낱말 N개·읽는 시간)·요약 상자·용어 카드·퀴즈를 넣지 않는다(`POSTING.md` 5-0) |
| 방 안·방 밖, 도우미 같은 지어낸 이름이 별로다 | 일상 예시(떡볶이 주문)는 쓰되 등장하는 것은 처음부터 실제 용어로 부른다(LLM · 프로그램 · 도구 · Agent) |
| Agent 안에도 LLM 이 있지 않나 | 가운데 줄은 "프로그램(개발자가 짠 코드)", 프로그램 + LLM + 도구를 감싼 옅은 초록 바탕이 Agent. 판단은 LLM, 실행은 코드 |
| 너무 짧고 추상 개념에서 겉돈다 | 쉬운 도입 뒤에 실제 형식·분기 값·실패·비용·보안을 같은 그림 위에 얹는다. 편 끝 무렵에 그림의 칸이 코드의 어느 줄인지 잇는 짧은 코드 한 블록 |
| (2026-11-24) 그림에 빌드업이 없다 — 3칸을 묶어 보내는 그림이 처음부터 나온다 | 한 번(1칸)을 먼저 그리고, 다음 그림에서 같은 장면에 한 가지만 더해 묶음으로 보인다(`POSTING.md` 5-6 "빌드업"). 2편 첫 섹션이 견본 |
| (2026-11-25) "바퀴가 아니라 반복 아닌가?" | Agent 반복문의 한 회차는 "반복"으로 쓴다(첫 번째 반복, 반복할 때마다, 반복 횟수 한도). "바퀴"는 쓰지 않는다 |
| (2026-11-25) 형광펜 안에 코드 칩이 겹쳐 보인다 | 형광펜(`mark`) 안에 `code` 를 넣지 않는다. 코드 낱말은 형광펜 밖에 두고 뒤의 사실 구절만 칠한다 |
| (2026-11-25) 세로 줄 그림(`.sq`)의 간격이 좁아 빡빡하다 | 칸 사이 30px(모바일 22px), 이름표 아래 18px, 글 칸 안쪽 여백 10×14px, 글 칸과 화살표 사이 10px, 반복 상자 위아래 36·22px, 그림 위아래 8·48px |
| 부자연스러운 문장 | `POSTING.md` 2-4 점검표 21~24 와 `npm run lint:draft` |
| 강조 | 굵게 = 용어 첫 등장, 민트(`strong.hl`) = 섹션 결론 한 문장, 노란 형광펜(`mark`) = 놓치기 쉬운 사실 구절(`POSTING.md` 2-1 필기 문법) |

### 코드 ↔ 설명 색표 (2026-11-24 사용자 지시 — 시리즈 전체에 적용)

예시 코드·JSON 의 키와 값, 그림의 이름표, 아래 설명 칩에서 같은 낱말은 같은 색이다(`POSTING.md` 2-1). 아래 낱말은 **모든 편에서** 이 색으로 고정한다.
새 편에서 처음 나오는 낱말은 남는 색을 골라 그 편 안에서만 짝을 맞추고, 시리즈 전체에 다시 나올 낱말이면 이 표에 더한다.

| 색 | 클래스 | 시리즈 고정 낱말 | 편마다 쓴 낱말 |
|---|---|---|---|
| 파랑 | `ck-blue` | `user` | 1편 `name` · 3편 `type` · 4편 `usage` · 5편 `model_json_schema` |
| 초록 | `ck-green` | `assistant` | 3편 `enum` · 5편 `Literal`·`enum` |
| 보라 | `ck-violet` | `system` · `developer` · `description` | 1편 `input` · 5편 `Field` |
| 주황 | `ck-orange` | `max_tokens` · `required` | |
| 분홍 | `ck-pink` | `messages` | 1편 `input_schema` · 3편 `properties` · 4편 `cache_control` · 5편 `model_validate_json` |
| 청록 | `ck-cyan` | `stop_reason` · `finish_reason` | |
| 갈색 | `ck-brown` | `tool_use` · `tool_calls` · `tool_use_id` · `toolu_…` | 2편 `input_tokens` · 3·5편 `additionalProperties` · 5편 `extra="forbid"` |
| 빨강 | `ck-red` | `is_error` | 2편 `output_tokens` |
| 올리브 | `ck-olive` | `end_turn` | 3편 `strict` · 5편 `output_config`·`format`·`response_format` |

쓰는 법: 설명 칩은 `<code class="ck ck-cyan">stop_reason</code>`, 코드 카드 안은 `<span class="ck ck-cyan">"stop_reason"</span>`, 그림 이름표는 `<b class="ck-t ck-blue">user</b>`.
`<pre>` 코드 블록은 서버가 Shiki 로 칠하므로 색을 넣지 않는다 — 대신 블록 아래 해설 목록의 칩에 색을 준다.

섹션 골격: 작은 회색 질문(`h2`) → 큰 답 한 줄 → 그림 → 짧은 문단. 섹션 첫 문장이 답이다.
그림 문법·CSS 는 1편 원고(`auto-drafts/posts/llm-tool-agent-first-step.html`)의 `.sq`(세로 줄 그림), `.tl`(도구 카드), `.rs`(응답 모양), `.pb`(토큰 후보 막대)를 가져다 쓴다.
`POSTING.md` 5-2 의 "가운데 한 열 섹션은 절반 이하"는 이 트랙에 적용하지 않는다. `check:page` 가 프런트매터 `series: agent-basics` 를 보고 그 검사를 건너뛴다(`ONE_COLUMN_SERIES`). 다른 글에 한 열을 넓힐지는 사용자가 정한다(2026-11-25 미정).
파일: 원고는 `auto-drafts/posts/<slug>.html`. 2~5편도 1편의 `<style>` 을 그대로 쓴다 — 고치면 다섯 편을 함께 고친다.

## 편 목록

상태: `계획` → `초안`(적재됨) → `발행`.

### Part 1. LLM 과 Agent 의 뼈대

| # | 이 편의 질문 | 그림에 얹는 칸 | 개발자 핵심 | 이어 볼 `ai-agent` 편 | 상태 |
|---|---|---|---|---|---|
| 1 | 말만 하는 AI는 어떻게 떡볶이를 주문할까요? (`llm-tool-agent-first-step`) | 프로그램 · 도구 · Agent 바탕 | 토큰과 확률, Tool Calling, 도구 목록(이름·설명·입력 형식), `stop_reason` 값, 병렬 호출과 id, `is_error`, `tool_choice`, 반복문 40줄, prompt injection, server/client tool, 워크플로와 비교 | 1·2·3 | 발행 |
| 2 | ChatGPT는 방금 한 말을 어떻게 기억할까요? (`llm-api-messages-tokens-stateless`) | 메시지 목록 | `messages`·role·system, 토큰과 요금, `max_tokens`, 대화를 기억 못 하는 이유(stateless), 스트리밍 | 1·4 | 발행 |
| 3 | LLM은 어떤 도구를 쓸지 무엇을 보고 고를까요? (`tool-description-json-schema-design`) | 도구 목록 카드 | JSON Schema, 설명 쓰는 법, 반환 크기, 오류 메시지, 사용자 정보 넘기기 | 6 | 발행 |
| 4 | Agent는 언제 멈추고 한 번 일하는 데 얼마나 들까요? (`agent-loop-stop-reason-cost-caching`) | 반복 상자 | 멈춤 신호 전부, 반복 횟수 한도, 비용 누적 계산, prompt caching | 3 | 발행 |
| 5 | LLM의 답을 프로그램이 그대로 믿고 써도 될까요? (`llm-structured-output-schema-validation`) | 응답 형식 | Pydantic·JSON 스키마, 도구 강제와 structured output, 검증 실패 재시도 | 5 | 발행 |

### Part 2. 기억과 지식

| # | 이 편의 질문 | 그림에 얹는 칸 | 개발자 핵심 | 이어 볼 편 | 상태 |
|---|---|---|---|---|---|
| 6 | 대화가 길어지면 Agent는 무엇을 버려야 할까요? (`agent-context-window-memory-summarize`) | 대화 기록 | context window, 요약·잘라내기, 장기 기억 저장소, context engineering | 9 | 발행 |
| 7 | LLM은 우리 회사 규정을 어떻게 알고 답할까요? (`rag-chunk-embedding-vector-db-basics`) | 검색 저장소 | 임베딩, 벡터 DB, 청킹, 검색 결과를 넣는 자리 | 10 | 발행 |
| 8 | 검색을 LLM에게 맡기면 무엇이 달라질까요? (`agentic-rag-search-tool-basics`) | 검색 도구 | Agentic RAG, 다시 검색하기, 출처 표시 | 10 | 발행 |

### Part 3. 프레임워크로 옮기기

| # | 이 편의 질문 | 그림에 얹는 칸 | 개발자 핵심 | 이어 볼 편 | 상태 |
|---|---|---|---|---|---|
| 9 | 직접 짠 Agent 반복문은 LangChain 어디에 들어 있을까요? (`langchain-create-agent-vs-hand-loop`) | 프로그램 → 프레임워크 | `create_agent`, middleware, `init_chat_model` 로 provider 교체 | 4·7·8 | 발행 |
| 10 | Agent의 흐름을 내가 직접 정하고 싶으면 어떻게 할까요? (`langgraph-state-node-edge-basics`) | 그래프 | LangGraph 상태·노드·엣지, 조건 분기, checkpointer | 11·12 | 발행 |
| 11 | Agent가 결제하기 전에 사람이 확인하게 하려면 어떻게 할까요? (`agent-human-approval-interrupt`) | 승인 칸 | interrupt·재개, 승인 기록 | 15 | 발행 |

### Part 4. 바깥 세상과 연결

| # | 이 편의 질문 | 그림에 얹는 칸 | 개발자 핵심 | 이어 볼 편 | 상태 |
|---|---|---|---|---|---|
| 12 | 같은 도구를 Agent마다 다시 연결해야 할까요? (`mcp-host-client-server-basics`) | 프로그램 ↔ 도구 사이 | MCP Host·Client·Server, stdio·HTTP, Tools·Resources·Prompts | 20 | 발행 |
| 13 | 우리 회사 시스템을 MCP 서버로 열려면 무엇을 해야 할까요? (`mcp-server-python-sdk-auth-basics`) | MCP 서버 | FastMCP, Inspector 테스트, 인증·권한 | 21·22 | 발행 |

### Part 5. 여러 Agent 와 운영

| # | 이 편의 질문 | 그림에 얹는 칸 | 개발자 핵심 | 이어 볼 편 | 상태 |
|---|---|---|---|---|---|
| 14 | Agent를 하나 더 두면 나아지나요? | 여러 프로그램 | 워크플로 vs Agent, 공식 패턴 다섯 가지, 비용·지연 | 13·14·17·18 | 계획 |
| 15 | Agent가 잘하는지 어떻게 숫자로 보나요? | 기록(trace) | 추적, 궤적 평가, LLM-as-judge | 23 | 계획 |
| 16 | 문서 한 장이 Agent를 조종할 수 있나요? | 위험 표시 | prompt injection, lethal trifecta, 최소 권한·샌드박스 | 24 | 계획 |
| 17 | 서비스로 내보내려면 무엇이 더 필요한가요? | 사용자 앞단 | FastAPI 스트리밍, 배포, 평가 리포트 | 25·26 | 계획 |

## 편을 만들 때

1. 이 표에서 그 편의 질문·얹는 칸·핵심을 확인하고, 앞 편까지 그림에 무엇이 있었는지 본다.
2. 공식 문서로 필드 이름·버전·권장 방식을 다시 확인한다.
3. `/study` 절차로 쓰되 형식은 위 "형식" 표를 따른다. 1편이 견본이다.
4. 윤문(`POSTING.md` 2-4), `npm run check:page`, 적재 후 이 표의 상태를 고친다.
