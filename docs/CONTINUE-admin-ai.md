# 이어서 할 일 — 어드민 서버화 + 로컬 AI 워커

> 세션이 사라져도 이 문서만 보면 재개 가능. 작성 시점 기준 정확한 상태를 적었다.

## 한 줄 요약 / 목표

어드민을 Vercel에 배포해 어디서든 글 작성, AI(URL→초안 / 개선)는 **로컬 Mac mini 워커**가
Supabase `ai_jobs` 큐를 폴링해 `claude` CLI로 처리. 표면 요청은 "어드민 6페이지"였으나
진짜 목표는 "어드민 서버화 + AI 디커플링". 상세 설계: `C:\Users\Snet\.claude\plans\magical-sleeping-frost.md`

## 현재 상태 (정확히)

- **푸시 완료 커밋**: `5742f48 어드민 서버화 + 로컬 AI 워커`, `c97c716 브랜드명 hyun → hynu`.
  워커 수정(`bypassPermissions`,`shell:true`)도 `5742f48`에 포함.
- **미커밋 (피드백 작업분 — 전부 완료, 빌드 OK·lint 클린·로컬 스모크 200)**:
  - `src/app/admin/posts/actions.ts` — `requestDraftIntoPost` 추가
  - `src/components/admin/AiModals.tsx` — 신규 공유 모달(닫기/Esc/스크림 시 입력 있으면 확인)
  - `src/components/admin/PostsList.tsx` — 공유 모달로 리팩터
  - `src/components/admin/DraftQuickCard.tsx` — 신규(대시보드 카드 → 모달)
  - `src/app/admin/page.tsx` — 첫 빠른액션 카드를 DraftQuickCard로, 죽은 `?ai=1` 토パ바 버튼 제거
  - `src/components/admin/PostEditor.tsx` — AI 버튼(기존 글: AI개선+URL채우기 / 새 글: URL로 초안)
    + 미저장 beforeunload 가드(편집 dirty 시 새로고침·탭닫기·뒤로 이탈 경고)
- **빌드/lint/스모크**: `npm run build` 성공, `npm run lint` 클린, dev에서
  /admin·/admin/posts·/admin/editor·/admin/categories 전부 200.
- **정리 필요한 잡파일(미추적, 커밋 금지)**: `scripts/_tmp-parse-subs.mjs`,
  `scripts/_tmp-query.mjs`, `.ai-resume/`, `.claude/`, `docs/CONTINUE-admin-ai.md`(이 문서 자체 — 커밋 여부는 선택).

## 검증된 사실 (다시 안 해도 됨)

- 0007 마이그레이션 **사용자가 Supabase에 적용 완료**. Vercel env(`SUPABASE_*`,
  `ADMIN_PASSWORD` 등) **적용 완료**.
- AI 파이프라인 **엔드투엔드 실검증 성공**(이 Windows PC를 워커로): 시드 job →
  `npm run ai:worker` → `claude -p --permission-mode bypassPermissions`(shell:true) →
  WebFetch로 글 읽고 POSTING.md 규약대로 한국어 초안 생성 → `posts.body_md` 반영 →
  job done(~60초). 테스트 데이터는 정리 완료(라이브 DB 흔적 없음).
- 어드민 9개 라우트 빌드·렌더 200 확인(로컬). `ai_jobs` 없을 때도 페이지 방어 처리됨.
- `ADMIN_PASSWORD = admin1313` (Vercel env / .env.local 기준).

## 다음 할 일

### 1~2. (완료) 대시보드 카드 모달화 + 에디터 AI 버튼 + 미저장 경고
모두 구현·검증 완료. 위 "현재 상태"의 미커밋 파일 목록 참고.
- 에디터 미저장 가드 한계: Next App Router in-app `<Link>` 클릭은 beforeunload 미포착.
  새로고침·탭닫기·브라우저 뒤로(문서 이탈)만 커버. SPA 내비 가드는 추후 과제.

### 3. 검증 후 커밋·배포 (남음 — 사이드 이펙트)
- 검증 끝(lint/build/스모크 200). 남은 건 커밋·푸시뿐.
- **명시적 add**로 잡파일 제외: `.claude/`,`.ai-resume/`,`scripts/_tmp-parse-subs.mjs`,
  `scripts/_tmp-query.mjs` 는 add 금지. 커밋 대상:
  `src/app/admin/posts/actions.ts src/components/admin/PostsList.tsx`
  `src/components/admin/AiModals.tsx src/components/admin/DraftQuickCard.tsx`
  `src/app/admin/page.tsx src/components/admin/PostEditor.tsx`
  (+ 원하면 `docs/CONTINUE-admin-ai.md`).
- 커밋 메시지에 co-author/AI attribution 금지(CLAUDE.md). → `git push origin main`.

## 미해결: 실서버 배포 404

- 푸시 후 `https://hyun-blog.vercel.app/admin/posts` 가 **404**였음(미들웨어 있으면
  404 아닌 307이어야 정상 → 새 배포 미반영 or 프로덕션 URL이 다름 or 빌드 실패).
- **재개 시 먼저**: Vercel 대시보드 → 프로젝트 `hyun-blog` → Deployments에서
  커밋 `5742f48`(및 다음 커밋) 상태가 **Ready**인지, **실제 프로덕션 도메인**이
  무엇인지 확인. (Vercel CLI 미설치 — `npm i -g vercel` 하면 `vercel ls`/`vercel logs`로
  진단 가능)
- 빌드 실패라면 Vercel 빌드 로그 확인. 로컬 `npm run build`는 통과하므로 env 누락
  가능성은 낮음(사용자 적용 완료). 도메인 오인일 가능성이 높음.

## 실서버 테스트 순서 (배포 정상 후)

1. `https://<프로덕션URL>/admin` 로그인(`admin1313`).
2. `글`(/admin/posts) → "URL로 초안" → Anthropic 글 링크 + 메모 → 요청.
   (YouTube는 워커 머신에 `yt-dlp` 필요. 첫 테스트는 일반 글 권장.)
3. 워커 머신(현재는 이 PC)에서 `npm run ai:worker -- --watch` 실행 → 자동 처리.
4. /admin/posts 새로고침 → draft 채워짐 → 에디터에서 검토 → 발행.
5. 개선 루프: 목록/에디터에서 🪄 개선 → 피드백 → 워커 재처리.

## 상시 운용(선택): Mac mini

`docs/ai-worker-setup.md` 참고. launchd `--watch` 등록. 헤드리스 권한은
`bypassPermissions`로 이미 검증됨 — Mac mini에서 동 문서 2번 스모크 테스트만 통과하면 됨.

## 재개 첫 명령

```
git status            # 미커밋 3파일 + 잡파일 확인
npm run build         # 그린인지
npm run dev           # 로컬 육안 확인
```
그다음 위 "다음 할 일" 1 → 2 → 3 순서.
