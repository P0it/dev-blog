---
description: URL을 받아 POSTING.md 규약대로 글 초안을 작성하고 Supabase posts에 바로 적재 (워커 없이)
---

# /draft — URL → 글 초안 (직접 경로)

대상 URL / 메모: **$ARGUMENTS**

이 세션이 곧 작성자다. `ai_jobs` 큐·로컬 워커·`claude` CLI 를 거치지 않고,
아래 절차로 직접 초안을 써서 Supabase `posts` 에 `draft` 로 넣는다.

## 절차

1. **규약 숙지** — `POSTING.md` 를 읽는다. 특히 "2. 말투·본문 골격",
   "2-2. 시각자료 카탈로그", **"2-3. 자동화 티 방지"**, GitHub·발표영상 절. [[korean-writing-style]] 도 지킨다.
2. **직전 초안 점검** — `drafts/` 의 최근 파일 1~2개를 훑는다.
   직전 글의 길이·헤드라인 개수·도입 첫 문장 형태·`<mark>` 위치·시각자료 개수와 패턴 조합·저작권 줄 유무를 확인하고,
   이번 글에서는 그중 최소 2~3가지를 의도적으로 다르게 잡는다 (POSTING.md 2-3절 참조).
3. **원문 수집**
   - 일반 글/문서: `WebFetch`.
   - GitHub 저장소: `WebFetch` 로 저장소 페이지 + 필요하면 `raw.githubusercontent.com` README.
   - YouTube: `Bash` 로 `yt-dlp` 자막 추출. 2차 해설이 아니라 원작자 원본 기준.
     캡처를 넣을 거면 자막을 **타임스탬프 포함(VTT)** 으로 받는다.
     - **언어는 사용자가 알려줄 필요 없다 — 먼저 `--list-subs` 로 확인해 직접 정한다.**
       `--sub-langs` 미지정 시 yt-dlp 기본값이 `en` 이라, 한국어 영상에서도 없는 영어 자막을 뒤지며
       불필요한 요청이 늘고 **429(레이트 리밋)** 가 난다. 영상마다 언어가 다르므로(ko/en…) 박아두지 말 것.
       ```
       yt-dlp --list-subs --skip-download <url>     # 실제 존재하는 자막 언어 확인 (다운로드 아님)
       ```
       출력에서 **수동 자막(자동 생성 아님)이 있는 원본 언어 하나**를 골라 `--sub-langs` 에 넣는다.
     - **수동 자막을 먼저** 시도한다(`--write-subs`). list-subs 에 수동 자막이 없을 때만
       `--write-auto-subs` 를 붙여 자동 자막으로 폴백한다(이때 `--sub-langs` 는 영상 원본 언어로).
       자동 자막 엔드포인트가 가장 심하게 throttle 되므로 처음부터 둘 다 켜지 않는다.
     - throttle 완화로 `--sleep-requests 1 --sleep-subtitles 1` 을 붙인다.
       ```
       yt-dlp --write-subs --sub-langs <확인한_언어> --sub-format vtt --skip-download \
         --sleep-requests 1 --sleep-subtitles 1 -o '%(id)s' <url>
       ```
       그래도 429 면 `--cookies-from-browser chrome`(또는 safari) 를 추가해 인증 요청으로 보낸다.
     각 소제목이 대본의 어느 시점에서 나왔는지 알아 둔다.
4. **초안 작성** — POSTING.md 규약대로 한국어 글을 쓴다.
   - 본문은 `> 요약` → `## 헤드라인` 순서. 맨 위에 `# 제목` 다시 쓰지 않는다.
   - 정보 전달(원문 보존)·`-습니다`체·번역체 금지·두괄식. 대제목은 서술형 문어체.
   - 시각자료는 **기본 0개**. 본문 평문으로 구조·비율·흐름이 잡히지 않는 부분이 분명할 때만 ```visual 블록을 얹는다(0~3개).
     개념 그림은 ```illustration SVG 1개까지. 매번 같은 패턴 조합(`stat-card` + `compare-card` 등)·같은 위치 반복은 금한다.
     본문이 이미 말한 사실만 구조화한다.
   - 끝에 `## 참고 자료` + 원문 링크. 저작권 표기 한 줄은 **기본은 생략**(POSTING.md 2절 참조).
