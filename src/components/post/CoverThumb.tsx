import { Thumb } from "@/components/diagram/Thumb";
import type { Post } from "@/lib/types";

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
        {/* Storage 외부 URL — next/image 설정 없이 단순 img (본문 이미지와 동일) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.coverImage}
          alt=""
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
