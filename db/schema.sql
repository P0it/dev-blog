-- hyunwoo.blog schema v0.2
-- 실행 방법: Supabase Dashboard → SQL Editor → 이 파일 통째로 붙여넣고 Run

-- ============================================================
-- categories
-- ============================================================
create table if not exists categories (
  slug         text primary key,
  label        text not null,
  parent_slug  text references categories(slug) on delete set null,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- posts
-- ============================================================
create table if not exists posts (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  title          text not null,
  excerpt        text,
  body_md        text,                       -- 원본 마크다운
  category_slug  text references categories(slug) on delete set null,
  tags           text[] not null default '{}',
  thumb_kind     text not null default 'a',  -- 'a'..'f'
  reading_min    text,                       -- "12분" 등 표시용
  is_featured    boolean not null default false,
  featured_chips jsonb not null default '[]'::jsonb,
  status         text not null default 'draft', -- draft | published
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists posts_published_at_idx
  on posts (published_at desc) where status = 'published';
create index if not exists posts_category_idx on posts (category_slug);

-- updated_at 자동 갱신
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

drop trigger if exists posts_set_updated_at on posts;
create trigger posts_set_updated_at
  before update on posts
  for each row execute function set_updated_at();

-- ============================================================
-- projects (lab)
-- ============================================================
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  year        text not null,
  description text,
  plan        text,
  build_note  text,
  body_md     text,                          -- 개발기 본문 마크다운
  stack       text[] not null default '{}',
  thumb_kind  text not null default 'a',
  url         text,
  host        text,                          -- vercel | cloudflare
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table categories enable row level security;
alter table posts      enable row level security;
alter table projects   enable row level security;

-- 공개 읽기: published 글, 카테고리, 프로젝트
drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories
  for select using (true);

drop policy if exists "public read published posts" on posts;
create policy "public read published posts" on posts
  for select using (status = 'published');

drop policy if exists "public read projects" on projects;
create policy "public read projects" on projects
  for select using (true);

-- 쓰기는 service_role(=secret key) 만. anon/publishable 키로는 자동 차단.
-- (별도 정책 불필요. service_role은 RLS bypass.)
