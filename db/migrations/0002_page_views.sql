-- 자체 방문 집계 테이블
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run

create table if not exists page_views (
  id          bigint generated always as identity primary key,
  path        text not null,
  slug        text,
  created_at  timestamptz not null default now()
);

create index if not exists page_views_created_idx on page_views (created_at desc);
create index if not exists page_views_slug_idx on page_views (slug);

alter table page_views enable row level security;
-- 공개 정책 없음 — service role(secret key)만 읽고 쓴다.
