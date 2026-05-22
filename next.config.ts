import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Action 본문 한도(기본 1MB) — 이미지 업로드용.
    // uploadImage 가 원본 8MB까지 받으므로(이후 sharp로 압축), 멀티파트
    // 오버헤드까지 감안해 여유 있게 12MB로. 8~12MB 구간은 액션이 친절히 막는다.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
