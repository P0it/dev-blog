import { Check, Minus } from "lucide-react";

export function Requirements({ items }: { items: { done: boolean; text: string }[] }) {
  return (
    <div className="lab-req lab-stagger">
      {items.map((it, i) => (
        <div key={i} className={`lab-panel lab-req-item${it.done ? "" : " off"}`}>
          <span className="mark">{it.done ? <Check size={14} /> : <Minus size={14} />}</span>
          <span>{it.text}</span>
        </div>
      ))}
    </div>
  );
}
