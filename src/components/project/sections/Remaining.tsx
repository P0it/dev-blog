import { MarkdownView } from "@/components/post/MarkdownView";

export function Remaining({ md }: { md: string }) {
  return (
    <div className="lab-prose">
      <MarkdownView md={md} />
    </div>
  );
}
