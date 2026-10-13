-- 어드민 비주얼 편집기의 블록 단위 AI 수정
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run
--
-- block_revise 는 글 전체가 아니라 HTML 페이지 글의 section 하나를 다시 쓴다.
-- 워커는 결과를 posts 에 쓰지 않고 result_html 에만 담는다. 편집기에 저장 안 된
-- 변경이 있을 수 있어서, 수락 여부는 편집기가 정한다.

alter table ai_jobs drop constraint if exists ai_jobs_type_check;
alter table ai_jobs
  add constraint ai_jobs_type_check
  check (type in ('draft_from_url', 'revise', 'block_revise'));

alter table ai_jobs add column if not exists block_html text;   -- 입력 블록
alter table ai_jobs add column if not exists result_html text;  -- 결과 블록
