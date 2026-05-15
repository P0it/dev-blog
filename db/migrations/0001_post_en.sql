-- 영어 번역 컬럼 추가
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run

alter table posts
  add column if not exists title_en        text,
  add column if not exists excerpt_en      text,
  add column if not exists body_md_en      text,
  add column if not exists translated_at   timestamptz;
