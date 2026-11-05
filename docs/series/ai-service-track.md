# AI Service Track 시리즈 계획

사용자가 듣는 강의 진도에 맞춰 편을 늘린다. `/study docs/series/ai-service-track.md N편` 으로 한 편씩 만들고,
편을 만들 때마다 상태 칸을 고친다. 이 문서가 시리즈의 원본이다.

- **series 슬러그:** `ai-service-track`. frontmatter 에 `series: ai-service-track`, `series_order: N`. `/admin/series` 에 행이 있어야 한다.
- **독자:** LLM 을 서비스에 붙여 보려는 입문 개발자. Python 은 읽지만 LLM 용어는 모른다. 설명은 `POSTING.md` 5-0 중학생 눈높이,
  코드는 5-7 코드 해부를 따른다.
- **공통 예제:** 배달 앱 리뷰 분류(긍정·부정·섞임). 편마다 같은 예제를 키운다.
- **코드:** `openai` 파이썬 SDK. 쓰기 직전에 PyPI 버전과 공식 문서의 모델 ID 를 다시 확인한다(2026-10-14 기준 3.31.0, 예시 모델 `gpt-5.5`).
  scratchpad 모의 서버로 호출 형태를 확인하고, 페이지는 실제 API 를 부르지 않는다.
- **AI Agent 시리즈와의 경계:** `ai-agent` 1편이 "LLM 한 번 호출·messages·API 는 대화를 기억하지 못함"을 다룬다.
  이 시리즈는 그 내용을 다시 풀지 않고 링크로 잇는다.

## 편 목록

상태: `계획` → `초안`(적재됨) → `발행`.

