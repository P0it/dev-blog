export const SITE = {
  name: "hynu.blog",
  description: "기록하는 개인 블로그. 기술 · 독서 · 생각 · 비즈니스 · 실험.",
  author: "hynu",
  // 프로필 사진. public/ 기준 경로 (예: "/avatar.png"). 비우면 회색 원으로 폴백.
  avatarUrl: "/avatar.png",
  locale: "ko-KR",
  get url(): string {
    return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
};
