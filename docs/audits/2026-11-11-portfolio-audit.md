# 포트폴리오 공개 전 전수 검사 (2026-11-11)

발행글 86편(마크다운 27 · HTML 페이지 59)을 문체·제목·요약·메타·사실·화면 기준으로 봤다. 초안 31편은 범위 밖.
작업 전 DB 백업: `backups/2026-11-11.json`. 반영은 바꾼 칸만 update 했고, 받아 둔 뒤 에디터에서 바뀐 글은 건너뛰게 했다.

## 문체

POSTING 2-4 의 grep 신호(`~죠`·연결어미 쉼표·대시 헤드라인 등)를 한글 1,000자당 밀도로 매겼다.

- **마크다운 26편** — 점수 10~38. 2026-10-12 `/humanize` 규칙 전에 쓴 글이라 윤문을 거치지 않았다(`~죠` 최대 23회).
  22편은 standard(진단 → 윤문), 4편은 light 로 돌렸다. 후처리(서법 복원·주입 쉼표 제거·구조 게이트)와
  원문 대조(코드펜스·이미지·링크·소제목·숫자 수 일치)를 거쳐 반영. 본문 `~죠` 0개.
  paseo-vs-orca(점수 1.8)는 이미 깨끗해서 두었다.
- **페이지 59편** — 점수 4.4 이하, 만들 때 윤문을 거쳤다. 남은 연결어미 쉼표를 기계로 지워 보니
  "왼쪽은 ~했고, 오른쪽은 ~했습니다" 같은 대구 쉼표까지 빠져 오히려 나빠져서 **본문은 손대지 않았다.**
- AI Agent 시리즈 10편의 카드 요약이 "~고 ~고 ~고" 한 문장이라 끊어 다시 썼다(DB·원고 프런트매터 둘 다).
- 시리즈 설명 3개 다시 씀(가운뎃점 11개 나열, "강의 진도를 따라" 언급 제거).

## 제목

앞뒤 공백·끝 마침표·띄어쓰기를 고치고, 밋밋하거나 사실과 어긋난 제목 10개를 바꿨다.
오토파지 · 지적 관광객(advait) · 루트릭스 · Fable 필드 가이드 · iOS 26 · Claude Code 동작 원리(cc-leak) ·
개발자에게 남는 일(harness-next) · SaaS 직접 만들기 · gstack · AI 에이전트 18개와 한 달(openclaw).

## 메타

- 썸네일 빈칸 3편 채움(content-addressing 은 `npm run thumb`, 마크다운 2편은 본문 첫 이미지).
- **요약 추출 버그** — `stripInline` 이 인라인 코드를 글자째 지워 Glasswing 요약이 "프론티어 모델 로" 가 됐다.
  백틱만 벗기게 고침(`src/lib/markdown.ts`, `scripts/draft.mjs`).
- **발행 안 된 글로 가는 내부 링크 11곳 → 해결(2026-11-14 발행)** — 대상 4편이 초안이었다(시리즈 없는 단독 학습 글, `/study` 견본):
  `rag-retrieval-pipeline`, `self-attention-qkv`, `llm-temperature-sampling`, `utf8-encoding-mojibake`.
  링크가 있는 글: rag-embedding-vector-db, llm-parameters-7b-explained, transformer-attention-how-llm-reads,
  fine-tuning-lora-qlora-peft, prefill-decode-kv-cache, prompt-structure-hallucination-clean-data.

## 사실

마크다운 26편을 원문(영상 자막·공식 문서·GitHub API)과 대조했다. 확신 높음·중간 항목만 고쳤다.
보고서: `drafts/_audit/factcheck/report-1~5.md`(로컬, gitignore).

- 원문과 다르게 옮김: Opus 4 출시 연도(2025), Lauren Reeder, Steve Yegge, OpenClaw·microGPT, Roblox, Erewhon,
  Her 를 본 시기, PillPack 인수가(약 7.5억 달러), Best Buy "한 분기", AI Ascent 행사일(4/20), `/autoplan`.
- 사실 자체가 틀림: cc-leak 의 "유출 직후 문서 공개" 전제(문서는 2026-01 부터 있었다), 하버드 조경 과정 기원,
  온톨로지·버너스리 연대, 유롤리틴 A 연구 대상, 라파마이신 9~14% 의 기준, 스택오버플로 84% 의 뜻.
- 시간이 지나 틀려진 문장: Fable 5 "현재 중단"(7/1 복구), Glasswing 프로그램 개편, graphify 라이선스·저장소 이전,
  Remote Control 문서 변경(Ultraplan 삭제 등), Claude Code 권한 모드 이름, GitHub 별 수.
  → POSTING 2-4 점검표에 20번(기준일 붙이기) 추가.

## 화면

- **모바일 홈 가로 넘침** — 390px 에서 문서 폭 951px. `.post-card` 의 `1fr` 이 내용 최소폭 아래로 안 줄었고,
  홈 `PostCard` 의 태그 줄에만 `flexWrap` 이 빠져 있었다. 고친 뒤 홈·목록·시리즈·/lab·/algo·태그·글 상세 모두 390px 안.
