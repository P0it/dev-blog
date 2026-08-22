import { MarkdownView } from "@/components/post/MarkdownView";

// 제품 소개 — 처음 보는 사람이 읽는 곳이라 활자를 한 단 키우고 여백을 넉넉히 준다.
export function Intro({ md }: { md: string }) {
  return (
    <div className="lab-prose lab-reveal" style={{ fontSize: 15.5, lineHeight: 1.9 }}>
      <MarkdownView md={md} />
    </div>
  );
}
