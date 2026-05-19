-- 카테고리 sort_order를 '형제 그룹 내 순서'로 정규화.
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run (1회성)
--
-- 같은 parent_slug(최상위는 NULL)끼리 기존 순서를 보존하며 0..n 으로 재번호한다.
-- 어드민 드래그 트리 정렬의 1회성 정규화일 뿐 — 앱은 이 마이그레이션 없이도
-- 정상 동작한다(읽기는 그룹별로 정렬해 보여주고, 쓰기는 항상 그룹 내 명시
-- 값으로 기록한다). 적용하면 첫 렌더부터 sort_order가 깔끔해진다.

with ordered as (
  select
    slug,
    row_number() over (
      partition by parent_slug
      order by sort_order, created_at, slug
    ) - 1 as new_order
  from categories
)
update categories c
set sort_order = o.new_order
from ordered o
where c.slug = o.slug
  and c.sort_order is distinct from o.new_order;
