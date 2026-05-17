-- 시리즈 (글을 차례로 묶어 읽기)
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run

create table if not exists series (
  slug        text primary key,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

alter table posts
  add column if not exists series_slug  text references series(slug) on delete set null,
  add column if not exists series_order  int;

create index if not exists posts_series_idx on posts (series_slug, series_order);

alter table series enable row level security;
drop policy if exists "public read series" on series;
create policy "public read series" on series for select using (true);