| # | 제목 | 이 편의 한 질문 | 소주제 | 처음 나오는 용어 | 코드 결과물 | 상태 |
|---|---|---|---|---|---|---|
| 1 | 프롬프트에 예시를 넣으면 LLM은 뭘 배울까요? (`prompt-engineering-roles-few-shot`) | 같은 모델인데 왜 묻는 방식에 따라 답이 달라지나? | 이어 쓰기 원리 · response 구조와 finish_reason · 역할(developer·user·assistant)과 우선순위 · 제로샷·원샷·퓨샷 · 예시의 형식·순서 효과 · 예시 넣는 두 방법(태그·멀티턴) · Responses API·추론 모델 | 프롬프트, 토큰, role, finish_reason, usage, 추론 모델, in-context learning, 제로샷·원샷·퓨샷 | 리뷰 분류 호출, 퓨샷 두 방식, Responses 호출 | 초안 |
| 2 | 챗봇은 내 이름을 어떻게 기억할까요? API 안에서 벌어지는 일 (`multi-turn-chat-conversation-state`) | API 는 대화를 기억하지 못하는데 챗봇은 어떻게 앞 대화를 이어 가나? | 기억 못 하는 호출 · 대화 기록을 들고 매번 통째로 다시 보내기(`input` + `response.output` 이어 붙이기) · 턴이 늘수록 불어나는 입력 토큰 · 컨텍스트 창이 차면(`truncation`·압축) · 서버에 맡기는 두 방법(`previous_response_id`·Conversations API)과 과금·저장 기간 · 옛 `chat.completions` 코드 대응표 | 멀티턴(multi-turn), 턴, 상태(state), 컨텍스트 창(context window), previous_response_id, Conversations API, store, truncation | 기억 못 하는 호출 → 직접 이어 붙이는 챗봇 루프 → previous_response_id 판 → Conversations 판 | 계획 |
| 3 | 논문 요약 AI가 쪽 번호부터 지우는 이유 (`pdf-summary-pymupdf-header-footer`) | PDF 를 AI 에게 요약시키면 화면 뒤에서 무엇을 먼저 해야 하나? | PDF 는 좌표에 찍힌 글자 · 그대로 꺼내면 머리말·쪽 번호가 끼어듦 · 2단 읽기 순서(`sort=True`) · `clip` 고정 높이의 한계 · PyMuPDF 2.0 레이아웃 분석(`to_markdown(header=False, footer=False)`) · 요약 칸을 스키마로(`responses.parse`·`text_format`) · PDF 파일째 넣기(`input_file`, 글+쪽 사진) · 긴 문서 map-reduce·Lost in the Middle | 좌표, 머리말·꼬리말, 2단 편집, OCR, 레이아웃 분석, 마크다운, 스키마, 환각, Structured Outputs, base64, 컨텍스트 창, map-reduce | 그대로 꺼내기 → clip → to_markdown → 요약기(Structured Outputs) → PDF 직접 입력. PyMuPDF 2.0·openai 3.41·`gpt-6.1-sol`(2026-10-30 확인) | 초안 |
| 6 | 사진 설명은 잘하는 AI가 그래프 숫자를 틀리는 이유 (`gpt-vision-image-quiz-tts`) | 사진은 어떤 모양으로 모델에 들어가고, 왜 숫자를 틀리나? 사진 한 장을 어떻게 듣기 문제로 만드나? | 32픽셀 칸과 토큰 계산 · `detail`(low·high·original, 안 적으면 원본, 3만 칸 넘으면 거절) · 값 하나를 읽는 세 관문과 모델이 약한 곳 · 잘라 보내기 · base64·data URL·file_id · 여러 장 이름표 · Structured Outputs 퀴즈 · 대본과 샘플 · TTS 종료(2027-01-06)와 Realtime | 픽셀, 패치, 토큰, ViT, base64, 스키마, TTS, 샘플, WebSocket | describe → compare → quiz(`responses.parse`) → to_script → Realtime wav / Speech API. openai 3.46·`gpt-5.6-luna`·`gpt-realtime-2.1-mini`(2026-11-05 확인) | 로컬 초안(Supabase 제한으로 미적재) |
| 7 | 챗봇은 오늘 주가를 어디서 보고 말할까요? (`stock-chatbot-function-calling-streaming`) | 학습이 끝난 모델이 오늘 주가를 어떻게 말하나? | 학습 종료 시점 · Function Calling 왕복(호출 두 번, `input` 목록) · 도구 설명서(`strict`·`enum`) · 병렬 호출과 `call_id` · yfinance `.info` 필드 고르기 · `tail(10)` 함정과 요약 반환 · 애널리스트 의견 · 스트리밍 이벤트·인자 조각 · Streamlit `write_stream`·`status` · 환각·벤치마크·프롬프트 인젝션 · 내 함수·`web_search`·MCP · 데이터 라이선스 | Function Calling, tools, strict, function_call, call_id, 병렬 호출, 티커, 필드, 종가, 목표 주가, 스트리밍, SSE, MCP | 주식 도구 네 개 → while 루프 → 스트림 루프 → Streamlit 앱. `openai` 3.46·`yfinance` 1.8·`streamlit` 1.66·`gpt-6.1-sol`(2026-11-05 확인) | 초안(미적재) |
| 8 | 같은 AI인데 왜 내 답만 쓸모없을까요? (`prompt-structure-hallucination-clean-data`) | 같은 모델인데 왜 답의 품질이 사람마다 다른가? | 요청서 다섯 칸(Persona·Context·Task·Constraint·Output) · 페르소나의 한계 · 템플릿과 프롬프트 캐싱 · 할루시네이션(채점표·거절 회로·겹겹 방어·길이 지시·CoVe) · 목적별 정제·유니코드 정규화·토큰화·한국어 형태소 검색·분야별 규칙 · 점수판·Instruction 데이터·JSONL·채점 코드·서비스 종료 일정 | 페르소나, 템플릿, 프롬프트 캐싱, 할루시네이션, RAG, 정제, 불용어, 정규화, 토큰화, 형태소, 청크, 평가, 회귀, 파인튜닝, JSONL | 템플릿 호출 → CoVe 검증 → 정제·검색 토큰 → JSONL 만들기 → 채점. openai 3.46·`gpt-6.1-sol`·tiktoken 0.14·kiwipiepy 0.24.1(2026-11-05 확인) | 초안(미적재, Supabase 일시 중지) |
