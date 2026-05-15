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
