-- 실험실 프로젝트에 글과 같은 draft/published 모델 도입
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run

-- status(운영중/실험중/중단)는 히어로에 노출되는 값이라 그대로 두고,
-- 사이트 노출 여부는 별도 컬럼으로 가른다. 두 질문이 한 칸에 섞이면 나중에 헷갈린다.
alter table projects
  add column if not exists visibility text not null default 'draft';

-- 이미 올라가 있던 프로젝트는 전부 공개 상태였다.
update projects set visibility = 'published' where visibility is null or visibility = '';

alter table projects
  drop constraint if exists projects_visibility_check;
alter table projects
  add constraint projects_visibility_check check (visibility in ('draft', 'published'));

create index if not exists projects_visibility_idx on projects (visibility);
