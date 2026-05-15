# hyunwoo.blog

기록하는 개인 블로그. 기술 · 독서 · 생각 · 비즈니스 · 실험.

이 저장소는 Claude Design으로 만든 9개 화면 시안을 Next.js 15 + Tailwind CSS v4로 옮긴 **시각 디자인 정적 구현**입니다. 백엔드(Supabase), AI subprocess 초안 생성, 영어 자동 번역 등은 후속 단계에서 붙입니다.

## Stack

- Next.js 15 (App Router) · TypeScript · React 19
- Tailwind CSS v4 (`@theme` 토큰)
- Wanted Design System 토큰 (CSS 변수)
- Pretendard · Wanted Sans Variable · JetBrains Mono
- lucide-react 아이콘

## Setup

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production 빌드
npm run lint     # ESLint
```

## Supabase

데이터 레이어는 Supabase(Postgres + Auth)를 사용합니다. 처음 셋업할 때:

1. [supabase.com](https://supabase.com)에서 프로젝트를 만든다.
2. **Project Settings → API**에서 URL과 두 키를 복사한다.
3. `.env.local.example`을 `.env.local`로 복사하고 값을 채운다.
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...      # 시드/관리용. 서버 전용
   ```
4. SQL 마이그레이션을 적용한다. 가장 단순한 방법은 **Dashboard → SQL Editor**에 `supabase/migrations/0001_init.sql`을 붙여넣고 실행. CLI를 쓰려면 `supabase db push`.
5. 기존 mock 데이터를 DB에 시드한다:
   ```bash
   npm run db:seed
   ```
   `posts`, `categories`, `tags`, `projects` 테이블이 채워집니다. idempotent — 다시 돌려도 안전.

서비스 롤 키는 절대 클라이언트에 노출하지 말 것. `.env.local`은 `.gitignore`로 제외돼 있습니다.

## Routes

| 경로 | 페이지 |
|------|--------|
| `/` | 홈 — 큐레이션 + 최근 글 |
| `/posts/[slug]` | 글 상세 (TOC · 코드 블록 · 에이전트 다이어그램) |
| `/posts` | 아카이브 (연도별 + 카테고리 필터) |
| `/categories` · `/categories/[...slug]` | 카테고리 (트리 + 글 리스트) |
| `/lab` | 실험실 (프로젝트 카드 그리드) |
| `/admin` | 어드민 대시보드 (통계 + 차트 + 빠른 액션) |
| `/admin/editor` | 마크다운 에디터 (3분할 + AI 배너) |
| `/admin/editor?ai=1` | AI 초안 생성 모달 |

존재하지 않는 슬러그/경로는 `not-found.tsx`로 처리됩니다.

## 다크 모드

헤더 우측 moon/sun 아이콘으로 토글. `<html data-theme="light\|dark">` + `localStorage`. 초기 값은 시스템 `prefers-color-scheme`.

## File Layout

```
src/
├── app/                 ← App Router 페이지
├── components/
│   ├── layout/          ← Nav, Sidebar, Footer
│   ├── post/            ← FeaturedCard, PostCard, CodeBlock
│   ├── project/         ← ProjectCard
│   ├── category/        ← CategoryTree
│   ├── admin/           ← 어드민 패널 컴포넌트
│   ├── diagram/         ← Thumb, AgentLoopDiagram
│   └── ui/              ← Chip, Button, ThemeToggle
├── data/                ← 정적 mock (Post · Project · Category)
└── lib/                 ← theme provider, types
```

## 다음 단계 (이번 PR 범위 외)

- Supabase 연결 · 글 CRUD
- Claude Code subprocess로 AI 초안 생성
- 영어 자동 번역 + `/en/...` 라우팅
- RSS / sitemap.xml / 자동 OG 이미지
- 검색 (`/search`) · 통계 (`/admin/analytics`)
