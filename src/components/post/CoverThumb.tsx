import { Thumb } from "@/components/diagram/Thumb";
import type { Post } from "@/lib/types";
import { imageProps } from "@/lib/img";

// 카드 썸네일 — 직접 지정한 커버 이미지가 있으면 그 이미지를,
// 없으면 thumb_kind 해시 패턴(Thumb)으로 폴백한다.
// fill: 부모를 채우는 absolute 박스로 렌더 — 포스트 히어로 배경용.
export function CoverThumb({ post, fill = false }: { post: Post; fill?: boolean }) {
  if (post.coverImage) {
    const wrapperStyle = fill
      ? ({ position: "absolute", inset: 0, overflow: "hidden" } as const)
      : undefined;
    return (
      <div className={fill ? undefined : "thumb"} style={wrapperStyle}>
        {/* Storage 원본을 직접 받으면 egress 가 쌓인다 — /_next/image 로 줄인 변환본을 받는다.
            fill(히어로)은 첫 화면이라 바로 받고, 카드 목록은 화면에 들어올 때 받는다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...imageProps(post.coverImage, fill ? "100vw" : "(min-width: 1080px) 400px, 100vw")}
          alt=""
          loading={fill ? "eager" : "lazy"}
          decoding="async"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    );
  }
  return <Thumb kind={post.thumbKind} fill={fill} />;
}
