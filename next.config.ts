import type { NextConfig } from "next";

// Storage 이미지를 /_next/image 로 최적화하려면 원본 호스트를 허용해야 한다.
const supabaseHost = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://wzaqtubtqwpddouevwbk.supabase.co",
).hostname;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
    // 변환 폭을 3단계로 묶어 변환 횟수(=Vercel 사용량)를 줄인다. src/lib/img.ts 의 WIDTHS 와 맞춘다.
    deviceSizes: [640, 1080, 1920],
    imageSizes: [384],
    qualities: [75],
    formats: ["image/webp"],
    // 업로드 파일명에 날짜·id·타임스탬프가 들어가 내용이 바뀌면 주소도 바뀐다 — 오래 캐시해도 안전.
    minimumCacheTTL: 31536000,
  },
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
