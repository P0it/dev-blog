-- Initial schema for hyunwoo.blog
-- Run via: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "pgcrypto";

-- ---------- categories ----------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  parent_id   uuid references public.categories(id) on delete set null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists categories_parent_id_idx on public.categories(parent_id);

-- ---------- tags ----------
create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  created_at  timestamptz not null default now()
);

-- ---------- series ----------
create table if not exists public.series (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text,
  status       text not null default 'active' check (status in ('active','completed','paused')),
  created_at   timestamptz not null default now()
);

-- ---------- posts ----------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text,
  body_md       text not null default '',
  category_id   uuid references public.categories(id) on delete set null,
  series_id     uuid references public.series(id) on delete set null,
  series_position int,
  status        text not null default 'draft' check (status in ('draft','scheduled','published')),
  published_at  timestamptz,
  reading_min   int,
  thumb_kind    text check (thumb_kind in ('a','b','c','d','e','f')),
  is_featured   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists posts_status_published_at_idx
  on public.posts(status, published_at desc);
create index if not exists posts_category_id_idx on public.posts(category_id);
create index if not exists posts_series_id_idx on public.posts(series_id);

-- ---------- post_tags (m:n) ----------
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id  uuid not null references public.tags(id)  on delete cascade,
  primary key (post_id, tag_id)
);
create index if not exists post_tags_tag_id_idx on public.post_tags(tag_id);

-- ---------- post_featured_chips ----------
-- featured cards on the home page render small colored chips above the title.
create table if not exists public.post_featured_chips (
  id        uuid primary key default gen_random_uuid(),
  post_id   uuid not null references public.posts(id) on delete cascade,
  position  int  not null default 0,
  variant   text not null default 'default'
            check (variant in ('default','blue','purple','green','outline')),
  label     text not null
);
create index if not exists post_featured_chips_post_id_idx
  on public.post_featured_chips(post_id);

-- ---------- projects (the /lab page) ----------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  year        text not null,
  description text not null,
  plan        text,
  build       text,
  stack       text[] not null default '{}',
  url         text,
  host        text check (host in ('vercel','cloudflare')),
  thumb_kind  text check (thumb_kind in ('a','b','c','d','e','f')),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- updated_at trigger for posts ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
alter table public.categories            enable row level security;
alter table public.tags                  enable row level security;
alter table public.series                enable row level security;
alter table public.posts                 enable row level security;
alter table public.post_tags             enable row level security;
alter table public.post_featured_chips   enable row level security;
alter table public.projects              enable row level security;

-- Public can read taxonomies, series, projects, featured chips freely.
create policy "public read categories"     on public.categories          for select using (true);
create policy "public read tags"           on public.tags                for select using (true);
create policy "public read series"         on public.series              for select using (true);
create policy "public read projects"       on public.projects            for select using (true);
create policy "public read featured chips" on public.post_featured_chips for select using (true);

-- Posts: public only sees published.
create policy "public read published posts"
  on public.posts for select
  using (status = 'published');

-- post_tags: public sees rows that point at published posts.
create policy "public read post_tags of published"
  on public.post_tags for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_tags.post_id and p.status = 'published'
    )
  );

-- Authenticated (admin) sees and writes everything. Single-user blog: anyone
-- who's signed in is treated as the admin. Tighten later with a profiles
-- table + role check if needed.
create policy "auth full access categories"          on public.categories          for all to authenticated using (true) with check (true);
create policy "auth full access tags"                on public.tags                for all to authenticated using (true) with check (true);
create policy "auth full access series"              on public.series              for all to authenticated using (true) with check (true);
create policy "auth full access posts"               on public.posts               for all to authenticated using (true) with check (true);
create policy "auth full access post_tags"           on public.post_tags           for all to authenticated using (true) with check (true);
create policy "auth full access post_featured_chips" on public.post_featured_chips for all to authenticated using (true) with check (true);
create policy "auth full access projects"            on public.projects            for all to authenticated using (true) with check (true);
