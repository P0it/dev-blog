-- 0011_post_source_date
-- 본문이 인용·번역한 원문의 작성/업로드 일자. 에디터에서 발행일을 이보다 앞으로
-- 잡으려 하면 경고를 띄우는 용도(원문보다 먼저 쓴 글로 적히는 사고 방지).
-- null = 원문 일자 모름(경고 없음).
alter table posts add column if not exists source_date date;