5. **문체 퇴고 — 번역투 제거 전용 패스 (필수).** 초안을 다 쓴 뒤, 사실·구조·링크는 그대로 두고
   **문장만** 처음부터 다시 읽으며 한국어 어순으로 고쳐 쓴다. 영어 은유 직역("~의 함수"·"~의 영토"),
   문두 부사+쉼표("역설적이게도,"), 쉼표 삽입절, 무생물 주어+타동사를 걷어낸다.
   판별법: 소리 내어 읽었을 때 한국 개발자가 옆 사람에게 하는 말로 자연스러운가.
6. **파일 작성** — `drafts/<slug>.md` 를 만든다(`drafts/` 는 .gitignore 됨).
   - **슬러그는 ASCII 영문만** — `a-z 0-9 -`. 한글·공백·기호 금지.
     (Vercel/Next 의 정적 prerender 가 비ASCII 슬러그에서 404 로 고정되는 이슈가 있어, 초안 단계부터 막는다.)
   - 다른 글 스타일(`gstack-garry-tan-claude-code`, `simon-sinek-start-with-why-golden-circle`,
     `project-glasswing-mythos`)을 따라 **인물명 + 핵심 키워드** 3~6단어로 짧게.
   - `npm run draft -- push` 가 비ASCII 슬러그를 거부한다 — frontmatter 의 `slug:` 를 반드시 명시.
   - 맨 위 프런트매터 + 그 아래 본문:
   ```
   ---
   title: 한국어 독자용 제목
   slug: ascii-only-slug      # 필수 — 영문 ASCII (위 규칙)
   tags: [태그A, 태그B]
   category: claude           # 선택 — tech/business/design/claude/infra/ai/insights 중
   source_url: <원문 URL>     # 기록용
   ---
   > 요약 인용구…
   ## 헤드라인…
   ```
7. **영상 캡처 — YouTube 글이면 기본 수행.** 각 `## 소제목`마다 대표 장면을 캡처해 넣는 것을 기본으로 한다(영상 글의 기본 시각자료). 일반 글·GitHub 글에는 해당 없음.
   - `drafts/<slug>.frames.json` 에 **소제목마다 한 줄씩** `[{"heading":"소제목","t":"3:21"}, ...]` 를 쓴다(t = 그 문단이 나온 대본 시점). 데모·시연처럼 화면이 풍부한 소제목은 시점 2개로 늘려도 된다.
   - `npm run capture -- candidates <video_url> drafts/<slug>.frames.json` — 시점마다 후보 프레임을 뽑는다.
   - 출력된 후보 이미지를 **Read 로 직접 보고** 소제목마다 가장 나은 컷 1장을 고른다.
     발표=슬라이드·자료 화면 우선, 데모=핵심 화면, 인터뷰=의미 있는 컷. 흐림·전환 중·눈 감음·빈 화면·발표자 어색한 표정은 배제.
     **쓸 만한 컷이 하나도 없는 소제목만 건너뛴다**(억지 그림 ✗). 나머지는 모두 넣는다.
   - 고른 컷마다 `npm run capture -- upload <고른_파일>` → public URL 을 받아, 본문의 해당 `## 소제목` 바로 아래에 `![설명](URL)` 로 넣는다.
   - 캡처는 영상 글의 기본 시각자료라 ` ```visual ` 카탈로그 카드의 "개수 변주"(POSTING.md 2-3절)와 별개로 본다 — 소제목마다 넣되, 구도가 매번 똑같이 굳지 않게 컷 종류(슬라이드·데모·인물 등)는 다양하게 고른다.
8. **적재** — `npm run draft -- push drafts/<slug>.md` 실행.
9. 출력된 `/admin/editor?slug=…` 경로를 사용자에게 알린다. 검토 후 에디터에서 발행한다.

형식·옵션 상세: `docs/draft-in-claude-code.md`.
