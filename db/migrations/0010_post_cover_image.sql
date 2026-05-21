-- 0010_post_cover_image
-- 글 카드 썸네일로 쓸 커버 이미지 URL. 지정하면 그 이미지를 카드에 쓰고,
-- null이면 기존처럼 thumb_kind 패턴(a~f)으로 폴백한다.
-- 어드민 에디터의 썸네일 슬롯에서 업로드/제거.
alter table posts add column if not exists cover_image text;
