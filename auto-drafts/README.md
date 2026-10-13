# auto-drafts — 클라우드 루틴이 쓴 원고가 도착하는 곳

Claude 클라우드 루틴(매일 07:00 KST)이 리서치한 결과를 여기에 커밋한다.
`/drafts/` 는 `.gitignore` 대상이라 클라우드에서 커밋할 수 없어, 추적되는 이 폴더를 쓴다.

| 경로 | 무엇 | 그다음 |
|---|---|---|
| `ideas/YYYY-MM-DD.md` | 그날의 아이디어 브리핑(제목 후보·앵글·아웃라인·출처) | 사람이 읽는다. 자동 적재 없음 |
| `posts/<slug>.html` | 브리핑 중 1편을 `/study` 절차로 만든 HTML 학습 페이지 글 (2026-10-13 부터) | `.github/workflows/auto-draft-ingest.yml` 이 화면 점검 후 **바로 발행** |
| `posts/<slug>.md` | 그 전의 마크다운 원고, 손으로 넣은 원고 | 같은 워크플로가 **`draft`** 로 적재 |

**발행은 프런트매터 `publish: true` 가 있고 화면 점검(가로 넘침·스크립트 오류)을 통과한 `.html` 만 한다.**
그 밖의 원고는 `draft` 로 들어가고 발행 버튼은 `/admin/editor?slug=…` 에서 사람이 누른다.
같은 폴더의 견본·로컬 `/study` 원고는 `publish:` 줄이 없어 자동 발행되지 않는다.

루틴 설정 상세: `docs/auto-daily-draft.md`
