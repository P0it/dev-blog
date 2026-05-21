-- 0009_category_cleanup.sql
-- 카테고리 정리: 최상위는 Tech/Business/Design 3개만, 라벨 전부 영어.
--   Tech > Claude, Infra, AI  /  Business > Insights  /  Design (하위 없음)
-- 그 외 모든 카테고리 삭제. 삭제 대상 글은 미분류(category_slug NULL)가 된다.
--   (posts.category_slug, categories.parent_slug 모두 ON DELETE SET NULL)
-- 실행: Supabase Dashboard → SQL Editor → 통째로 붙여넣고 Run

begin;

-- 1) 유지할 최상위 카테고리 보장 (기존 한글 라벨은 영어로 갱신)
insert into categories (slug, label, parent_slug, sort_order) values
  ('tech',     'Tech',     null, 0),
  ('business', 'Business', null, 1),
  ('design',   'Design',   null, 2)
on conflict (slug) do update
  set label = excluded.label,
      parent_slug = excluded.parent_slug,
      sort_order = excluded.sort_order;

-- 2) 유지할 하위 카테고리 보장
--    (Claude/Infra/AI 신규, Insights는 기존 '인사이트' rename)
insert into categories (slug, label, parent_slug, sort_order) values
  ('claude',   'Claude',   'tech',     0),
  ('infra',    'Infra',    'tech',     1),
  ('ai',       'AI',       'tech',     2),
  ('insights', 'Insights', 'business', 0)
on conflict (slug) do update
  set label = excluded.label,
      parent_slug = excluded.parent_slug,
      sort_order = excluded.sort_order;

-- 3) 유지 7개를 제외한 모든 카테고리 삭제
--    → 해당 카테고리 글은 category_slug NULL(미분류)로 자동 전환
delete from categories
where slug not in
  ('tech', 'business', 'design', 'claude', 'infra', 'ai', 'insights');

commit;
