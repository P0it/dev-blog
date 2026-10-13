# 매일 아침 자동 학습 글 — Claude 클라우드 루틴 → GitHub Actions → Supabase

매일 07:00(KST) Claude 클라우드 루틴이 최근 AI·개발·디자인·CSM 소식을 조사하고, 그 소식을
이해하는 데 필요한 원리 하나를 골라 **`/study` 절차로 HTML 학습 페이지 글**을 만들어 커밋한다.
GitHub Actions 가 화면 점검(`check:page` — 가로 넘침·스크립트 오류, 라이트·다크)을 돌려
통과하면 **바로 발행**한다. 점검에 실패하거나 루틴이 `publish: true` 를 넣지 않았으면 `draft` 로 남는다.

### 2026-10-13 — 초안 → 바로 발행, 마크다운 의견 글 → `/study` 학습 페이지

현우가 매일 새 글을 바로 읽고 싶다고 해서 바꿨다. 그 전에는 `/research` 로 마크다운 원고를 쓰고
`draft` 까지만 적재했다("직접 써본 관점"을 검토 단계에서 얹는 전제). 학습 페이지는 개인 경험이 아니라
원리 설명이라 그 전제가 필요 없고, 대신 사람 검토가 빠진 자리를 이렇게 메운다:
- 확인 못 한 사실은 글에 넣지 않는다(이전엔 `⚠ 원문 미확인` 표시 후 검토자가 확인).
- humanize 를 못 돌렸으면 `publish: true` 를 넣지 않는다.
- Actions 가 발행 직전에 화면 점검을 다시 돌린다. 샌드박스에서 브라우저를 못 띄운 날도 같은 문턱을 지난다.

## 왜 이렇게 나눴나

클라우드 루틴은 Anthropic 샌드박스에서 돈다. 로컬 머신·`.env.local`·Mac mini 워커에
닿지 못하므로 `npm run draft -- push` 를 직접 돌릴 수 없다. 프롬프트에 Supabase 시크릿을
박아 넣는 건 평문 보관이라 배제했다.

그래서 **저장소를 큐로 쓴다.** 루틴은 원고를 커밋만 하고, 시크릿을 쥔 GitHub Actions 가
적재를 맡는다. 초안이 git 에 남아 되돌리기도 쉽다.

```
07:00 KST  Claude 클라우드 루틴 (리서치 → 원리 고르기 → /study 1~8)
   ↓ auto-drafts/ideas/<날짜>.md + auto-drafts/posts/<slug>.html 커밋·푸시
GitHub Actions  auto-draft-ingest.yml (push: auto-drafts/posts/**)
   ↓ publish: true 인 .html → npm run dev + check:page (라이트·다크)
   ↓ 통과: npm run draft -- push --publish   실패: npm run draft -- push (draft)
Supabase posts  status=published (published_at=지금)
   ↓ 공개 페이지 revalidate 60초
/posts/<slug>
```

## 이미지가 오는 길 (마크다운 원고 — 지금 루틴은 쓰지 않는다)

HTML 학습 페이지는 그림을 전부 인라인 SVG·Canvas 로 그려 이 경로를 타지 않는다.
손으로 커밋한 마크다운 원고나 `/research` 클라우드 실행에는 여전히 쓰인다.

**독자는 공식 문서·발표의 진짜 스크린샷과 다이어그램을 볼 때 글을 신뢰한다.** 반대로 매
글에 똑같은 톤의 SVG 도식이 네다섯 장 깔려 있으면 "AI 가 찍어낸 글"로 읽힌다. 초기 원고들이
정확히 그 상태였다(직접 SVG 4~5장, 실제 이미지 0장, `cover_image` 없음) — 프롬프트에
"한 편에 최소 4장" 같은 할당량이 박혀 있어, 샌드박스에서 이미지 URL 확인이 번거로우니
매번 SVG 로 도망간 것이다. **2026-09-13 에 그 할당량을 걷어냈다.**

지금 루틴은 `/research` 의 시각자료 방침을 따른다 — **실제 웹 이미지 우선(개수 제한 없음),
직접 그린 SVG 는 구조·흐름이 평문으로 안 잡히는 자리에만 0~2장, 카탈로그 카드는 원칙적으로
0개.** 그림은 할당량이 아니고, 소제목마다 하나씩 채우지 않는다.

클라우드 샌드박스는 Supabase 시크릿이 없고 egress 프록시가 도메인을 막아 이미지를
직접 재호스팅하지 못한다. 그래서 루틴은 원본 이미지 URL 을 마커로만 남긴다:

```markdown
![그림 설명](REHOST:https://원본/이미지.png)
```

