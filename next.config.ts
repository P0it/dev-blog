import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Action 본문 한도(기본 1MB) — 썸네일/본문 이미지 업로드용.
    // uploadImage 액션이 5MB까지 허용하므로 여유 있게 8MB로.
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
