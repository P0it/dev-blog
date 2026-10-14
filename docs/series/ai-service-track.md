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
