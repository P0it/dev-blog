-- AI 작업 큐 (서버에서 적재, 로컬 Mac mini 워커가 처리)
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run

create table if not exists ai_jobs (
  id           bigint generated always as identity primary key,
  type         text not null check (type in ('draft_from_url','revise')),
  post_slug    text references posts(slug) on delete cascade,
  source_url   text,
  instruction  text,                    -- 노트(초안) 또는 피드백(개선)
  status       text not null default 'pending'
                 check (status in ('pending','processing','done','error')),
  result       text,                    -- 짧은 요약/에러만 (본문 저장 금지)
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  finished_at  timestamptz
);

create index if not exists ai_jobs_status_idx on ai_jobs (status, created_at);

alter table ai_jobs enable row level security;
-- 공개 정책 없음 — service role(secret key)만 읽고 쓴다. (page_views와 동일)