프런트매터 `cover_image: REHOST:https://…` 도 같은 마커를 쓴다 — 카드·목록·OG 썸네일이
글 내용과 맞는 실제 이미지가 된다(실패하면 그 줄이 지워져 기본 썸네일로 떨어진다).

`npm run fetch:image -- --rewrite <file.md>` 가 이 마커를 실제 공개 URL 로 바꿔친다.
내려받기에 실패한 이미지는 **그 줄을 통째로 지운다** — 깨진 이미지가 남는 것보다 낫다.
Actions 가 치환된 원고를 `[skip ci]` 로 되돌려 커밋해 저장소 사본과 DB 를 맞춘다.

## 구성 요소

| 무엇 | 어디 |
|---|---|
| 루틴 프롬프트 원본 | `docs/auto-daily-draft.prompt.md` (2026-09-13 루틴에 동기화 완료) |
| 루틴 ID | `trig_016RkyDj189C3rDtW7JmArhJ` |
| 루틴 관리 | https://claude.ai/code/routines (`/schedule` 커맨드로도 수정) |
| 적재 워크플로 | `.github/workflows/auto-draft-ingest.yml` |
| 원고 도착지 | `auto-drafts/` (`/drafts/` 는 gitignore 라 못 쓴다) |
| 적재 스크립트 | `scripts/draft.mjs` (어드민 직접 경로와 동일) |

## 저장소 시크릿

- `SUPABASE_URL` — keepalive 워크플로와 공용(이미 있음)
- `SUPABASE_SECRET_KEY` — `sb_secret_…` 서버 전용 키. **새로 넣어야 한다.**
  Settings → Secrets and variables → Actions → New repository secret.

## 손으로 돌려보기

```bash
# 워크플로만 검증 (원고를 하나 직접 만들고)
gh workflow run auto-draft-ingest.yml -f file=auto-drafts/posts/<slug>.md
```

루틴 자체를 지금 한 번 돌려보려면 `/schedule` → "Run now".

## 지켜야 할 선

- **자동 발행은 `publish: true` + 화면 점검 통과일 때만.** `--publish` 는 이 워크플로만 붙인다.
  로컬 `/study` 가 커밋한 `.html` 은 `publish:` 줄이 없어 기존처럼 `draft` 로 들어간다.
- **확인 못 한 수치는 글에 넣지 않는다.** egress 프록시에 막혀 원문을 못 연 출처의 숫자는 뺀다.
- **루틴 프롬프트는 이제 저장소 파일만 고치면 된다.** 2026-09-13 부터 루틴에 등록된 건
  전체 프롬프트가 아니라 "`docs/auto-daily-draft.prompt.md` 를 읽고 그대로 수행하라"는
  다섯 줄짜리 부트스트랩이다. 그 파일이 유일한 정본이므로, 고치고 `main` 에 푸시하면
  다음 실행부터 반영된다. 루틴을 따로 건드릴 필요가 없다.
  - 그 전에는 10KB 프롬프트를 손으로 옮겨 심었는데, 옮길 때마다 글자가 깨졌다
    ("곧바로"→"곰바로", "썸네일"→"썹네일", "어미"→"끝릺음"). 부트스트랩은 그 경로를 없앤다.
  - 파일을 못 읽으면 루틴은 글을 쓰지 않고 그 사실만 보고하고 멈춘다 — 명세서 없이
    짐작해서 쓴 원고가 적재되는 것보다 낫다.
  - 루틴 자체의 설정(모델·저장소·도구·스케줄)을 바꿀 때만 `/schedule` 로 루틴을 연다.
- 커밋 메시지에 AI attribution 금지(`CLAUDE.md`). 루틴 프롬프트에도 그 조항이 들어 있다.
- **루틴은 `/study` 커맨드를 그대로 쓴다(2026-10-13 부터, 그 전엔 `/research`).** STEP 2 브리핑의 "설명할 원리"가 인자다. `.claude/commands/{draft,insight,research}.md`
  의 적재 단계가 `.env.local` 유무로 로컬/클라우드를 가른다 — 클라우드면 `auto-drafts/posts/` +
  `REHOST:` 마커 + 커밋. 그래서 규약·점검표는 커맨드 한 곳만 고치면 로컬 세션과 루틴이 같이
  바뀐다. 루틴 프롬프트(STEP 3)는 커맨드를 가리키고 샌드박스 특이사항(브라우저를 못 띄울 때, humanize 를 못 돌릴 때)만 적는다.
  같은 원리로 `/research`·`/draft` 도 루틴에서 부를 수 있다(영상 캡처만 로컬 전용).

## 루틴 프롬프트

`docs/auto-daily-draft.prompt.md` 에 원본을 둔다. 루틴에 넣은 것과 같은 내용이어야 한다.
