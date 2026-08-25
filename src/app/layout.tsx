import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider, ThemeScript } from "@/lib/theme";
import { SITE } from "@/lib/site";
import { websiteJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

// 서치 콘솔 소유확인 코드. 값이 없으면 태그 자체를 안 내보낸다.
// Vercel 환경변수에 GOOGLE_SITE_VERIFICATION / NAVER_SITE_VERIFICATION 로 넣는다.
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const naverVerification = process.env.NAVER_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s — ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: SITE.name,
    description: SITE.description,
  },
  ...(googleVerification || naverVerification
    ? {
        verification: {
          ...(googleVerification ? { google: googleVerification } : {}),
          ...(naverVerification
            ? { other: { "naver-site-verification": naverVerification } }
            : {}),
        },
      }
    : {}),
  alternates: {
    canonical: SITE.url,
    types: {
      "application/rss+xml": [{ url: `${SITE.url}/rss.xml`, title: SITE.name }],
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeScript />
        <JsonLd data={websiteJsonLd()} />
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
