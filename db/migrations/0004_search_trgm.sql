-- 검색 강화: pg_trgm 유사도 랭킹
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run

create extension if not exists pg_trgm;

create index if not exists posts_title_trgm   on posts using gin (title gin_trgm_ops);
create index if not exists posts_excerpt_trgm on posts using gin (excerpt gin_trgm_ops);
create index if not exists posts_body_trgm    on posts using gin (body_md gin_trgm_ops);

-- 부분일치로 필터하고, 제목/요약 유사도로 정렬해서 반환
create or replace function search_posts(q text)
returns setof posts
language sql
stable
as $$
  select *
  from posts
  where status = 'published'
    and (
      title ilike '%'||q||'%'
      or coalesce(excerpt,'') ilike '%'||q||'%'
      or coalesce(body_md,'') ilike '%'||q||'%'
      or coalesce(title_en,'') ilike '%'||q||'%'
      or coalesce(excerpt_en,'') ilike '%'||q||'%'
      or coalesce(body_md_en,'') ilike '%'||q||'%'
    )
  order by
    greatest(
      similarity(title, q),
      similarity(coalesce(excerpt,''), q),
      similarity(coalesce(title_en,''), q)
    ) desc,
    published_at desc nulls last
  limit 50;
$$;
