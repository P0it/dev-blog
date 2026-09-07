# 매일 아침 자동 초안 — Claude 클라우드 루틴 → GitHub Actions → Supabase

매일 07:00(KST) Claude 클라우드 루틴이 최근 AI·B2B·인디개발·국내 테크 소식을 조사해
아이디어 브리핑과 완성 원고 1편을 이 저장소에 커밋하고, GitHub Actions 가 그 원고를
Supabase `posts` 에 **`draft`** 로 적재한다. 발행은 사람이 어드민에서 한다.

## 왜 이렇게 나눴나

클라우드 루틴은 Anthropic 샌드박스에서 돈다. 로컬 머신·`.env.local`·Mac mini 워커에
닿지 못하므로 `npm run draft -- push` 를 직접 돌릴 수 없다. 프롬프트에 Supabase 시크릿을
박아 넣는 건 평문 보관이라 배제했다.

그래서 **저장소를 큐로 쓴다.** 루틴은 원고를 커밋만 하고, 시크릿을 쥔 GitHub Actions 가
적재를 맡는다. 초안이 git 에 남아 되돌리기도 쉽다.

```
07:00 KST  Claude 클라우드 루틴 (WebSearch 리서치 → 원고 작성)
   ↓ auto-drafts/ideas/<날짜>.md + auto-drafts/posts/<slug>.md 커밋·푸시
GitHub Actions  auto-draft-ingest.yml (push: auto-drafts/posts/**)
   ↓ npm run fetch:image -- --rewrite   (REHOST: 마커 → 자체 버킷 URL)
   ↓ 치환된 원고를 되돌려 커밋 [skip ci]
   ↓ npm run draft -- push
Supabase posts  status=draft
   ↓
/admin/editor?slug=…  ← 사람이 검토·보강·발행
```

## 이미지가 오는 길

**글에 그림이 없으면 읽히지 않는다.** 그런데 카탈로그 카드(```visual)를 매 글 깔면
자동생성 티가 난다. 그래서 루틴은 `/research` 의 시각자료 방침을 따른다 —
소제목마다 **공식 이미지 우선, 없으면 직접 그린 SVG(```illustration), 카드는 최대 1개**.

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
| 루틴 프롬프트 원본 | 이 문서 아래 "루틴 프롬프트" 절 |
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

- **자동 발행 금지.** 적재는 `draft` 까지. `POSTING.md` 가 요구하는 "직접 써본 관점"은
  클라우드 세션이 알 수 없으므로, 검토 단계에서 현우의 경험을 얹는 걸 전제로 한다.
- **수치는 발행 전에 확인한다.** egress 프록시에 막혀 WebFetch 로 원문을 못 연 출처는
  루틴이 브리핑에 `⚠ 원문 미확인` 으로 표시한다. 그 숫자는 검색 스니펫에서 온 것이다.
- 루틴 프롬프트를 고칠 때는 **이 문서와 실제 루틴을 함께** 고친다. 루틴은 저장소 밖에
  살기 때문에, 문서만 고치면 다음에 읽는 쪽이 옛 프롬프트로 되돌린다.
- 커밋 메시지에 AI attribution 금지(`CLAUDE.md`). 루틴 프롬프트에도 그 조항이 들어 있다.

## 루틴 프롬프트

`docs/auto-daily-draft.prompt.md` 에 원본을 둔다. 루틴에 넣은 것과 같은 내용이어야 한다.
