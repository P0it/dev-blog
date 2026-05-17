-- 실험실 상세 (프로젝트 개발기 한 페이지)
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run

alter table projects
  add column if not exists slug     text,
  add column if not exists body_md  text;

-- 기존 행 slug 백필: 배포 URL 서브도메인 기준 (예: news-briefing.vercel.app → news-briefing)
-- URL 없으면 sort_order 기반 폴백.
update projects
set slug = coalesce(
  nullif(regexp_replace(lower(split_part(url, '.', 1)), '[^a-z0-9]+', '-', 'g'), ''),
  'project-' || sort_order
)
where slug is null;

-- slug 충돌 시 순번 접미사로 유일화
with dup as (
  select id,
         row_number() over (partition by slug order by sort_order, id) as rn
  from projects
)
update projects p
set slug = p.slug || '-' || dup.rn
from dup
where p.id = dup.id and dup.rn > 1;

alter table projects alter column slug set not null;
create unique index if not exists projects_slug_key on projects (slug);
