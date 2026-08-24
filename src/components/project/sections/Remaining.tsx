import { MarkdownView } from "@/components/post/MarkdownView";

// 남은 것 — 다음에 할 일과 알려진 한계.
// 전역 리셋이 list-style 을 죽여 놔서 마크다운 그대로 두면 줄글로 보인다.
// 항목마다 마커를 직접 그리고, 앞 문장(사실)과 뒤 문장(이유)의 무게를 가른다.
export function Remaining({ items, md }: { items: string[]; md: string }) {
  if (!items.length) {
    return (
      <div className="lab-prose">
        <MarkdownView md={md} />
      </div>
    );
  }

  return (
    <ul className="lab-left lab-stagger">
      {items.map((t, i) => {
        const m = /^(.+?[.!?])\s+(.+)$/.exec(t);
        return (
          <li key={i} className="lab-left-item">
            <span className="mark" aria-hidden />
            <span className="text">
              <b>{m ? m[1] : t}</b>
              {m && <span className="why">{m[2]}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
