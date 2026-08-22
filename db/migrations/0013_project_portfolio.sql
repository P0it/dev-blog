-- 실험실 포트폴리오 개편 — 카드/히어로용 컬럼 추가, 카드에서 빠진 컬럼 제거
-- 실행: Supabase Dashboard → SQL Editor → 붙여넣고 Run

alter table projects
  add column if not exists tagline     text,
  add column if not exists logo_emoji  text,
  add column if not exists logo_bg     text,
  add column if not exists logo_url    text,
  add column if not exists status      text,
  add column if not exists hero_media  text,
  add column if not exists hero_poster text,
  add column if not exists shots       text[] not null default '{}';

-- tagline 은 기존 description 에서 가져온다 (드롭 전에 백필).
update projects set tagline = description where tagline is null;

-- 로고가 아직 없으므로 이모지·배경색 기본값을 채워 카드가 빈칸으로 뜨지 않게 한다.
update projects set logo_emoji = '🧪' where logo_emoji is null or logo_emoji = '';
update projects set logo_bg    = '#1B1C1E' where logo_bg is null or logo_bg = '';
update projects set status     = '운영중' where status is null or status = '';

-- url 은 도메인만 저장돼 있었다. 절대 URL 로 승격한다.
update projects
set url = 'https://' || url
where url is not null and url <> '' and url !~ '^https?://';

alter table projects
  drop column if exists description,
  drop column if exists plan,
  drop column if exists build_note,
  drop column if exists thumb_kind;
