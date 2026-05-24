import { Thumb } from "@/components/diagram/Thumb";
import type { ThumbKind } from "@/lib/types";

// 어드민 글 리스트용 작은 썸네일 (64×40).
// cover_image 가 있으면 이미지, 없으면 thumb_kind 추상 패턴(Thumb fill).
export function AdminPostThumb({
  coverImage,
  thumbKind,
}: {
  coverImage: string | null;
  thumbKind: ThumbKind;
}) {
  const wrap: React.CSSProperties = {
    position: "relative",
    width: 64,
    height: 40,
    flex: "0 0 auto",
    borderRadius: 6,
    overflow: "hidden",
    background: "var(--bg-base)",
  };
  if (coverImage) {
    return (
      <div style={wrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImage}
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
  return (
    <div style={wrap}>
      <Thumb kind={thumbKind} fill />
    </div>
  );
}
