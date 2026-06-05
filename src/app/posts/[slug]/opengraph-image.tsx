import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/queries";
import { SITE } from "@/lib/site";

export const alt = "Post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PostOG({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  const title = post?.title ?? "Untitled";
  const excerpt = post?.excerpt ?? "";
  const category = post?.category ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fafafa",
          color: "#0a0a0a",
          padding: 72,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 22, opacity: 0.6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 99, background: "#0a0a0a" }} />
            {SITE.name}
          </div>
          {category && <div>{category}</div>}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          {excerpt && (
            <div
              style={{
                fontSize: 26,
                opacity: 0.55,
                marginTop: 24,
                lineHeight: 1.5,
                letterSpacing: "-0.005em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {excerpt}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, opacity: 0.5 }}>
          <span>{SITE.author}</span>
        </div>
      </div>
    ),
    size,
  );
}
