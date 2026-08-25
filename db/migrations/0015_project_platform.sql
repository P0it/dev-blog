-- 실험실 프로젝트의 화면 판 — 폰이냐 브라우저 창이냐
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run
--
-- 판을 그림 비율만 보고 고르던 것을 원고가 정하게 바꾼다. 데스크탑 전체 페이지
-- 캡처는 세로로 길어서 "폰의 긴 캡처"와 비율이 겹치는데, 그걸 폰 판에 넣으면
-- 좌우가 잘려 무슨 화면인지 안 읽힌다.
--
-- 기준은 쓰인 기술이 아니라 **캡처를 무엇으로 찍었는가**다. 사우나우처럼 웹으로
-- 만들었어도 폰 화면으로 쓰는 물건이면 mobile 이다. 그래서 기본값이 mobile 이고,
-- 기존 프로젝트 넷은 지금 서 있는 모습 그대로 남는다.

alter table projects
  add column if not exists platform text not null default 'mobile';

alter table projects
  drop constraint if exists projects_platform_check;

alter table projects
  add constraint projects_platform_check
  check (platform in ('mobile', 'web'));
