-- 검색 강화: pg_trgm 유사도 랭킹
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run
-- 미적용이어도 앱은 동작한다. queries.ts 의 searchPosts 가 ILIKE 폴백으로 떨어진다.
-- (다국어는 휴면이라 *_en 컬럼을 참조하지 않는다. 참조하면 함수 생성 자체가 실패한다.)

create extension if not exists pg_trgm;

create index if not exists posts_title_trgm   on posts using gin (title gin_trgm_ops);
create index if not exists posts_excerpt_trgm on posts using gin (excerpt gin_trgm_ops);
create index if not exists posts_body_trgm    on posts using gin (body_md gin_trgm_ops);

-- 부분일치·태그로 필터하고, 제목/요약 유사도로 정렬해서 반환
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
      or coalesce(tags, '{}') @> array[q]
    )
  order by
    greatest(
      similarity(title, q),
      similarity(coalesce(excerpt,''), q)
    ) desc,
    published_at desc nulls last
  limit 50;
$$;
