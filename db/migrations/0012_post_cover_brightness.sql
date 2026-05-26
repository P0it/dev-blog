-- 0012_post_cover_brightness
-- 커버 이미지의 평균 휘도(Rec.709 luminance, 0~1).
-- 업로드 시 sharp 로 한 번 계산해 저장한다. 글 상세의 hero 위 제목/작성자
-- 텍스트 색을 이 값으로 자동 선택(밝은 사진=어두운 글씨, 어두운 사진=흰 글씨).
-- null = 미계산(외부 URL·구글 등) → 기본 다크 스크림 + 흰 글씨로 폴백.
alter table posts add column if not exists cover_brightness real;
