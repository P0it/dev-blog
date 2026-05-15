import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#0a0a0a",
          color: "#fff",
          padding: 72,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, opacity: 0.7 }}>
          <div style={{ width: 12, height: 12, borderRadius: 99, background: "#fff" }} />
          {SITE.name}
        </div>
        <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: "-0.025em", marginTop: 24, lineHeight: 1.05 }}>
          기록하는 개인 블로그
        </div>
        <div style={{ fontSize: 28, opacity: 0.55, marginTop: 18, letterSpacing: "-0.005em" }}>
          기술 · 독서 · 생각 · 비즈니스 · 실험
        </div>
      </div>
    ),
    size,
  );
}
