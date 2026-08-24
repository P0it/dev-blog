import { MarkdownView } from "@/components/post/MarkdownView";

// 제품 소개 — 히어로 아래에 깔리는 리드다. 처음 보는 사람이 가장 먼저 읽는 곳이라
// 활자를 한 단 키운다. 크기는 .lab-hero-lead 에서 잡는다.
export function Intro({ md }: { md: string }) {
  return (
    <div className="lab-prose lab-reveal">
      <MarkdownView md={md} />
    </div>
  );
}
