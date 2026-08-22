export function Requirements({ items }: { items: { done: boolean; text: string }[] }) {
  return (
    <div className="lab-req lab-stagger">
      {items.map((it, i) => (
        <div key={i} className={`lab-panel lab-req-item${it.done ? "" : " off"}`}>
          <span aria-hidden>{it.done ? "▣" : "▢"}</span>
          <span>{it.text}</span>
        </div>
      ))}
    </div>
  );
}
