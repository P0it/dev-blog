# auto-drafts — 클라우드 루틴이 쓴 원고가 도착하는 곳

Claude 클라우드 루틴(매일 07:00 KST)이 리서치한 결과를 여기에 커밋한다.
`/drafts/` 는 `.gitignore` 대상이라 클라우드에서 커밋할 수 없어, 추적되는 이 폴더를 쓴다.

| 경로 | 무엇 | 그다음 |
|---|---|---|
| `ideas/YYYY-MM-DD.md` | 그날의 아이디어 브리핑(제목 후보·앵글·아웃라인·출처) | 사람이 읽는다. 자동 적재 없음 |
| `posts/<slug>.md` | 브리핑 중 1편을 `INSIGHT.md` 규약대로 완성한 원고 | `.github/workflows/auto-draft-ingest.yml` 이 `npm run draft -- push` 로 Supabase `posts` 에 **`draft`** 로 적재 |

**자동 발행은 하지 않는다.** 적재는 `draft` 까지고, 발행 버튼은 `/admin/editor?slug=…` 에서 사람이 누른다.
클라우드 세션은 현우가 무엇을 만들어봤는지 모르므로, 규약이 요구하는 "직접 써본 관점"은
검토 단계에서 채워 넣는 것을 전제로 한다.

루틴 설정 상세: `docs/auto-daily-draft.md`
