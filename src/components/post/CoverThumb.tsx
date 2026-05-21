import { Thumb } from "@/components/diagram/Thumb";
import type { Post } from "@/lib/types";

// 카드 썸네일 — 직접 지정한 커버 이미지가 있으면 그 이미지를,
// 없으면 thumb_kind 해시 패턴(Thumb)으로 폴백한다.
export function CoverThumb({ post }: { post: Post }) {
  if (post.coverImage) {
    return (
      <div className="thumb">
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
  return <Thumb kind={post.thumbKind} />;
}
